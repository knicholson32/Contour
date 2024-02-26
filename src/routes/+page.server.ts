import prisma from '$lib/server/prisma';
import { getDistanceFromLatLonInKm } from '$lib/server/helpers';
import { CalendarDate } from '@internationalized/date';
import * as settings from '$lib/server/settings';

const TEN_DAYS = 10 * 24 * 60 * 60;

export const load = async ({ url }) => {

  const timeZone = await settings.get('general.timezone');

  const legs = await prisma.leg.findMany({ select: { totalTime: true } });
  const numTours = await prisma.tour.count();
  const lastTour = await prisma.tour.findFirst({ orderBy: { startTime_utc: 'desc' }});

  let legSum = 0;
  for (const l of legs) legSum += l.totalTime;


  // Calculate some details about the last tour
  const lastTourStart = (lastTour?.startTime_utc !== undefined ? new Date((lastTour.startTime_utc - 86400) * 1000) : null);
  const lastTourEnd = (lastTour?.endTime_utc !== undefined && lastTour?.endTime_utc !== null ? new Date((lastTour.endTime_utc + 86400) * 1000) : null);

  // Get the start and end params
  let start: CalendarDate | null = null;
  let end: CalendarDate | null = null;

  if (url.searchParams.get('start') === null) {
    if (lastTourStart !== null) start = new CalendarDate(lastTourStart.getFullYear(), lastTourStart.getMonth() + 1, lastTourStart.getDate());
  } else {
    const s = url.searchParams.get('start') as string;  // Eg: 2024-04-10
    start = new CalendarDate(parseInt(s.substring(0, 4)), parseInt(s.substring(5, 7)), parseInt(s.substring(8, 10)));
  }

  if (url.searchParams.get('end') === null) {
    if (lastTourEnd !== null) end = new CalendarDate(lastTourEnd.getFullYear(), lastTourEnd.getMonth() + 1, lastTourEnd.getDate());
  } else {
    const s = url.searchParams.get('end') as string;  // Eg: 2024-04-10
    end = new CalendarDate(parseInt(s.substring(0, 4)), parseInt(s.substring(5, 7)), parseInt(s.substring(8, 10)));
  }

  if (start === null || end === null) return null;

  let s = Math.floor(start.toDate(timeZone).getTime() / 1000);
  let sCal = start;

  let e = Math.floor(end.toDate(timeZone).getTime() / 1000);
  let eCal = end;

  const tours = await prisma.tour.findMany({ where: {
    OR: [
      { AND: [
        { startTime_utc: { gte: s - TEN_DAYS } },
        { endTime_utc: { lte: e + TEN_DAYS } },
      ]},
      { AND: [
        { startTime_utc: { gte: s - TEN_DAYS } },
        { endTime_utc: null },
      ]},
    ]
  }, orderBy: { startTime_utc: 'asc' }});

  let days = await prisma.dutyDay.findMany({ where: {
    AND: [
      { startTime_utc: { gte: s } },
      { endTime_utc: { lte: e } },
    ]
  }, orderBy: { startTime_utc: 'asc' }, include: { legs: { include: { aircraft: true, positions: true, _count: { select: { approaches: true } } } }, deadheads: true } });

  const aircraftList: { [key: string]: number } = {}
  for (const day of days) {
    for (const leg of day.legs) {
      if (leg.aircraft.aircraftTypeId in aircraftList) {
        aircraftList[leg.aircraft.aircraftTypeId] += leg.totalTime;
      } else {
        aircraftList[leg.aircraft.aircraftTypeId] = leg.totalTime;
      }
    }
  }

  let mostCommonTypeID: string | null = null;
  let maxTime = -1;
  for (const key of Object.keys(aircraftList)) {
    const type = aircraftList[key];
    if (type > maxTime) {
      maxTime = type;
      mostCommonTypeID = key;
    }
  }

  let miles = 0;
  let groundSpeed = 0;
  let timeCounter = 0;
  let dutyDayDuration = 0;
  let numDutyDays = days.length;
  let longestDayDuration = 0;

  for (const day of days) {
    const dayDuration = day.endTime_utc - day.startTime_utc;
    dutyDayDuration += dayDuration;
    if (dayDuration > longestDayDuration) longestDayDuration = dayDuration;
    for (const leg of day.legs) {
      if (leg.positions.length <= 1) continue;
      let lastPos = leg.positions[0];
      for (let i = 1; i < leg.positions.length; i++) {
        const pos = leg.positions[i];
        const dist = getDistanceFromLatLonInKm(lastPos.latitude, lastPos.longitude, pos.latitude, pos.longitude);
        const duration = pos.timestamp - lastPos.timestamp;
        miles += dist;
        timeCounter += duration;
        groundSpeed += pos.groundspeed * duration;
        lastPos = pos;
      }
    }
  }

  miles = miles * 0.54;

  if (days.length !== 0) dutyDayDuration = dutyDayDuration / days.length;
  if (timeCounter !== 0) groundSpeed = groundSpeed / timeCounter;

  type DayStat = { id: number | null, index: number, dateString: string, onTour: boolean, startTime: number, flight: number | null, distance: number | null, duty: number | null };

  let statistics: DayStat[] = []

  let dayIndex = 0;

  let cal = sCal.copy();

  console.log(sCal, eCal);

  while (cal.compare(eCal) <= 0) {
    const date = cal.toDate(timeZone);
    const start = Math.floor(date.getTime() / 1000);
    const end = Math.round(date.getTime() / 1000 + 86400);

    console.log('starting', date, cal.compare(eCal), start, end);

    // Find if a tour fits this day
    let isOnTour = false;
    for (const t of tours) {
      if (t.endTime_utc === null) {
        // The tour is in-progress. Just check if it started before the day ended
        if (t.startTime_utc <= end) {
          isOnTour = true;
          break;
        }
      } else {
        // The tour is completed.
        // Check that the day is fully contained by the tour
        if (start >= t.startTime_utc && end <= t.endTime_utc) {
          isOnTour = true;
          break;
        }
        // // Check that the day overlaps the start
        // else if (start <= t.startTime_utc && (end >= t.startTime_utc && end <= t.endTime_utc)) toursCoveringDay.push(t)
        // // Check that the day overlaps the end
        // else if (end >= t.endTime_utc && (start >= t.startTime_utc && start <= t.endTime_utc)) toursCoveringDay.push(t)
      }
    }

    // Find if a day fits this day
    let targetDay: typeof days[0] | null = null;
    for (const d of days) {
      // Check if the duty day is fully contained by this date
      if (start <= d.startTime_utc && end >= d.endTime_utc) {
        targetDay = d;
        break;
      }
      // Check that the day overlaps the start
      else if (start <= d.startTime_utc && (end >= d.startTime_utc && end <= d.endTime_utc)) {
        targetDay = d;
        break;
      }
      // Check that the day overlaps the end
      else if (end >= d.endTime_utc && (start >= d.startTime_utc && start <= d.endTime_utc)) {
        targetDay = d;
        break;
      }
      console.log('day did not apply', start, d.startTime_utc, '|', end, d.endTime_utc);
    }

    const stat: DayStat = {
      id: null,
      index: dayIndex++,
      dateString: cal.toString(),
      onTour: isOnTour,
      startTime: start,
      flight: null,
      distance: null,
      duty: null
    }

    // If the day exists, remove it from the pool
    if (targetDay !== null) {
      days = days.filter((d) => d.id !== targetDay?.id);
      const dayDuration = targetDay.endTime_utc - targetDay.startTime_utc;
      let flightTime = 0;
      let distance = 0;
      for (const leg of targetDay.legs) {
        if (leg.positions.length <= 1) continue;
        let lastPos = leg.positions[0];
        flightTime += leg.totalTime;
        for (let i = 1; i < leg.positions.length; i++) {
          const pos = leg.positions[i];
          const dist = getDistanceFromLatLonInKm(lastPos.latitude, lastPos.longitude, pos.latitude, pos.longitude);
          distance += dist;
          lastPos = pos;
        }
      }

      stat.flight = flightTime;
      stat.distance = distance / 1.15;
      stat.duty = dayDuration
    } else {
      console.log('no target day');
    }

    statistics.push(stat);

    cal = cal.add({ days: 1 });
  }

  const mostCommonAC = mostCommonTypeID === null ? null : await prisma.aircraftType.findUnique({ where: { id: mostCommonTypeID } })

  return {
    numLegs: legs.length,
    numTours,
    avgLegLength: legSum / legs.length,
    lastTour,
    groundSpeed,
    miles,
    mostCommonAC: {
      time: maxTime,
      ac: mostCommonAC,
    },
    dutyDays: {
      duration: {
        avg: dutyDayDuration,
        longest: longestDayDuration
      },
      num: numDutyDays,
      statistics
    }
  }
  
}