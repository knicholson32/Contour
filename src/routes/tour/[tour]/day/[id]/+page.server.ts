import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { timeStrAndTimeZoneToUTC } from '$lib/helpers';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { generateDeadheads } from '$lib/server/db/deadhead';
import { filterOutliers, generateAirportList, getDistanceFromLatLonInKm } from '$lib/server/helpers';

const AVG_FILTER_NUM = 2;

export const load = async ({ fetch, params, parent }) => {

  const entrySettings = await settings.getSet('entry');

  if (isNaN(parseInt(params.tour))) throw redirect(301, '/tour');
  const currentTour = await prisma.tour.findUnique({
    where: { id: parseInt(params.tour) },
  });
  if (currentTour === null) throw redirect(301, '/tour/new');

  const days = await prisma.dutyDay.findMany({
    where: {
      tourId: parseInt(params.tour)
    },
    select: {
      id: true,
      startAirportId: true,
      endAirportId: true,
      startTime_utc: true,
    },
    orderBy: {
      startTime_utc: 'asc'
    }
  });

  const currentDay = await prisma.dutyDay.findUnique({
    where: { 
      id: parseInt(params.id)
    },
    include: {
      legs: {
        orderBy: {
          startTime_utc: 'asc'
        },
        include: {
          positions: true
        }
      },
      deadheads: {
        orderBy: {
          startTime_utc: 'asc'
        },
        include: {
          originAirport: true,
          destinationAirport: true
        }
      },
      startAirport: {
        select: { 
          id: true,
          timezone: true
        }
      },
      endAirport: {
        select: { 
          id: true,
          timezone: true
        }
      },
      tour: true
    },
  });
  if (currentDay === null) throw redirect(301, '/tour/' + currentTour.id + '/day/new');

  const legDeadheadCombo: ((typeof currentDay.deadheads[0] | typeof currentDay.legs[0]) & { type: 'deadhead' | 'leg', diversionAirportId: string | null })[] = [];
  for (const leg of currentDay.legs) legDeadheadCombo.push({...leg, type: 'leg'});
  for (const dead of currentDay.deadheads) legDeadheadCombo.push({...dead, type: 'deadhead', diversionAirportId: null});
  legDeadheadCombo.sort((a, b) => {
    if (a.startTime_utc === null || b.startTime_utc === null) return 0;
    return a.startTime_utc - b.startTime_utc
  });

  const airports = await ((await fetch('/api/airports')).json()) as API.Airports;

  const airportsInOrder: (string | null)[] = [];
  for (const l of legDeadheadCombo) {
    airportsInOrder.push(l.originAirportId);
    airportsInOrder.push(l.destinationAirportId);
    airportsInOrder.push(l.diversionAirportId);
  }

  console.log(airportsInOrder);
  console.log(await generateAirportList(...airportsInOrder));

  const duty = (currentDay.endTime_utc - currentDay.startTime_utc) / 60 / 60;
  let flight = 0;
  let distance = 0;
  let apts: string[] = [];
  let operations = 0;
  let speed = 0;
  let numPositions = 0;

  let speeds: number[] = [];


  for (const leg of currentDay.legs) {
    flight += leg.totalTime;
    if (!apts.includes(leg.originAirportId)) apts.push(leg.originAirportId);
    if (!apts.includes(leg.destinationAirportId)) apts.push(leg.destinationAirportId);
    if (leg.diversionAirportId !== null && !apts.includes(leg.diversionAirportId)) apts.push(leg.diversionAirportId);
    operations += 2;
    if (leg.positions.length > 1) {
      let lastPos = leg.positions[0];
      numPositions += leg.positions.length;
      speed = speed + lastPos.groundspeed;
      speeds.push(lastPos.groundspeed);
      for (let i = 1; i < leg.positions.length; i++) {
        const pos = leg.positions[i];
        distance = distance + getDistanceFromLatLonInKm(lastPos.latitude, lastPos.longitude, pos.latitude, pos.longitude);
        speed = speed + pos.groundspeed;
        speeds.push(pos.groundspeed);
        lastPos = pos;
      }
    }
  }

  speeds = filterOutliers(speeds);
  speeds.sort((a, b) => b - a);

  console.log(speeds);

  let fastestSpeed = 0;
  if (speeds.length > 0) {
    let filteredCount = 0;
    for (let i = 0; i < AVG_FILTER_NUM && i < speeds.length; i++) {
      filteredCount++;
      fastestSpeed = fastestSpeed + speeds[i];
    }
    fastestSpeed = fastestSpeed / filteredCount;
  }


  distance = distance * 0.54;
  if (numPositions > 0) speed = speed / numPositions;

  return {
    params,
    entrySettings,
    currentDay,
    currentTour,
    airportList: await generateAirportList(...airportsInOrder),
    legDeadheadCombo,
    stats: {
      flight,
      duty,
      distance,
      airports: apts.length,
      speed,
      fastestSpeed,
      operations
    },
    days,
    airports: (airports.ok === true) ? airports.airports : [] as API.Types.Airport[]
  }
}

