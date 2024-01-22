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
import { invalidateAll } from '$app/navigation';

const MAX_MB = 10;

export const load = async ({ fetch, params, parent }) => {

  const entrySettings = await settings.getSet('entry');


  if (entrySettings['entry.tour.current'] === -1) throw redirect(301, '/tour/new');
  throw redirect(301, `/tour/${entrySettings['entry.tour.current']}/day`);
}