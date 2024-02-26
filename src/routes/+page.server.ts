import prisma from '$lib/server/prisma';
import { getDistanceFromLatLonInKm } from '$lib/server/helpers';
import { CalendarDate } from '@internationalized/date';
import * as settings from '$lib/server/settings';

export const load = async ({ url }) => {

  const timeZone = await settings.get('general.timezone');

  const legs = await prisma.leg.findMany({ select: { totalTime: true } });
  const numTours = await prisma.tour.count();
  const days = await prisma.leg.findMany({ select: { startTime_utc: true, endTime_utc: true } });
  const lastTour = await prisma.tour.findFirst({ orderBy: { startTime_utc: 'desc' }});

  let legSum = 0;
  for (const l of legs) legSum += l.totalTime;

  let dutySum = 0;
  for (const d of days) {
    if (d.endTime_utc === null || d.startTime_utc === null) continue;
    dutySum += d.endTime_utc - d.startTime_utc;
  }


  // Calculate some details about the last tour
  const lastTourStart = (lastTour?.startTime_utc !== undefined ? new Date(lastTour.startTime_utc * 1000) : null);
  const lastTourEnd = (lastTour?.endTime_utc !== undefined && lastTour?.endTime_utc !== null ? new Date(lastTour.endTime_utc * 1000) : null);

  // Get the start and end params
  const start = url.searchParams.get('start') === null ? lastTourStart : new Date(url.searchParams.get('start') as string);
  const end = url.searchParams.get('end') === null ? lastTourEnd : new Date(url.searchParams.get('end') as string);

  const getData = async () => {
    if (start === null || end === null) return null;

    let s = Math.floor(start.getTime() / 1000);
    let sCal = new CalendarDate(start.getFullYear(), start.getMonth() + 1, start.getDate() + 1);

    let e = Math.round(end.getTime() / 1000);
    let eCal = new CalendarDate(end.getFullYear(), end.getMonth() + 1, end.getDate() + 1);

    const tours = await prisma.tour.findMany({ where: {
      OR: [
        { AND: [
          { startTime_utc: { gte: s } },
          { endTime_utc: { lte: e } },
        ]},
        { AND: [
          { startTime_utc: { gte: s } },
          { endTime_utc: null },
        ]},
      ]
    }, orderBy: { startTime_utc: 'asc' }});

    const days = await prisma.dutyDay.findMany({ where: {
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
    let longestDayDuration = 0;

    type DayStat = { id: number | null, index: number, dateString: string, onTour: boolean, startTime: number, flight: number | null, distance: number | null, duty: number | null };

    let statistics: DayStat[] = []

    let dayIndex = 0;

    let cal = sCal.copy();

    console.log(sCal, eCal);

    while (cal.compare(eCal) <= 0) {
      const date = cal.toDate(timeZone);
      const start = Math.floor(date.getTime() / 1000);
      const end = Math.round(date.getTime() / 1000 + 86400);

      console.log('starting', date, cal.compare(eCal));

      // Find if a tour fits this day
      let toursCoveringDay: typeof tours = [];
      for (const t of tours) {
        if (t.endTime_utc === null) {
          // The tour is in-progress. Just check if it started before the day ended
          if (t.startTime_utc <= end) toursCoveringDay.push(t);
        } else {
          // The tour is completed.
          // Check that the day is fully contained by the tour
          if (start >= t.startTime_utc && end <= t.endTime_utc) toursCoveringDay.push(t);
          // Check that the day overlaps the start
          else if (start <= t.startTime_utc && (end >= t.startTime_utc && end <= t.endTime_utc)) toursCoveringDay.push(t)
          // Check that the day overlaps the end
          else if (end >= t.endTime_utc && (start >= t.startTime_utc && start <= t.endTime_utc)) toursCoveringDay.push(t)
        }
      }

      // Find if a day fits this day
      let daysCoveringDay: typeof days = [];
      for (const d of days) {
        // Check that the day is fully contained by the dutyDay
        if (start >= d.startTime_utc && end <= d.endTime_utc) {
          daysCoveringDay.push(d);
          continue;
        }
        // Check that the day overlaps the start
        else if (start <= d.startTime_utc && (end >= d.startTime_utc && end <= d.endTime_utc)) {
          daysCoveringDay.push(d)
          continue;
        }
        // Check that the day overlaps the end
        else if (end >= d.endTime_utc && (start >= d.startTime_utc && start <= d.endTime_utc)) {
          daysCoveringDay.push(d)
          continue;
        }
        console.log('day did not apply', d);
      }


      const stat: DayStat = {
        id: null,
        index: dayIndex++,
        dateString: cal.toString(),
        onTour: toursCoveringDay.length > 0,
        startTime: start,
        flight: null,
        distance: null,
        duty: null
      }


      for (const day of daysCoveringDay) {
        const dayDuration = day.endTime_utc - day.startTime_utc;
        let flightTime = 0;
        let distance = 0;
        for (const leg of day.legs) {
          if (leg.positions.length <= 1) continue;
          let lastPos = leg.positions[0];
          flightTime += leg.totalTime;
          for (let i = 1; i < leg.positions.length; i++) {
            const pos = leg.positions[i];
            const dist = getDistanceFromLatLonInKm(lastPos.latitude, lastPos.longitude, pos.latitude, pos.longitude);
            const duration = pos.timestamp - lastPos.timestamp;
            miles += dist;
            distance += dist;
            timeCounter += duration;
            groundSpeed += pos.groundspeed * duration;
            lastPos = pos;
          }
        }

        //TODO: We will only ever record the first day seen with this loop
        stat.flight = flightTime;
        stat.distance = distance;
        stat.duty = dayDuration
        break;
      }

      statistics.push(stat);

      cal = cal.add({ days: 1 });
    }


    // if (days.length > 0){

    //   // Pad before days exist
    //   for (let i = s; i < days[0].startTime_utc - 86400; i += 86400) {
    //     statistics.push({
    //       id: null,
    //       index: dayIndex++,
    //       // dateString: 
    //       startTime: i,
    //       flight: null,
    //       distance: null,
    //       duty: null,
    //     })
    //   }

    //   for (const day of days) {
    //     const dayDuration = day.endTime_utc - day.startTime_utc;
    //     let flightTime = 0;
    //     let distance = 0;
    //     dutyDayDuration += dayDuration;
    //     if (dayDuration > longestDayDuration) longestDayDuration = dayDuration;
    //     for (const leg of day.legs) {
    //       if (leg.positions.length <= 1) continue;
    //       let lastPos = leg.positions[0];
    //       flightTime += leg.totalTime;
    //       for (let i = 1; i < leg.positions.length; i++) {
    //         const pos = leg.positions[i];
    //         const dist = getDistanceFromLatLonInKm(lastPos.latitude, lastPos.longitude, pos.latitude, pos.longitude);
    //         const duration = pos.timestamp - lastPos.timestamp;
    //         miles += dist;
    //         distance += dist;
    //         timeCounter += duration;
    //         groundSpeed += pos.groundspeed * duration;
    //         lastPos = pos;
    //       }
    //     }

    //     // Check if there is a gap in days
    //     // console.log(day.startTime_utc - statistics[statistics.length - 1].startTime);
    //     if (statistics.length > 0 && day.startTime_utc - statistics[statistics.length-1].startTime >= 86400) {
    //       for (let i = statistics[statistics.length - 1].startTime + 86400; i < day.startTime_utc - 86400; i += 86400) {
    //         statistics.push({
    //           id: null,
    //           startTime: i,
    //           flight: null,
    //           distance: null,
    //           duty: null,
    //         })    
    //       }
    //     }


    //     // Add the day to the statistics
    //     statistics.push({
    //       id: day.id,
    //       startTime: day.startTime_utc,
    //       flight: flightTime,
    //       distance,
    //       duty: dayDuration
    //     })
    //   }

    //   // Pad after days end
    //   for (let i = days[days.length - 1].startTime_utc + 86400; i < e; i += 86400) {
    //     statistics.push({
    //       id: null,
    //       startTime: i,
    //       flight: null,
    //       distance: null,
    //       duty: null,
    //     })
    //   }
    // } else {
    //   // No days, just padding
    //   for (let i = s; i < e; i += 86400) {
    //     statistics.push({
    //       id: null,
    //       startTime: i,
    //       flight: null,
    //       distance: null,
    //       duty: null,
    //     })
    //   }
    // }

    for (const day of days) {
      const dayDuration = day.endTime_utc - day.startTime_utc;
      dutyDayDuration += dayDuration;
      if (dayDuration > longestDayDuration) longestDayDuration = dayDuration;
    }

    miles = miles * 0.54;

    if (days.length !== 0) dutyDayDuration = dutyDayDuration / days.length;
    if (timeCounter !== 0) groundSpeed = groundSpeed / timeCounter;

    const mostCommonAC = mostCommonTypeID === null ? null : await prisma.aircraftType.findUnique({ where: { id: mostCommonTypeID } })

    console.log('stats', statistics);

    return {
      // tours,
      // days,
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
        num: days.length,
        statistics
      }
    };
  }


  return {
    numLegs: legs.length,
    numTours,
    avgDutyDayLength: dutySum / days.length,
    avgLegLength: legSum / legs.length,
    lastTour,
    async: {
      data: await getData()
    },
  }
}