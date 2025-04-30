import prisma from "$lib/server/prisma";
import type { Prisma } from '@prisma/client';
import { redirect } from "@sveltejs/kit";
import Fuse from "fuse.js";

export const load = async ({ params, fetch , url}) => {

  // Get the tour that we are searching under, if it exists
  let day = url.searchParams.get('day');

  // Check that the tour exists
  if (day !== null) {
    const d = await prisma.dutyDay.findUnique({ where: { id: parseInt(day) } });
    if (d === null) day = null;
  }

  let legs: Prisma.LegGetPayload<{ select: { id: true, destinationAirportId: true, originAirportId: true, diversionAirportId: true, aircraft: { select: { registration: true, type: { select: { typeCode: true } } } } } }>[] | null = null;

  if (day === null) {
    // We don't have a day restriction, so all days are possible
    legs = await prisma.leg.findMany({ select: { id: true, destinationAirportId: true, originAirportId: true, diversionAirportId: true, aircraft: { select: { registration: true, type: { select: { typeCode: true } } } } }, orderBy: { startTime_utc: 'desc' } });
    // Redirect if nothing is found
    if (legs === null || legs.length === 0) redirect(302, `/entry/leg/new?${url.searchParams.toString()}`);
  } else {
    // We have day restriction. Only legs in this day are possible
    legs = await prisma.leg.findMany({ where: { dayId: parseInt(day) }, select: { id: true, destinationAirportId: true, originAirportId: true, diversionAirportId: true, aircraft: { select: { registration: true, type: { select: { typeCode: true } } } } }, orderBy: { startTime_utc: 'desc' } });
    // Redirect if nothing is found
    if (legs === null || legs.length === 0) redirect(302, `/entry/leg/new?${url.searchParams.toString()}`);
  }

  let search = url.searchParams.get('search');
  if (search === '') search = null;
  if (search !== null) {
    const fuseOptions = {
      // isCaseSensitive: false,
      // includeScore: false,
      shouldSort: false,
      // includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      threshold: 0.0,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      keys: [
        "destinationAirportId",
        "originAirportId",
        "diversionAirportId",
        "aircraft.registration",
        "aircraft.type.typeCode",
      ]
    };

    const fuse = new Fuse(legs, fuseOptions);
    legs = fuse.search(search).flatMap((v) => v.item);
  }

  // Redirect as required
  redirect(302, `/entry/leg/${legs[0].id}?${url.searchParams.toString()}`);
};


