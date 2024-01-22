import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { timeStrAndTimeZoneToUTC } from '$lib/helpers';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { generateDeadheads } from '$lib/server/db/deadhead';
import { generateAirportList } from '$lib/server/helpers';
import type { Prisma } from '@prisma/client';

const MAX_MB = 10;

export const load = async ({ fetch, params, parent }) => {

  const entrySettings = await settings.getSet('entry');

  
  if (isNaN(parseInt(params.tour))) throw redirect(301, '/tour');
  const tour = await prisma.tour.findUnique({ where: { id: parseInt(params.tour) } });
  if (tour === null) throw redirect(301, '/tour');

  const tourSettings = await settings.getSet('tour');
  const airports = await ((await fetch('/api/airports')).json()) as API.Airports;

  return {
    params,
    entrySettings,
    currentTour: tour,
    tourSettings,
    airports: (airports.ok === true) ? airports.airports : [] as API.Types.Airport[]
  }
}

export const actions = {
  default: async ({ request, url, params }) => {

    const tourId = parseInt(params.tour);
    if (isNaN(tourId)) throw redirect(301, '/tour');

    let tour = await prisma.tour.findUnique({ where: { id: tourId }});
    if (tour === null) throw redirect(301, '/tour');

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

    const endAirport = data.get('end-airport') as null | string;
    const endAirportTZ = data.get('end-airport-tz') as null | string;

    const endTime = data.get('end-time-date') as null | string;
    const endTimeTZ = data.get('end-time-tz') as null | string;

    const company = data.get('company') as null | 'true' | 'false';
    const lineCheck = data.get('line-check') as null | 'true' | 'false';

    const notes = data.get('notes') as null | string;

    if (showAirport === null || showAirport === '') return API.Form.formFailure('?/default', 'show-airport', 'Required field');
    if (showAirportTZ === null || showAirportTZ === '') return API.Form.formFailure('?/default', 'show-airport', 'Required field');
    if (showTime === null || showTime === '') return API.Form.formFailure('?/default', 'show-time', 'Required field');
    if (showTimeTZ === null || showTimeTZ === '') return API.Form.formFailure('?/default', 'show-time', 'Required field');
    if (endAirport === null || endAirport === '') return API.Form.formFailure('?/default', 'end-airport', 'Required field');
    if (endAirportTZ === null || endAirportTZ === '') return API.Form.formFailure('?/default', 'end-airport', 'Required field');
    if (endTime === null || endTime === '') return API.Form.formFailure('?/default', 'end-time', 'Required field');
    if (endTimeTZ === null || endTimeTZ === '') return API.Form.formFailure('?/default', 'end-time', 'Required field');
    if (company === null || company as string === '') return API.Form.formFailure('?/default', 'company', 'Required field');
    if (lineCheck === null || lineCheck as string === '') return API.Form.formFailure('?/default', 'line-check', 'Required field');


    const showUtc = helpers.timeStrAndTimeZoneToUTC(showTime, showTimeTZ);
    if (showUtc === null) return API.Form.formFailure('?/default', 'show-time', 'Unknown Timezone');

    const endUtc = helpers.timeStrAndTimeZoneToUTC(endTime, endTimeTZ);
    if (endUtc === null) return API.Form.formFailure('?/default', 'end-time', 'Unknown Timezone');

    // Create airport if it does not exist
    try {
      await addIfDoesNotExist(showAirport, aeroAPIKey);
      const airport = await prisma.airport.findUnique({
        where: { id: showAirport }
      });
      if (airport === null) return API.Form.formFailure('?/default', 'show-airport', 'Unknown airport');
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', 'show-airport', 'Error verifying airport');
    }

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

    try {
      tour = await prisma.tour.update({
        where: {
          id: tourId
        },
        data: {
          startTime_utc: showUtc.value,
          startTimezone: showTimeTZ,
          startTimezoneOffset: showUtc.raw.rawOffsetInMinutes,
          startAirportId: showAirport,
          endTime_utc: endUtc.value,
          endTimezone: endTimeTZ,
          endTimezoneOffset: endUtc.raw.rawOffsetInMinutes,
          endAirportId: endAirport,
          companyId: company,
          lineCheck: lineCheck === 'true',
          notes: notes ?? undefined
        }
      });

      await settings.set('entry.tour.current', -1);

      await prisma.option.deleteMany({ where: { tourId: tourId } });

    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', '*', 'Error updating tour');
    }


    throw redirect(301, '/tour/' + params.tour + '?active=form');
  },
};
