import prisma from "$lib/server/prisma";
import type { Prisma } from '@prisma/client';
import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch , url}) => {

  // Get the tour that we are searching under, if it exists
  let day = url.searchParams.get('day');

  // Check that the tour exists
  if (day !== null) {
    const d = await prisma.dutyDay.findUnique({ where: { id: parseInt(day) } });
    if (d === null) day = null;
  }

  let legs: Prisma.LegGetPayload<{ select: { id: true } }>[] | null = null;

  if (day === null) {
    // We don't have a day restriction, so all days are possible
    legs = await prisma.leg.findMany({ select: { id: true }, orderBy: { startTime_utc: 'desc' }, take: 1 });
    // Redirect if nothing is found
    if (legs === null || legs.length === 0) throw redirect(302, `/entry/leg/new?${url.searchParams.toString()}`);
  } else {
    // We have day restriction. Only legs in this day are possible
    legs = await prisma.leg.findMany({ where: { dayId: parseInt(day) }, select: { id: true }, orderBy: { startTime_utc: 'desc' }, take: 1 });
    // Redirect if nothing is found
    if (legs === null || legs.length === 0) throw redirect(302, `/entry/leg/new?${url.searchParams.toString()}`);
  }

  // Redirect as required
  throw redirect(302, `/entry/leg/${legs[0].id}?${url.searchParams.toString()}`);
};


