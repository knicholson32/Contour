import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import * as aeroAPI from '$lib/server/api/flightaware';
import { redirect } from '@sveltejs/kit';
import * as options from '$lib/server/db/options';
import { API } from '$lib/types';
import type { Prisma } from '@prisma/client';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { generateDeadheads } from '$lib/server/db/deadhead';
import type { TimeZone } from '@vvo/tzdb';

const FORTY_EIGHT_HOURS = 48 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const EIGHT_HOURS = 8 * 60 * 60;

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch, url }) => {

  const entrySettings = await settings.getSet('entry');

  const tourId = url.searchParams.get('tour') === null ? null : parseInt(url.searchParams.get('tour') ?? '-1');
  let currentTour: Prisma.TourGetPayload<{include: { days: { include: { legs: true } } }}> | null = null;
  if (tourId !== null) currentTour = await prisma.tour.findUnique({ where: { id: tourId }, include: { days: { include: { legs: true } } } });
  if (currentTour === null) redirect(302, '/tour/new');

  // const currentDay = await prisma.dutyDay.findUnique({
  //   where: { id: entrySettings['entry.day.current'] },
  //   include: { legs: true },
  // });

  // if (currentDay !== null) throw redirect(301, '/day');

  // const tourSettings = await settings.getSet('tour');

  const airports = await ((await fetch('/api/airports')).json()) as API.Airports;

  const lastDay = await prisma.dutyDay.findFirst({ where: { tourId: currentTour.id }, orderBy: { endTime_utc: 'desc'} });



  // Reset the last used flight ID
  await settings.set('entry.flight_id.last', '');

  const fetchTZData = async (): Promise<{ data: TimeZone; prefersUTC: boolean; } | undefined> => {
    const tzRaw = await (await fetch('/api/timezone/home')).json() as API.Response;
    if (tzRaw.ok === true && tzRaw.type === 'timezone-home') {
      const data = (tzRaw as API.HomeTimeZone).data;
      const prefersUTC = (tzRaw as API.HomeTimeZone).prefers_utc;
      return { data, prefersUTC };
    }
    return undefined;
  }

  const tzData = await fetchTZData();

  return {
    entrySettings,
    // tourSettings,
    currentTour,
    // currentDay,
    lastDay,
    airports: (airports.ok === true) ? airports.airports : [] as API.Types.Airport[],
    tzData: tzData?.data,
    prefersUTC: tzData?.prefersUTC
  };
};

export const actions = {
  default: async ({ request, params, url }) => {

    const aeroAPIKey = await settings.get('general.aeroAPI');
    if (aeroAPIKey === '') return API.Form.formFailure('?/default', '*', 'Configure Aero API key in settings');

    const tourId = url.searchParams.get('tour') === null ? null : parseInt(url.searchParams.get('tour') ?? '-1');
    let currentTour: Prisma.TourGetPayload<{}> | null = null;
    if (tourId !== null) currentTour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (currentTour === null) redirect(302, '/tour/new');

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

    const flightIDs = data.getAll('flight-id') as null | string[]

    const notes = data.get('notes') as null | string;



    if (startAirport === null || startAirport === '') return API.Form.formFailure('?/default', 'start-airport', 'Required field');
    if (startAirportTZ === null || startAirportTZ === '') return API.Form.formFailure('?/default', 'start-airport', 'Required field');
    if (startTime === null || startTime === '') return API.Form.formFailure('?/default', 'start-time', 'Required field');
    if (startTimeTZ === null || startTimeTZ === '') return API.Form.formFailure('?/default', 'start-time', 'Required field');
    if (endAirport === null || endAirport === '') return API.Form.formFailure('?/default', 'end-airport', 'Required field');
    if (endAirportTZ === null || endAirportTZ === '') return API.Form.formFailure('?/default', 'end-airport', 'Required field');
    if (endTime === null || endTime === '') return API.Form.formFailure('?/default', 'end-time', 'Required field');
    if (endTimeTZ === null || endTimeTZ === '') return API.Form.formFailure('?/default', 'end-time', 'Required field');

    startAirport = startAirport.trim().toLocaleUpperCase();
    endAirport = endAirport.trim().toLocaleUpperCase();

    const startUTC = helpers.timeStrAndTimeZoneToUTC(startTime, startTimeTZ);
    if (startUTC === null) return API.Form.formFailure('?/default', 'start-time', 'Unknown Timezone');

    const endUTC = helpers.timeStrAndTimeZoneToUTC(endTime, endTimeTZ);
    if (endUTC === null) return API.Form.formFailure('?/default', 'end-time', 'Unknown Timezone');

    if (startUTC.value > endUTC.value) return API.Form.formFailure('?/default', 'start-time', 'Start time is after end time');
    if (endUTC.value - startUTC.value > 86400 * 2) return API.Form.formFailure('?/default', 'start-time', 'Duty day is longer than 48 hours');
    

    // Create airport if it does not exist
    try {
      await addIfDoesNotExist(startAirport, aeroAPIKey);
      const airport = await prisma.airport.findUnique({
        where: { id: startAirport }
      });
      if (airport === null) return API.Form.formFailure('?/default', 'start-airport', 'Unknown airport');
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', 'start-airport', 'Error verifying airport');
    }

    // Create airport if it does not exist
    try {
      await addIfDoesNotExist(endAirport, aeroAPIKey);
      const airport = await prisma.airport.findUnique({
        where: { id: endAirport }
      });
      if (airport === null) return API.Form.formFailure('?/default', 'end-airport', 'Unknown airport');
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', 'end-airport', 'Error verifying airport');
    }


    const filteredFlightIDs: string[] = [];
    if (flightIDs !== null) for (const id of flightIDs) if (id !== null && id !== '') filteredFlightIDs.push(id.toUpperCase());
    console.log('Flight IDs', filteredFlightIDs);
    if (filteredFlightIDs.length > 0) {
      try {
        // Make a single request and cache the leg data concerning these Flight IDs from flightaware
        await options.getOptionsAndCache(aeroAPIKey, currentTour.id, filteredFlightIDs, { startTime: startUTC.value, endTime: endUTC.value});
      } catch (e) {
        console.log('Unable to cache options', e);
      }
    }
    
    let redirectId = '';
    
    try {
      const day = await prisma.dutyDay.create({ data: {
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
      }});

      redirectId = day.id.toFixed(0);

      await generateDeadheads(day.id);

      await settings.set('entry.day.current', day.id);

    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', '*', 'Error creating duty day');
    }

    redirect(301, '/entry/day/' + redirectId + url.search);

    // return API.Form.formFailure('?/default', '*', 'test');

    // // const ref = url.searchParams.get('ref');
    // // console.log('ref', ref);
    // // if (ref !== null) throw redirect(301, ref);
    // // else throw redirect(301, '/aircraft/entry/' + id + '?active=form');
    
  }
};
