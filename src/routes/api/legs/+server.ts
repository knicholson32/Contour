import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { json, redirect } from '@sveltejs/kit';

import * as DeckTypes from '$lib/components/map/deck/types.js';
import { addIfDoesNotExist } from '$lib/server/db/airports.js';
import { getDistanceFromLatLonInKm } from '$lib/helpers/index.js';
import { API } from '$lib/types';
import { jsonCompressed } from '$lib/types/responses';

// 14 days
const CACHE_AGE = 1209600;

export const GET = async ({ request, url }) => {
  try {

    const ids = url.searchParams.getAll('id');
    const includeFixes = url.searchParams.get('fixes') === 'true';
    const filterDuplicates = !(url.searchParams.get('filterDuplicates') === 'false');

    // If 'v=' is supplied, allow for caching as this will be a versioned request. When the data
    // changes, a new version param will be supplied.
    const versioned = url.searchParams.get('v') !== null;
    
    const debug = await settings.get('system.debug');

    const legsRaw = await prisma.leg.findMany({ where: (ids.length === 0 ? undefined : { id: { in: ids } }), select: { id: true, originAirportId: true, destinationAirportId: true, diversionAirportId: true } });
    const airports = await prisma.airport.findMany({ select: { ...DeckTypes.AirportSelect, _count: { select: { legOrigin: true, legDestination: true, legDiversion: true } } } });

    const visitedAirports: DeckTypes.Airport[] = [];
    const legs: DeckTypes.LegProcess[] = [];

    for (const airport of airports) {
      const numLegs = airport._count.legDestination + airport._count.legOrigin + airport._count.legDiversion;
      if (numLegs === 0) continue;
      visitedAirports.push({
        id: airport.id,
        latitude: airport.latitude,
        longitude: airport.longitude,
        priority: numLegs,
        // name: airport.name
      });
    }

    // Loop through all the legs
    for (const leg of legsRaw) {
      const originAirportId = leg.originAirportId;
      const destinationAirportId = leg.diversionAirportId === null ? leg.destinationAirportId : leg.diversionAirportId;
      if (destinationAirportId === null) {
        // console.error(`Data error: Airport is missing or invalid:`, leg)
        continue;
      }

      const origin = airports.find((a) => a.id === originAirportId);
      const destination = airports.find((a) => a.id === destinationAirportId);

      if (origin === undefined || destination === undefined) {
        // console.error(`Data error: Airport is missing or invalid:`, leg)
        continue;
      }


      const existingLeg = !filterDuplicates ? -1 : legs.findIndex((l) => l.apt.start === origin.id && l.apt.end === destination.id);
      if (existingLeg === -1)
        legs.push({
          id: leg.id,
          start: [origin.latitude, origin.longitude],
          end: [destination.latitude, destination.longitude],
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

    const settingsGroup = await settings.getMany('general.prefers_globe', 'tour.defaultStartApt', 'general.aeroAPI');
    await addIfDoesNotExist(settingsGroup['tour.defaultStartApt'], settingsGroup['general.aeroAPI']);


    const legsRawPositions = await prisma.leg.findMany({ where: (ids.length === 0 ? undefined : { id: { in: ids } }), include: { positions: true, aircraft: { select: { simulator: true } }, fixes: true } });

    const legsPositions: DeckTypes.Legs = [];

    const recordedLegs: [[number, number], [number, number]][] = [];

    const checkLegRecorded = (p1Lat: number, p1Lon: number, p2Lat: number, p2Lon: number): boolean => {
      if (!filterDuplicates) return false;
      for (const leg of recordedLegs) {
        if (leg[0][0] === p1Lat && leg[0][1] === p1Lon && leg[1][0] === p2Lat && leg[1][1] === p2Lon) return true;
        if (leg[1][0] === p1Lat && leg[1][1] === p1Lon && leg[0][0] === p2Lat && leg[0][1] === p2Lon) return true;
      }
      recordedLegs.push([[p1Lat, p1Lon], [p2Lat, p2Lon]]);
      return false;
    }

    for (const leg of legsRawPositions) {
      const originAirportId = leg.originAirportId;
      const destinationAirportId = leg.diversionAirportId === null ? leg.destinationAirportId : leg.diversionAirportId;

      const origin = airports.find((a) => a.id === originAirportId);
      const destination = airports.find((a) => a.id === destinationAirportId);

      if (origin === undefined || destination === undefined) {
        // console.error(`Data error: Airport is missing or invalid:`, leg)
        continue;
      }

      let segments: DeckTypes.Segment[] = [];

      if (leg.positions.length < 1) {
        if (!checkLegRecorded(origin.latitude, origin.longitude, destination.latitude, destination.longitude)) {
          segments = [{
            positions: [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]],
            style: 'alternate'
          }];
        } else continue;
      } else {
        let currentSegment: DeckTypes.Segment = { style: 'norm', positions: [] };
        const legPositions = leg.positions.map((p) => [p.longitude, p.latitude, p.altitude]);
        let lastPosition = legPositions[0];
        let uncertain = false;
        for (let i = 1; i < legPositions.length; i++) {
          const position = legPositions[i];
          const distance = getDistanceFromLatLonInKm(lastPosition[1], lastPosition[0], position[1], position[0]);
          if (distance > 500) {
            if (uncertain) {
              currentSegment.positions.push([position[0], position[1]]);
            } else {
              uncertain = true;
              segments.push(currentSegment)
              currentSegment = { style: 'uncertain', positions: [[lastPosition[0], lastPosition[1]], [position[0], position[1]]] };
            }
          } else {
            if (uncertain) {
              uncertain = false;
              segments.push(currentSegment)
              currentSegment = { style: 'norm', positions: [[lastPosition[0], lastPosition[1]], [position[0], position[1]]] };
            } else {
              currentSegment.positions.push([position[0], position[1]]);
            }
          }
          lastPosition = position;
        }
        segments.push(currentSegment);

        if (includeFixes) {
          currentSegment = { style: 'plan', positions: [] };
          for (const fix of leg.fixes) {
            if (fix.latitude === null || fix.longitude === null) continue;
            currentSegment.positions.push([fix.longitude, fix.latitude])
          }
          segments.push(currentSegment);
        }

      }

      legsPositions.push({
        id: leg.id,
        segments
      });
    }

    if (versioned) {
      const responseHeaders = new Headers();
      responseHeaders.set('cache-control', `max-age=${CACHE_AGE}, stale-while-revalidate=${CACHE_AGE}`);
      console.log(responseHeaders);
      return jsonCompressed(legsPositions, request.headers, responseHeaders);
    } else {
      return jsonCompressed(legsPositions, request.headers);
    }

    



    // return json(legsPositions, { status: 200 })

    // TODO deprecate this in favour of `Response.json` when it's
    // more widely supported
    

  } catch (e) {
    return API.response.serverError(e);
  }
};


