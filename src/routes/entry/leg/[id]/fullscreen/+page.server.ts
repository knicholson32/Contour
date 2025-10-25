import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import type { API, ImageUploadState, GXTrack, KML } from '$lib/types';
import { dateToDateStringForm, delay, getTimezoneObjectFromTimezone, timeStrAndTimeZoneToUTC } from '$lib/helpers/index.js';
import { DB } from '$lib/types';
import { v4 as uuidv4 } from 'uuid';
import * as helpers from '$lib/helpers';
import type { Prisma } from '@prisma/client';
import { getTimeZones } from '@vvo/tzdb';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { filterOutliers, generateAirportList } from '$lib/server/helpers';
import { getDistanceFromLatLonInKm } from '$lib/helpers';
import { fetchLegsForSideMenu } from '$lib/server/lib/leg';
import type { Types } from '$lib/components/map/deck';

// TODO: Calculate sunset and sunrise time for this day in local and Zulu time and display

export const load = async ({ fetch, params, url }) => {

  const entrySettings = await settings.getSet('entry');


  // Get the actual leg that the user has clicked on
  const leg = await prisma.leg.findUnique({
    where: { id: params.id },
    include: {
      flightAwareData: true,
      day: true,
      aircraft: {
        include: {
          type: true
        }
      },
      positions: true,
      fixes: true,
      approaches: true
    }
  });

  if (leg === null) redirect(302, `/entry/leg/${params.id}?active=form`);


  

  const airportsRaw = await ((await fetch('/api/airports')).json()) as API.Airports;
  const airports = (airportsRaw.ok === true) ? airportsRaw.airports : [] as API.Types.Airport[]

  // Get the airports based on the info from the selected option
  let originAirport: API.Types.Airport | null = null;
  for (const apt of airports) {
    if (apt.id === leg?.originAirportId) {
      originAirport = apt;
      break;
    }
  }

  const destAirport = (leg?.diversionAirportId !== null) ? leg?.diversionAirportId : leg?.destinationAirportId;
  let destinationAirport: API.Types.Airport | null = null;
  for (const apt of airports) {
    if (apt.id === destAirport) {
      destinationAirport = apt;
      break;
    }
  }

  const aircraft = await prisma.aircraft.findMany({ select: { registration: true, id: true, type: { select: { typeCode: true, make: true, model: true } } }, orderBy: { registration: 'asc' } });
  
  let tickValues: number[] = [];
  if (leg !== null && leg.positions.length > 0) {
    const first = leg.positions[0].timestamp;
    const last = leg.positions[leg.positions.length - 1].timestamp;
    for (let i = 0; i < 5; i++) tickValues.push(first + (last - first) * (i / 5));
    tickValues.push(last);
  }

  let speedScaler = 1;
  let maxSpeed = 0;
  let maxAlt = 0;

  if (leg !== null) {
    for (const p of leg.positions) {
      if (p.altitude * 100 > maxAlt) maxAlt = p.altitude * 100;
      if (p.groundspeed > maxSpeed) maxSpeed = p.groundspeed;
    }
    speedScaler = maxAlt / maxSpeed * 1;
  }


  // Get the dayId from the search params, if it exists
  const dayId = (url.searchParams.get('day') === null || url.searchParams.get('day') === '') ? null : parseInt(url.searchParams.get('day') ?? '-1');

  // Get the tourId form the search params, if it exists
  const tourId = (url.searchParams.get('tour') === null || url.searchParams.get('tour') === '') ? null : parseInt(url.searchParams.get('tour') ?? '-1');

  // Fetch all the legs for the side menu
  const search = url.searchParams.get('search');
  const legs = await fetchLegsForSideMenu(dayId, tourId, { positionsOnly: true, search });

  

  return {
    searchParams: {
      tourId,
      dayId,
      search
    },
    entrySettings,
    leg,
    legData: (await (await fetch('/api/legs?id=' + leg.id + '&fixes=true&filterDuplicates=false' + '&v=' + entrySettings['entry.dataVersion'])).json() as Types.Legs)[0],
    legs,
    // stats: {
    //   time: leg === null || leg.positions.length === 0 ? null : (leg.positions[leg.positions.length - 1].timestamp - leg.positions[0].timestamp) / 60 / 60,
    //   avgSpeed: speed,
    //   maxSpeed: fastestSpeed,
    //   distance
    // },
    tickValues,
    speedScaler,
    startTime: dateToDateStringForm(leg?.startTime_utc ?? 0, false, 'UTC'),
    startTimezone: originAirport === null || leg === null ? null : getTimezoneObjectFromTimezone(originAirport.timezone),
    endTime: dateToDateStringForm(leg?.endTime_utc ?? 0, false, 'UTC'),
    endTimezone: destinationAirport === null || leg === null ? null : getTimezoneObjectFromTimezone(destinationAirport.timezone),
    airports,
    airportList: await generateAirportList(leg?.originAirportId ?? null, leg?.destinationAirportId ?? null, leg?.diversionAirportId ?? null),
    aircraft
  }
}