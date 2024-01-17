import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import * as aeroAPI from '$lib/server/api/flightaware';
import { redirect } from '@sveltejs/kit';
import * as options from '$lib/server/db/options';
import { API } from '$lib/types';
import { getTimeZones } from '@vvo/tzdb';
import { addIfDoesNotExist } from '$lib/server/db/airports';

const FORTY_EIGHT_HOURS = 48 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const EIGHT_HOURS = 8 * 60 * 60;

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {

  const entrySettings = await settings.getSet('entry');

  const currentTour = await prisma.tour.findUnique({
    where: { id: entrySettings['entry.tour.current'] },
    include: {
      days: {
        include: {
          legs: {
            orderBy: {
              id: 'asc'
            }
          }
        },
        orderBy: {
          id: 'asc'
        }
      }
    }
  });

  if (currentTour !== null) throw redirect(301, '/tour');
  const tourSettings = await settings.getSet('tour');

  const airports = await ((await fetch('/api/airports')).json()) as API.Airports;

  return {
    entrySettings,
    tourSettings,
    currentTour,
    airports: (airports.ok === true) ? airports.airports : [] as API.Types.Airport[]
  };
};

export const actions = {
  default: async ({ request, url }) => {

    const aeroAPIKey = await settings.get('general.aeroAPI');
    if (aeroAPIKey === '') return API.Form.formFailure('?/default', '*', 'Configure Aero API key in settings');

    const data = await request.formData();
    for (const key of data.keys()) {
      console.log(key, data.getAll(key));
    }

    const showAirport = data.get('show-airport') as null | string;
    const showAirportTZ = data.get('show-airport-tz') as null | string;

    const showTime = data.get('show-time-date') as null | string;
    const showTimeTZ = data.get('show-time-tz') as null | string;

    const company = data.get('company') as null | 'true' | 'false';
    const lineCheck = data.get('line-check') as null | 'true' | 'false';

    const notes = data.get('notes') as null | string;

    if (showAirport === null || showAirport === '') return API.Form.formFailure('?/default', 'show-airport', 'Required field');
    if (showAirportTZ === null || showAirportTZ === '') return API.Form.formFailure('?/default', 'show-airport', 'Required field');
    if (showTime === null || showTime === '') return API.Form.formFailure('?/default', 'show-time', 'Required field');
    if (showTimeTZ === null || showTimeTZ === '') return API.Form.formFailure('?/default', 'show-time', 'Required field');
    if (company === null || company  as string === '') return API.Form.formFailure('?/default', 'company', 'Required field');
    if (lineCheck === null || lineCheck as string  === '') return API.Form.formFailure('?/default', 'line-check', 'Required field');


    const utc = helpers.timeStrAndTimeZoneToUTC(showTime, showTimeTZ);
    if (utc === null) return API.Form.formFailure('?/default', 'show-time', 'Unknown Timezone');

    // Create airport if it does not exist
    try {
      await addIfDoesNotExist(showAirport, aeroAPIKey);
      const airport = await prisma.airport.findUnique({
        where: { id: showAirport }
      });
      if (airport === null) return API.Form.formFailure('?/default', 'show-airport', 'Unknown airport');
    } catch(e) {
      console.log(e);
      return API.Form.formFailure('?/default', 'show-airport', 'Error verifying airport');
    }

    try {
      // const data = ;
      // console.log('create', data);
      const tour = await prisma.tour.create({data: {
        startTime_utc: utc.value,
        startTimezone: showTimeTZ,
        startTimezoneOffset: utc.raw.rawOffsetInMinutes,
        startAirportId: showAirport,
        companyId: company,
        lineCheck: lineCheck === 'true',
        notes: notes ?? undefined
      }});

      await settings.set('entry.tour.current', tour.id);

    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', '*', 'Error creating tour');
    }

    throw redirect(301, '/tour');

    // const ref = url.searchParams.get('ref');
    // console.log('ref', ref);
    // if (ref !== null) throw redirect(301, ref);
    // else throw redirect(301, '/aircraft/entry/' + id + '?active=form');
    
  }
};
