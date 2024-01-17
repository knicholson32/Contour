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

  if (entrySettings['entry.day.entry.state'] === DayNewEntryState.NOT_STARTED) throw redirect(301, `/day/${params.id}/entry/new/link`);
  else if (entrySettings['entry.day.entry.state'] === DayNewEntryState.LINK_ENTERED) throw redirect(301, `/day/${params.id}/entry/new/verify`);
  else if (entrySettings['entry.day.entry.state'] === DayNewEntryState.LINK_CONFIRMED) throw redirect(301, `/day/${params.id}/entry/new/form`);

};
