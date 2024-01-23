import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import * as aeroAPI from '$lib/server/api/flightaware';
import { redirect } from '@sveltejs/kit';
import * as options from '$lib/server/db/options';
import { API, DayNewEntryState } from '$lib/types';
import { getTimeZones } from '@vvo/tzdb';
import { addIfDoesNotExist } from '$lib/server/db/airports';

const FORTY_EIGHT_HOURS = 48 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const EIGHT_HOURS = 8 * 60 * 60;

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {

  const entrySettings = await settings.getSet('entry');

  if (isNaN(parseInt(params.tour))) throw redirect(301, '/tour');
  const currentTour = await prisma.tour.findUnique({
    where: { id: parseInt(params.tour) },
  });
  if (currentTour === null) throw redirect(301, '/tour/new');

  if (isNaN(parseInt(params.id))) throw redirect(301, '/tour/' + params.tour + '/day');
  const currentDay = await prisma.dutyDay.findUnique({
    where: { id: parseInt(params.id) },
    include: { legs: true },
  });
  if (currentDay === null) throw redirect(301, '/tour/' + params.tour + '/day');

  const airports = await ((await fetch('/api/airports')).json()) as API.Airports;

  return {
    entrySettings,
    currentTour,
    currentDay,
    airports: (airports.ok === true) ? airports.airports : [] as API.Types.Airport[]
  };
};

export const actions = {
  default: async ({ request, url, params }) => {

    const aeroAPIKey = await settings.get('general.aeroAPI');
    if (aeroAPIKey === '') return API.Form.formFailure('?/default', '*', 'Configure Aero API key in settings');

    if (isNaN(parseInt(params.tour))) throw redirect(301, '/tour');
    const currentTour = await prisma.tour.findUnique({
      where: { id: parseInt(params.tour) },
    });
    if (currentTour === null) throw redirect(301, '/tour/new');

    const currentDay = await prisma.dutyDay.findUnique({
      where: { id: parseInt(params.id) },
      include: { legs: true },
    });
    if (currentDay === null) throw redirect(301, '/tour/' + params.tour + '/day');

    const data = await request.formData();

    let link = data.get('fa-link') as null | string;
    const flightID = data.get('flight-id') as null | string;
    const noCache = data.get('no-cache') as null | string === 'true' ? true : false;

    if (link === null || link === '') return API.Form.formFailure('?/default', 'fa-link', 'Required field');
    if (!helpers.validateURL(link)) return API.Form.formFailure('?/default', 'fa-link', 'Invalid URL');
    if (link.startsWith('https://flightaware.com/')) link = 'https://www.' + link.substring(8);
    console.log(link);
    if (!link.startsWith('https://www.flightaware.com/')) return API.Form.formFailure('?/default', 'fa-link', 'Not a FlightAware link');

    try {

      const fa_flight_id = await aeroAPI.getFlightIDFromURL(link);
      if (fa_flight_id === null || typeof fa_flight_id !== 'string' || fa_flight_id.length === 0) return API.Form.formFailure('?/default', 'fa-link', 'Invalid FlightAware link');

      if (noCache) {
        if (flightID === null || flightID === '') await options.getOptionsAndCache(aeroAPIKey, currentTour.id, [fa_flight_id], {});
        else await options.getOptionsAndCache(aeroAPIKey, currentTour.id, [flightID.trim().toUpperCase()], { clearCache: true, startTime: currentDay.startTime_utc, endTime: currentDay.endTime_utc });
      }

      console.log(fa_flight_id);

      // See if the flight is currently cached
      let entry = await options.getFlightOptionFaFlightID(fa_flight_id);

      if (entry === undefined) {
        if(noCache) {
          if (flightID === null || flightID === '') return API.Form.formFailure('?/default', 'flight-id', 'Not cached. Required for efficiency.');
          await options.getOptionsAndCache(aeroAPIKey, currentTour.id, [flightID.trim().toUpperCase()], { clearCache: true, forceExpansiveSearch: true });
        } else await options.getOptionsAndCache(aeroAPIKey, currentTour.id, [fa_flight_id], { });
        entry = await options.getFlightOptionFaFlightID(fa_flight_id);
        if (entry === undefined) return API.Form.formFailure('?/default', 'fa-link', 'Flight could not be found');
      }

      console.log('Linked Option', entry);

      await settings.set('entry.day.entry.fa_id', fa_flight_id);
      await settings.set('entry.day.entry.fa_link', link);
      await settings.set('entry.day.entry.state', DayNewEntryState.LINK_ENTERED);

    } catch (e) {
      console.log(e);
      if (e instanceof aeroAPI.AeroAPIError) {
        const err = (e as aeroAPI.AeroAPIError) ?? { detail: 'Unknown Error'};
        return API.Form.formFailure('?/default', '*', 'Error processing link: ' + err.apiErr.detail);
      } else {
        return API.Form.formFailure('?/default', '*', 'Error processing link');
      }
    }

    throw redirect(301, '/tour/' + params.tour + '/day/' + params.id + '/entry/new/verify');

    // return API.Form.formFailure('?/default', '*', 'test');

    // // const ref = url.searchParams.get('ref');
    // // console.log('ref', ref);
    // // if (ref !== null) throw redirect(301, ref);
    // // else throw redirect(301, '/aircraft/entry/' + id + '?active=form');

  }
};