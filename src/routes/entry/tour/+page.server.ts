import prisma from '$lib/server/prisma/index.js';
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {
  const tours = await prisma.tour.findMany({ select: { id: true, startTime_utc: true, endTime_utc: true, _count: true }, orderBy: { startTime_utc: 'desc' }, take: 1 });
  if (tours.length === 0) redirect(301, '/entry/tour/new');
  else redirect(302, '/entry/tour/' + tours[0].id);
};