export const actions = {
  update: async ({ request, url, params }) => {

    const aeroAPIKey = await settings.get('general.aeroAPI');
    if (aeroAPIKey === '') return API.Form.formFailure('?/default', '*', 'Configure Aero API key in settings');

    const entrySettings = await settings.getSet('entry');

    if (isNaN(parseInt(params.tour))) throw redirect(301, '/tour');
    const currentTour = await prisma.tour.findUnique({
      where: { id: parseInt(params.tour) },
    });
    if (currentTour === null) throw redirect(301, '/tour/new');

    const currentDay = await prisma.dutyDay.findUnique({ where: { id: parseInt(params.id) } });
    if (currentDay === null) throw redirect(301, '/tour/' + currentTour.id + '/day/new');

    const data = await request.formData();
    for (const key of data.keys()) {
      console.log(key, data.getAll(key));
    }


    let startAirport = data.get('start-airport') as null | string;
    const startAirportTZ = data.get('start-airport-tz') as null | string;

    const startTime = data.get('start-time-date') as null | string;
    const startTimeTZ = data.get('start-time-tz') as null | string;

    let endAirport = data.get('end-airport') as null | string;
    const endAirportTZ = data.get('end-airport-tz') as null | string;

    const endTime = data.get('end-time-date') as null | string;
    const endTimeTZ = data.get('end-time-tz') as null | string;

    const notes = data.get('notes') as null | string;



    if (startAirport === null || startAirport === '') return API.Form.formFailure('?/update', 'start-airport', 'Required field');
    if (startAirportTZ === null || startAirportTZ === '') return API.Form.formFailure('?/update', 'start-airport', 'Required field');
    if (startTime === null || startTime === '') return API.Form.formFailure('?/update', 'start-time', 'Required field');
    if (startTimeTZ === null || startTimeTZ === '') return API.Form.formFailure('?/update', 'start-time', 'Required field');
    if (endAirport === null || endAirport === '') return API.Form.formFailure('?/update', 'end-airport', 'Required field');
    if (endAirportTZ === null || endAirportTZ === '') return API.Form.formFailure('?/update', 'end-airport', 'Required field');
    if (endTime === null || endTime === '') return API.Form.formFailure('?/update', 'end-time', 'Required field');
    if (endTimeTZ === null || endTimeTZ === '') return API.Form.formFailure('?/update', 'end-time', 'Required field');

    startAirport = startAirport.trim().toLocaleUpperCase();
    endAirport = endAirport.trim().toLocaleUpperCase();

    const startUTC = timeStrAndTimeZoneToUTC(startTime, startTimeTZ);
    if (startUTC === null) return API.Form.formFailure('?/update', 'start-time', 'Unknown Timezone');

    const endUTC = timeStrAndTimeZoneToUTC(endTime, endTimeTZ);
    if (endUTC === null) return API.Form.formFailure('?/update', 'end-time', 'Unknown Timezone');

    if (startUTC.value > endUTC.value) return API.Form.formFailure('?/update', 'start-time', 'Start time is after end time');
    if (endUTC.value - startUTC.value > 86400 ) return API.Form.formFailure('?/update', 'start-time', 'Duty day is longer than 24 hours');


    // Create airport if it does not exist
    try {
      await addIfDoesNotExist(startAirport, aeroAPIKey);
      const airport = await prisma.airport.findUnique({
        where: { id: startAirport }
      });
      if (airport === null) return API.Form.formFailure('?/update', 'show-airport', 'Unknown airport');
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/update', 'show-airport', 'Error verifying airport');
    }

    // Create airport if it does not exist
    try {
      await addIfDoesNotExist(startAirport, aeroAPIKey);
      const airport = await prisma.airport.findUnique({
        where: { id: startAirport }
      });
      if (airport === null) return API.Form.formFailure('?/update', 'show-airport', 'Unknown airport');
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/update', 'show-airport', 'Error verifying airport');
    }

    try {
      const day = await prisma.dutyDay.update({
        where: {
          id: currentDay.id
        },
        data: {
          tourId: currentTour.id,

          startTime_utc: startUTC.value,
          startTimezone: startTimeTZ,
          startTimezoneOffset: startUTC.raw.rawOffsetInMinutes,

          endTime_utc: endUTC.value,
          endTimezone: endTimeTZ,
          endTimezoneOffset: endUTC.raw.rawOffsetInMinutes,

          startAirportId: startAirport,
          endAirportId: endAirport,

          notes: notes ?? undefined
        }
      });

      await generateDeadheads(day.id);

      await settings.set('entry.day.current', day.id);

    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/update', '*', 'Error updating duty day');
    }
    return API.Form.formSuccess('?/update');
  },

  delete: async ({ request, params, url }) => {
    const data = await request.formData();
    for (const key of data.keys()) {
      console.log(key, data.getAll(key));
    }


    let id = data.get('id') as null | string;
    if (id === null || id === '' || isNaN(parseInt(id))) return API.Form.formFailure('?/update', '*', 'Required Field');

    try {
      await prisma.dutyDay.delete({ where: { id: parseInt(id) }});
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/update', '*', 'Could not delete');
    }

    throw redirect(301, '/tour/' + params.tour + '/day');
  }
};
