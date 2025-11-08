import { DB } from '$lib/types/prisma.js';
import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import { type TrackerPosition } from '$lib/types';
import type { Prisma } from '@prisma/client';
import * as settings from '$lib/server/settings';
import { getDistanceFromLatLonInKm, getTrueHeadingBetweenPoints } from '$lib/helpers/index.js';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { v4 as uuidv4 } from 'uuid';
import { MEDIA_FOLDER } from '$lib/server/env';
import fs from 'node:fs';
import { Debug } from '$lib/types/prisma';

// import { generatePreviews } from '$lib/server/track';


const SPEED_CUTOFF_KN = 60;

export const POST = async ({ url, request }) => {

  const debug = await settings.get('system.debug');

  try {
    const data = await request.json() as TrackerPosition[]; // Parses the request body as JSON

    if (debug >= Debug.VERBOSE) {
      const file = `${MEDIA_FOLDER}/tracks/${(new Date()).toISOString()}.json`;
      console.log('---- Track Data');
      console.log('Saving incoming track data to file: ', file);
      try {
        fs.writeFileSync(file, JSON.stringify(data));
      } catch (e) {
        console.log('ERROR: Unable to save track data to backup log: ', e);
      }
    }

    if (data.length === 0) {
      if (debug >= Debug.VERBOSE) console.log('No data submitted');
      return json({ ok: false, message: 'No data submitted' }, { status: 400 });
    }
    if (data.length < 2) {
      if (debug >= Debug.VERBOSE) console.log('At least 2 data points are required');
      return json({ ok: false, message: 'At least 2 data points are required' }, { status: 400 });
    }
    data.sort((a, b) => a.time - b.time);

    const aeroAPIKey = await settings.get('general.aeroAPI');

    const ids: string[] = [];
    let idx = 1;

    while (idx < data.length) {

      let inFlight = false;

      let dataExpanded: Prisma.ProspectPositionCreateInput[] = [];

      for (let i = idx; i < data.length; i++, idx++) {
        const currentPoint = data[i];
        const lastPoint = data[i - 1];
        const distance_km = getDistanceFromLatLonInKm(lastPoint.latitude, lastPoint.longitude, currentPoint.latitude, currentPoint.longitude);
        const speed = (distance_km * 0.539957) / ((currentPoint.time - lastPoint.time) / 3600);

        if (distance_km === 0) continue;

        const altitude = Math.floor((currentPoint.altitude * 3.28084) / 100);
        const lastAltitude = Math.floor((lastPoint.altitude * 3.28084) / 100);
        let altitudeChange: DB.AltitudeChange = DB.AltitudeChange.UNKNOWN;
        if (altitude > lastAltitude) {
          altitudeChange = DB.AltitudeChange.CLIMBING
        } else if (altitude < lastAltitude) {
          altitudeChange = DB.AltitudeChange.DESCENDING
        } else {
          altitudeChange = DB.AltitudeChange.LEVEL
        }

        const heading = getTrueHeadingBetweenPoints(lastPoint.latitude, lastPoint.longitude, currentPoint.latitude, currentPoint.longitude);

        if (inFlight) {
          if(speed < SPEED_CUTOFF_KN) {
            if (debug >= Debug.VERBOSE) console.log('End of data segment found', currentPoint.time);
            // We have landed. Break and submit this data.
            inFlight = false;
            break;
          } else {
            dataExpanded.push({
              timestamp: currentPoint.time,
              latitude: currentPoint.latitude,
              longitude: currentPoint.longitude,
              groundspeed: speed,
              altitude: altitude,
              heading: heading,
              altitudeChange: altitudeChange,
              ProspectMetadata: { connect: { id: '' } }
            });
          }
        }

        if (inFlight === false && speed > SPEED_CUTOFF_KN) inFlight = true;
      }

      if (dataExpanded.length === 0) continue;

      const startPosition = dataExpanded[0];
      const endPosition = dataExpanded[dataExpanded.length - 1];

      let closestStartAirport: { distance_km: number, id: string } | null = null;
      let closestEndAirport: { distance_km: number, id: string } | null = null;

      const visitedAirports = await prisma.airport.findMany({  });
      const databaseAirports = await prisma.navAirports.findMany({ });

      for (const apt of visitedAirports) {
        const startDist = getDistanceFromLatLonInKm(startPosition.latitude, startPosition.longitude, apt.latitude, apt.longitude);
        const endDist = getDistanceFromLatLonInKm(endPosition.latitude, endPosition.longitude, apt.latitude, apt.longitude);
        if (closestStartAirport === null || startDist < closestStartAirport.distance_km) closestStartAirport = { distance_km: startDist, id: apt.id };
        if (closestEndAirport === null || endDist < closestEndAirport.distance_km) closestEndAirport = { distance_km: endDist, id: apt.id };
      }

      for (const apt of databaseAirports) {
        const startDist = getDistanceFromLatLonInKm(startPosition.latitude, startPosition.longitude, apt.latitude, apt.longitude);
        const endDist = getDistanceFromLatLonInKm(endPosition.latitude, endPosition.longitude, apt.latitude, apt.longitude);
        if (closestStartAirport === null || startDist < closestStartAirport.distance_km) closestStartAirport = { distance_km: startDist, id: apt.icao };
        if (closestEndAirport === null || endDist < closestEndAirport.distance_km) closestEndAirport = { distance_km: endDist, id: apt.icao };
      }

      const existingTracksTotal = await prisma.prospectMetadata.findMany({ where: { startTime_utc: startPosition.timestamp }, include: { positions: true, startAirport: true, endAirport: true } });
      const matchingTracks = existingTracksTotal.filter((t) => t.startAirportId === (closestStartAirport?.id ?? null) && t.endAirportId === (closestEndAirport?.id ?? null) && t.positions.length === dataExpanded.length);

      // Only add if it doesn't already exist
      if (matchingTracks.length === 0) {
        const id = uuidv4();

        if (debug >= Debug.VERBOSE) console.log('Adding track', id, closestStartAirport?.id, closestEndAirport?.id);

        const metadata: Prisma.ProspectMetadataCreateInput = {
          id: id,
          startLatitude: startPosition.latitude,
          startLongitude: startPosition.longitude,
          endLatitude: endPosition.latitude,
          endLongitude: endPosition.longitude,
          startTime_utc: startPosition.timestamp,
          endTime_utc: endPosition.timestamp,
          distance_km: getDistanceFromLatLonInKm(startPosition.latitude, startPosition.longitude, endPosition.latitude, endPosition.longitude)
        }

        ids.push(id);
        for (const p of dataExpanded) p.ProspectMetadata = { connect: { id: metadata.id } };

        if (closestStartAirport !== null) {
          await addIfDoesNotExist(closestStartAirport.id, aeroAPIKey);
          metadata.startAirport = { connect: { id: closestStartAirport.id } };
        }

        if (closestEndAirport !== null) {
          await addIfDoesNotExist(closestEndAirport.id, aeroAPIKey);
          metadata.endAirport = { connect: { id: closestEndAirport.id } };
        }

        const inserts: Prisma.PrismaPromise<any>[] = [];

        inserts.push(prisma.prospectMetadata.create({ data: metadata }));
        for (const p of dataExpanded) inserts.push(prisma.prospectPosition.create({ data: p }));

        try {
          await prisma.$transaction(inserts)
        } catch (e) {
          const err = e as Error;
          return json({ ok: false, message: err.message }, { status: 500 });
        }
      }
    }


    // Generate previews async
    // generatePreviews(ids);

    if (debug >= Debug.VERBOSE) console.log('Track upload cycle complete!');


    return json({ ok: true, ids: ids }, { status: 200 });

    
  } catch (e) {
    const err = e as Error;
    console.log('Error downloading track info:');
    console.log(err);
    return json({ ok: false, message: err.message }, { status: 400 });
  }
};