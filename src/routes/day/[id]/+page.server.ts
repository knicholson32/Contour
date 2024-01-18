import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API, ImageUploadState } from '$lib/types';
import { delay, timeStrAndTimeZoneToUTC } from '$lib/helpers/index.js';
import { v4 as uuidv4 } from 'uuid';
import type * as Types from '@prisma/client';
import { getTimeZones } from '@vvo/tzdb';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { generateDeadheads } from '$lib/server/db/deadhead';
import { generateAirportList } from '$lib/server/helpers';

const MAX_MB = 10;

export const load = async ({ fetch, params }) => {

  const entrySettings = await settings.getSet('entry');

  const currentTour = await prisma.tour.findUnique({ where: { id: entrySettings['entry.tour.current'] } });
  // if (currentTour === null) throw redirect(301, '/tour/new');

  const days = await prisma.dutyDay.findMany({
    select: {
      id: true,
      startAirportId: true,
      endAirportId: true,
      startTime_utc: true,
    }
  });

  const currentDay = await prisma.dutyDay.findUnique({
    where: { id: parseInt(params.id) },
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
  if (currentDay === null) throw redirect(301, '/day/new');

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

  return {
    params,
    entrySettings,
    currentDay,
    currentTour,
    airportList: await generateAirportList(...airportsInOrder),
    legDeadheadCombo,
    days,
    airports: (airports.ok === true) ? airports.airports : [] as API.Types.Airport[]
  }
}

export const actions = {
  update: async ({ request, url, params }) => {

    const aeroAPIKey = await settings.get('general.aeroAPI');
    if (aeroAPIKey === '') return API.Form.formFailure('?/default', '*', 'Configure Aero API key in settings');

    const entrySettings = await settings.getSet('entry');

    const currentTour = await prisma.tour.findUnique({ where: { id: entrySettings['entry.tour.current'] } });
    if (currentTour === null) throw redirect(301, '/tour/new');
    const currentDay = await prisma.dutyDay.findUnique({ where: { id: parseInt(params.id) } });
    if (currentDay === null) throw redirect(301, '/day/new');

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

  delete: async ({ request, url }) => {
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

    throw redirect(301, '/day');
  }
};
