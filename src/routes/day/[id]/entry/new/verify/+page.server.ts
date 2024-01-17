import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import * as aeroAPI from '$lib/server/api/flightaware';
import { redirect } from '@sveltejs/kit';
import * as options from '$lib/server/db/options';
import { finalizeFlight } from '$lib/server/db/legs';
import { API, DayNewEntryState } from '$lib/types';
import { getTimeZones } from '@vvo/tzdb';
import { addIfDoesNotExist } from '$lib/server/db/airports';

const FORTY_EIGHT_HOURS = 48 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const EIGHT_HOURS = 8 * 60 * 60;

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {

  const entrySettings = await settings.getSet('entry');
  const aeroAPIKey = await settings.get('general.aeroAPI');
  
  if (entrySettings['entry.day.entry.fa_id'] === '' || entrySettings['entry.day.entry.state'] === DayNewEntryState.NOT_STARTED) throw redirect(301, '../link');
  if (aeroAPIKey === '') throw redirect(301, '/settings');
  
  let entry = await options.getFlightOptionFaFlightID(entrySettings['entry.day.entry.fa_id']);

  if (entry === undefined) {
    console.log(`Could not verify - FA Flight ID ${entrySettings['entry.day.entry.fa_id']} did not load a value from the DB.`);
    await settings.set('entry.day.entry.fa_id', '');
    await settings.set('entry.day.entry.state', DayNewEntryState.NOT_STARTED);
    throw redirect(301, '../link');
  }

  console.log(entry);

  // Create airport if it does not exist
  try {
    await addIfDoesNotExist(entry.originAirportId, aeroAPIKey);
    await addIfDoesNotExist(entry.destinationAirportId, aeroAPIKey);
    await addIfDoesNotExist(entry.diversionAirportId, aeroAPIKey);
  } catch (e) {

  }

  const airportsRaw = await ((await fetch('/api/airports')).json()) as API.Airports;
  const airports = (airportsRaw.ok === true) ? airportsRaw.airports : [] as API.Types.Airport[]

  // Get the airports based on the info from the selected option
  let originAirport: API.Types.Airport | null = null;
  for (const apt of airports) {
    if (apt.id === entry.originAirportId) {
      originAirport = apt;
      break;
    }
  }

  const destAirport = (entry.diversionAirportId !== null) ? entry.diversionAirportId : entry.destinationAirportId;
  let destinationAirport: API.Types.Airport | null = null;
  for (const apt of airports) {
    if (apt.id === destAirport) {
      destinationAirport = apt;
      break;
    }
  }

  const totalTime = ((entry.endTime - entry.startTime) / 60 / 60)


  return {
    entry,
    params,
    entrySettings,
    startTime: originAirport === null ? null : helpers.dateToDateStringForm(entry.startTime, false, originAirport.timezone) + ' ' + helpers.getTimezoneObjectFromTimezone(originAirport.timezone)?.abbreviation,
    startTimezone: originAirport === null ? null : originAirport.timezone,
    endTime: destinationAirport === null ? null : helpers.dateToDateStringForm(entry.endTime, false, destinationAirport.timezone) + ' ' + helpers.getTimezoneObjectFromTimezone(destinationAirport.timezone)?.abbreviation,
    endTimezone: destinationAirport === null ? null : destinationAirport.timezone,
    totalTime,
    airports
  };
};

export const actions = {
  default: async ({ request, url, params }) => {
    await settings.set('entry.day.entry.state', DayNewEntryState.LINK_CONFIRMED);
    throw redirect(301, '/day/' + params.id + '/entry/new/form');
  }
};