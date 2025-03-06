import prisma from "$lib/server/prisma";
import type { Prisma } from '@prisma/client';
import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch, url }) => {

  // Get the tour that we are searching under, if it exists
  let tour = url.searchParams.get('tour');

  // Check that the tour exists
  if (tour !== null) {
    const t = await prisma.tour.findUnique({ where: { id: parseInt(tour) }});
    if (t === null) tour = null;
  }

  let days: Prisma.TourGetPayload<{ select: { id: true }}>[] | null = null;

  if (tour === null) {
    // We don't have a tour restriction, so all days are possible
    days = await prisma.dutyDay.findMany({ select: { id: true }, orderBy: { startTime_utc: 'desc' }, take: 1 });
    // Redirect if nothing is found
    if (days === null || days.length === 0) redirect(302, '/entry/tour');
  } else {
    // We have tour restriction. Only days in this tour are possible
    days = await prisma.dutyDay.findMany({ where: { tourId: parseInt(tour) }, select: { id: true }, orderBy: { startTime_utc: 'desc' }, take: 1 });
    // Redirect if nothing is found
    if (days === null || days.length === 0) redirect(302, `/entry/day/new?${url.searchParams.toString()}`);
  }

  // Redirect as required
  redirect(302, `/entry/day/${days[0].id}?${url.searchParams.toString()}`);
};

