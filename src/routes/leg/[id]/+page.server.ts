import { error, redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { timeStrAndTimeZoneToUTC } from '$lib/helpers';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { generateDeadheads } from '$lib/server/db/deadhead';
import { generateAirportList } from '$lib/server/helpers';

const MAX_MB = 10;

export const load = async ({ fetch, params, parent }) => {

  const leg = await prisma.leg.findUnique({ where: { id: params.id }, include: { day: { include: { tour: true }}}});

  if (leg === null) throw error(404, 'Requested leg does not exist.');
  if (leg.day === null) throw error(404, 'Requested leg does not exist.');
  if (leg.day.tour === null) throw error(404, 'Requested leg does not exist.');

  throw redirect(301, `/tour/${leg.day.tourId}/day/${leg.dayId}/entry/${params.id}`);
}