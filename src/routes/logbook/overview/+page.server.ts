import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import { Overview } from '$lib/components/map/types.js';

export const load = async ({ fetch, params, parent, url }) => {
  const legsRaw = await prisma.leg.findMany({ select: { id: true, originAirportId: true, destinationAirportId: true, diversionAirportId: true } });
  const airports = await prisma.airport.findMany({ select: Overview.VisitedAirportSelect });

  const visitedAirports: Overview.VisitedAirport[] = [];
  const legs: Overview.Leg[] = [];

  // Loop through all the legs
  for (const leg of legsRaw) {
    const originAirportId = leg.originAirportId;
    const destinationAirportId = leg.diversionAirportId === null ? leg.destinationAirportId : leg.diversionAirportId;
    if (destinationAirportId === null) {
      console.error(`Data error: Airport is missing or invalid:`, leg)
      continue;
    }

    const origin = airports.find((a) => a.id === originAirportId);
    const destination = airports.find((a) => a.id === destinationAirportId);

    if (origin === undefined || destination === undefined) {
      console.error(`Data error: Airport is missing or invalid:`, leg)
      continue;
    }

    // Add to the visited airports
    if (visitedAirports.findIndex((a) => a.id === originAirportId) === -1) visitedAirports.push(origin);
    if (visitedAirports.findIndex((a) => a.id === destinationAirportId) === -1) visitedAirports.push(destination);

    const existingLeg = legs.findIndex((l) => l.apt.start === origin.id && l.apt.end === destination.id);

    
    if (existingLeg === -1) 
      legs.push({ 
        id: leg.id, 
        start: [ origin.latitude, origin.longitude ], 
        end: [ destination.latitude, destination.longitude ], 
        apt: {
          start: origin.id,
          end: destination.id,
        },
        segments: 1 
      });
    else legs[existingLeg].segments = legs[existingLeg].segments + 1;
  }

  let largestSegment = 0;
  for (const leg of legs) if (leg.segments > largestSegment) largestSegment = leg.segments;


  return {
    visitedAirports,
    legs,
    largestSegment
  }



};