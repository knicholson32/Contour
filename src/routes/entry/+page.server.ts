import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';

export const load = async () => {

  const entrySettings = await settings.getSet('entry');

  if (entrySettings['entry.tour.current'] === -1) {
    const tour = await prisma.tour.create({ data: { }});
    await settings.set('entry.tour.current', tour.id);
  }
  if (entrySettings['entry.day.current'] === -1) throw redirect(302, '/entry/new');
  throw redirect(302, '/entry/overview');
}