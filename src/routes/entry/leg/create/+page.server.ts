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
export const load = async ({ params, fetch, url }) => {

  const entrySettings = await settings.getSet('entry');

  console.log('abc123', entrySettings['entry.day.entry.state']);

  if (entrySettings['entry.day.entry.state'] === DayNewEntryState.NOT_STARTED) redirect(301, `/entry/leg/create/fa?${url.searchParams.toString()}`);
  else if (entrySettings['entry.day.entry.state'] === DayNewEntryState.LINK_CONFIRMED) redirect(301, `/entry/leg/create/form?${url.searchParams.toString()}`);

};
