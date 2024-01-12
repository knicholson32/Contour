import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import type { API } from '$lib/types';

export const load = async ({ fetch }) => {

  const entrySettings = await settings.getSet('entry');

  // if (entrySettings['entry.tour.current'] === -1) {
  //   const tour = await prisma.tour.create({ data: { }});
  //   await settings.set('entry.tour.current', tour.id);
  // }
  // if (entrySettings['entry.day.current'] === -1) throw redirect(302, '/entry/new');
  // throw redirect(302, '/entry/overview');

  const airports = await ((await fetch('/api/airports')).json()) as API.Airports;

  return {
    entrySettings,
    airports: (airports.ok === true) ? airports.airports : [] as API.Types.Airport[],
    aircraft: await prisma.aircraft.findMany({ select: { registration: true, type: { select: { typeCode: true, make: true, model: true }}}})
  }
}