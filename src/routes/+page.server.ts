import prisma from '$lib/server/prisma';
import type * as Types from '@prisma/client';
import { getDistanceFromLatLonInKm } from '$lib/server/helpers';
import { CalendarDate } from '@internationalized/date';
import * as settings from '$lib/server/settings';
import { redirect } from '@sveltejs/kit';
import { pad } from '$lib/helpers';
// import type { PageServerLoad } from './$types';
// import type { PageData } from './$types';


const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const SEVEN_DAYS = 7 * TWENTY_FOUR_HOURS;
const TEN_DAYS = 10 * TWENTY_FOUR_HOURS;
const THIRTY_DAYS = 30 * TWENTY_FOUR_HOURS;


export const load = async ({ parent, url }) => {

  const sets = await settings.getMany('general.timezone', 'system.debug');
  const timeZone = sets['general.timezone'];
  const debug = sets['system.debug'];

  const numTours = await prisma.tour.count();
  const lastTour = await prisma.tour.findFirst({ orderBy: { startTime_utc: 'desc' }});


  // Calculate some details about the last tour
  const lastTourStart = (lastTour?.startTime_utc !== undefined ? new Date((lastTour.startTime_utc - 86400) * 1000) : new Date());
  const lastTourEnd = (lastTour?.endTime_utc !== undefined && lastTour?.endTime_utc !== null ? new Date((lastTour.endTime_utc + 86400) * 1000) : new Date((new Date()).getTime() + 86400 * 1000));

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

  // If there is not start and end window (because the user didn't put one in and there is no tour to fallback on), retry with Year to Date values
  if (start === null || end === null) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const startStr = `${year}-01-01`;
    const endStr = `${year}-${pad(month, 2)}-${pad(day, 2)}`;
    throw redirect(301, `/?start=${startStr}&end=${endStr}&preset=ytd`)
  }

  let s = Math.floor(start.toDate(timeZone).getTime() / 1000);
  let sCal = start;

  let e = Math.floor(end.toDate(timeZone).getTime() / 1000) + 86400;
  let eCal = end;

  const highlightDates: string[] = [];

  const toursSimple = await prisma.tour.findMany({ orderBy: { startTime_utc: 'asc' }, select: { startTime_utc: true, endTime_utc: true } });
  for (const t of toursSimple) {
    const sDate = new Date(t.startTime_utc * 1000);
    const eDate = t.endTime_utc === null ? new Date() : new Date(t.endTime_utc * 1000);

    const start = new CalendarDate(sDate.getFullYear(), sDate.getMonth() + 1, sDate.getDate());
    const end = new CalendarDate(eDate.getFullYear(), eDate.getMonth() + 1, eDate.getDate());

    let current = start.copy();
    while (current.compare(end) <= 0) {
      const str = current.toString();
      if (!highlightDates.includes(str)) highlightDates.push(str);
      current = current.add({ days: 1 });
    }
  }

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
  }, orderBy: { startTime_utc: 'asc' }, include: { legs: { include: { aircraft: true, positions: true, originAirport: true, destinationAirport: true, diversionAirport: true, _count: { select: { approaches: true } } } }, deadheads: true } });

  const posGroups: [number, number][][] = [];
  const posGroupsIDs: string[] = [];
  const airports: Types.Prisma.AirportGetPayload<{ select: { id: true, latitude: true, longitude: true }}>[] = [];
  let operations = 0;

  const acTypeList: { [key: string]: number } = {};
  const acList: { id: string, time: number }[] = [];
  for (const day of days) {
    for (const leg of day.legs) {
      if (leg.aircraft.aircraftTypeId in acTypeList) {
        acTypeList[leg.aircraft.aircraftTypeId] += leg.totalTime;
      } else {
        acTypeList[leg.aircraft.aircraftTypeId] = leg.totalTime;
      }

      const idx = acList.findIndex((v) => v.id === leg.aircraftId);
      if (idx !== -1) {
        acList[idx].time += leg.totalTime;
      } else {
        acList.push({ id: leg.aircraftId, time: leg.totalTime});
      }

      const posGroup: [number, number][] = [];
      for (const p of leg.positions) posGroup.push([p.latitude, p.longitude]);
      posGroups.push(posGroup);
      posGroupsIDs.push(leg.id);

      operations += 2;

      if (airports.findIndex((a) => a.id === leg.originAirportId) === -1 && leg.originAirport !== null) airports.push({ id: leg.originAirport.id, latitude: leg.originAirport.latitude, longitude: leg.originAirport.longitude });
      if (leg.diversionAirportId !== null && leg.diversionAirport !== null) {
        if (airports.findIndex((a) => a.id === leg.diversionAirportId) === -1) airports.push({ id: leg.diversionAirportId, latitude: leg.diversionAirport.latitude, longitude: leg.diversionAirport.longitude });
      } else {
        if (airports.findIndex((a) => a.id === leg.destinationAirportId) === -1 && leg.destinationAirport !== null) airports.push({ id: leg.destinationAirport.id, latitude: leg.destinationAirport.latitude, longitude: leg.destinationAirport.longitude });
      }
    }
  }

  let legs = await prisma.leg.findMany({
    where: {
      AND: [
        { startTime_utc: { gte: s } },
        { endTime_utc: { lte: e } },
        { day: null }
      ]
    }, orderBy: { startTime_utc: 'asc' }, include: { aircraft: true, positions: true, originAirport: true, destinationAirport: true, diversionAirport: true, _count: { select: { approaches: true } } }
  });

  for (const leg of legs) {
    if (leg.aircraft.aircraftTypeId in acTypeList) {
      acTypeList[leg.aircraft.aircraftTypeId] += leg.totalTime;
    } else {
      acTypeList[leg.aircraft.aircraftTypeId] = leg.totalTime;
    }

    const idx = acList.findIndex((v) => v.id === leg.aircraftId);
    if (idx !== -1) {
      acList[idx].time += leg.totalTime;
    } else {
      acList.push({ id: leg.aircraftId, time: leg.totalTime });
    }

    const posGroup: [number, number][] = [];
    for (const p of leg.positions) posGroup.push([p.latitude, p.longitude]);
    posGroups.push(posGroup);
    posGroupsIDs.push(leg.id);

    operations += 2;

    if (airports.findIndex((a) => a.id === leg.originAirportId) === -1 && leg.originAirport !== null) airports.push({ id: leg.originAirport.id, latitude: leg.originAirport.latitude, longitude: leg.originAirport.longitude });
    if (leg.diversionAirportId !== null && leg.diversionAirport !== null) {
      if (airports.findIndex((a) => a.id === leg.diversionAirportId) === -1) airports.push({ id: leg.diversionAirportId, latitude: leg.diversionAirport.latitude, longitude: leg.diversionAirport.longitude });
    } else {
      if (airports.findIndex((a) => a.id === leg.destinationAirportId) === -1 && leg.destinationAirport !== null) airports.push({ id: leg.destinationAirport.id, latitude: leg.destinationAirport.latitude, longitude: leg.destinationAirport.longitude });
    }
  }

  acList.sort((a, b) => a.time - b.time);

  let mostCommonTypeID: string | null = null;
  let maxTime = -1;
  for (const key of Object.keys(acTypeList)) {
    const type = acTypeList[key];
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
  let periodFlight = 0;
  let periodDuty = 0;
  
  let lastDayEndUTC = -1;
  let avgRest = 0;
  let restIndex = 0;
  let shortestRest = -1;


  for (const day of days) {
    const dayDuration = day.endTime_utc - day.startTime_utc;
    dutyDayDuration += dayDuration;
    if (dayDuration > longestDayDuration) longestDayDuration = dayDuration;

    // Calculate rest
    console.log(day.startTime_utc, lastDayEndUTC);
    if (lastDayEndUTC !== -1 && day.startTime_utc - lastDayEndUTC <= 86400 * 1.5) {
      const rest = day.startTime_utc - lastDayEndUTC;
      if (shortestRest === -1 || rest < shortestRest) shortestRest = rest;
      avgRest += rest;
      restIndex++;
    }
    lastDayEndUTC = day.endTime_utc;

    for (const leg of day.legs) {
      periodFlight += leg.totalTime;
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

  if (restIndex > 0) avgRest = avgRest / restIndex;
  console.log('sr', shortestRest);
  if (shortestRest <= 0) shortestRest = NaN;

  miles = miles * 0.54;

  periodDuty = dutyDayDuration;
  if (days.length !== 0) dutyDayDuration = dutyDayDuration / days.length;
  if (timeCounter !== 0) groundSpeed = groundSpeed / timeCounter;

  type DayStat = { id: number | null, index: number, dateString: string, onTour: boolean, startTime: number, flight: number | null, distance: number | null, duty: number | null };

  let statistics: DayStat[] = []

  let dayIndex = 0;

  let cal = sCal.copy();

  while (cal.compare(eCal) <= 0) {
    const date = cal.toDate(timeZone);
    const start = Math.floor(date.getTime() / 1000);
    const end = Math.round(date.getTime() / 1000 + TWENTY_FOUR_HOURS);

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
    }

    statistics.push(stat);

    cal = cal.add({ days: 1 });
  }

  let flightSum = 0;
  let dutySum = 0;
  let bestRatio = 0;
  for (const s of statistics) {
    if (s.flight !== null) flightSum += s.flight;
    if (s.duty !== null) dutySum += (s.duty / 60 / 60);

    if (s.flight !== null && s.duty !== null && s.duty !== 0){
      const d = s.duty / 60 / 60;
      if (s.flight / d > bestRatio) bestRatio = s.flight / d;
    }
  }

  const mostCommonAC = mostCommonTypeID === null ? null : await prisma.aircraftType.findUnique({ where: { id: mostCommonTypeID } })

  const now = Math.floor((new Date()).getTime() / 1000);
  const flightTimeLegs = await prisma.leg.findMany({
    where: {
      AND: [
        { startTime_utc: { gte: now - THIRTY_DAYS } },
        { endTime_utc: { lte: now } },
      ]
    },
    select: { totalTime: true, startTime_utc: true },
    orderBy: { startTime_utc: 'asc' }
  });

  let one = 0;
  let seven = 0;
  let thirty = 0;
  for (const l of flightTimeLegs) {
    if (l.startTime_utc !== null && l.startTime_utc >= now - TWENTY_FOUR_HOURS) one += l.totalTime;
    if (l.startTime_utc !== null && l.startTime_utc >= now - SEVEN_DAYS) seven += l.totalTime;
    if (l.startTime_utc !== null && l.startTime_utc >= now - THIRTY_DAYS) thirty += l.totalTime;
  }

  return {
    lastTour,
    groundSpeed,
    miles,
    rest:{
      avg: avgRest,
      shortest: shortestRest,
    },
    positions: posGroups,
    legIDs: posGroupsIDs,
    airports,
    operations,
    mostCommonAC: {
      time: maxTime,
      ac: mostCommonAC,
    },
    acList,
    dutyDays: {
      duration: {
        avg: dutyDayDuration,
        longest: longestDayDuration
      },
      highlightDates,
      num: numDutyDays,
      statistics,
      ratio: {
        sum: {
          flight: flightSum,
          duty: dutySum
        },
        best: bestRatio,
        avg: {
          flight: statistics.length === 0 ? 0 : flightSum / statistics.length,
          duty: statistics.length === 0 ? 0 : dutySum / statistics.length,
        }
      }
    },
    times: {
      one,
      seven,
      thirty,
      period: {
        duty: periodDuty / 60 / 60,
        flight: periodFlight
      }
    }
  };
  
}