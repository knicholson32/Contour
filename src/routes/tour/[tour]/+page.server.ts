import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { timeStrAndTimeZoneToUTC } from '$lib/helpers';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { generateDeadheads } from '$lib/server/db/deadhead';
import { filterOutliers, generateAirportList, getDistanceFromLatLonInKm } from '$lib/server/helpers';
import type { Prisma } from '@prisma/client';
import type * as Types from '@prisma/client';

const MAX_MB = 10;
const AVG_FILTER_NUM = 2;

export const load = async ({ fetch, params, parent }) => {

  const entrySettings = await settings.getSet('entry');

  let tour: Prisma.TourGetPayload<{
    include: { days: true }
  }> | null = null;
  if (!isNaN(parseInt(params.tour))) tour = await prisma.tour.findUnique({ where: { id: parseInt(params.tour) }, include: { days: true } });
  else if (params.tour !== 'new') throw redirect(301, '/tour/new');

  const tours = await prisma.tour.findMany({ select: { id: true, startTime_utc: true, endTime_utc: true, _count: true }});
  
  const aeroAPIKey = await settings.get('general.aeroAPI');
  if (aeroAPIKey === '') throw redirect(301, '/settings');

  const tourSettings = await settings.getSet('tour');
  if (tourSettings['tour.defaultStartApt'] !== '') {
    try {
      await addIfDoesNotExist(tourSettings['tour.defaultStartApt'], aeroAPIKey);
    } catch (e) {

    }
  }

  const airports = await ((await fetch('/api/airports')).json()) as API.Airports;

  type T = [number, number][][];
  type A = Types.Prisma.AirportGetPayload<{ select: { id: true, latitude: true, longitude: true } }>[];
  let tourMap: { positions: T, ids: string[], airports: A } | null = null;

  let stats: {
    flight: number,
    duty: number,
    distance: number,
    airports: number,
    speed: number,
    fastestSpeed: number,
    operations: number
  } | null = null;

  if (tour !== null) {
    const tourExtended = await prisma.tour.findUnique({ 
      where: { 
        id: parseInt(params.tour)
      }, 
      include: { 
        days: { 
          include: { 
            legs: { 
              include: { 
                originAirport: true, 
                destinationAirport: true, 
                diversionAirport: true, 
                positions: { 
                  select: { 
                    latitude: true, 
                    longitude: true,
                    groundspeed: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (tourExtended !== null) {

      tourMap = { positions: [], ids: [], airports: []}

      stats = {
        flight: 0,        // Done
        duty: 0,          // Done
        distance: 0,      // Done
        airports: 0,      // Done
        speed: 0,         // Done
        fastestSpeed: 0,  // Done
        operations: 0     // Done
      }

      let apts: string[] = [];
      let speeds: number[] = [];
      let numPositions = 0;


      for (const d of tourExtended.days) {

        stats.duty += (d.endTime_utc - d.startTime_utc) / 60 / 60;

        for (const l of d.legs) {
          stats.flight += l.totalTime;
          stats.operations += 2;
          if (!apts.includes(l.originAirportId)) apts.push(l.originAirportId);
          if (!apts.includes(l.destinationAirportId)) apts.push(l.destinationAirportId);
          if (l.diversionAirportId !== null && !apts.includes(l.diversionAirportId)) apts.push(l.diversionAirportId);

          tourMap.airports.push(l.originAirport);
          if (l.diversionAirport !== null) tourMap.airports.push(l.diversionAirport);
          else tourMap.airports.push(l.destinationAirport);
          
          const posGroup: [number, number][] = [];

          

          // for (const p of l.positions) {
          //   posGroup.push([p.latitude, p.longitude]);
          // }

          if (l.positions.length > 1) {
            let lastPos = l.positions[0];
            numPositions += l.positions.length;
            stats.speed += lastPos.groundspeed;
            speeds.push(lastPos.groundspeed);
            posGroup.push([lastPos.latitude, lastPos.longitude]);
            for (let i = 1; i < l.positions.length; i++) {
              const pos = l.positions[i];
              posGroup.push([pos.latitude, pos.longitude]);
              stats.distance += getDistanceFromLatLonInKm(lastPos.latitude, lastPos.longitude, pos.latitude, pos.longitude);
              stats.speed += pos.groundspeed;
              speeds.push(pos.groundspeed);
              lastPos = pos;
            }
          }

          tourMap.positions.push(posGroup);
          tourMap.ids.push(l.id);
        }
      }

      speeds = filterOutliers(speeds);
      speeds.sort((a, b) => b - a);

      if (speeds.length > 0) {
        let filteredCount = 0;
        for (let i = 0; i < AVG_FILTER_NUM && i < speeds.length; i++) {
          filteredCount++;
          stats.fastestSpeed += speeds[i];
        }
        stats.fastestSpeed = stats.fastestSpeed / filteredCount;
      }

      stats.distance *= 0.54;
      if (numPositions > 0) stats.speed = stats.speed / numPositions;

      stats.airports = apts.length;

    }
  }

  return {
    params,
    entrySettings,
    currentTour: tour,
    tourMap,
    stats,
    tourSettings,
    airports: (airports.ok === true) ? airports.airports : [] as API.Types.Airport[],
    tours: tours
  }
}

export const actions = {
  updateOrCreate: async ({ request, url, params }) => {

    const tourId = parseInt(params.tour);
    if (isNaN(tourId) && params.tour !== 'new') throw redirect(301, '/tour/new');

    const aeroAPIKey = await settings.get('general.aeroAPI');
    if (aeroAPIKey === '') return API.Form.formFailure('?/default', '*', 'Configure Aero API key in settings');

    const data = await request.formData();
    for (const key of data.keys()) {
      console.log(key, data.getAll(key));
    }

    const showAirport = data.get('show-airport') as null | string;
    const showAirportTZ = data.get('show-airport-tz') as null | string;

    const showTime = data.get('show-time-date') as null | string;
    const showTimeTZ = data.get('show-time-tz') as null | string;

    const endAirport = data.get('end-airport') as null | string;
    const endAirportTZ = data.get('end-airport-tz') as null | string;

    const endTime = data.get('end-time-date') as null | string;
    const endTimeTZ = data.get('end-time-tz') as null | string;

    const company = data.get('company') as null | 'true' | 'false';
    const lineCheck = data.get('line-check') as null | 'true' | 'false';

    const notes = data.get('notes') as null | string;

    if (showAirport === null || showAirport === '') return API.Form.formFailure('?/default', 'show-airport', 'Required field');
    if (showAirportTZ === null || showAirportTZ === '') return API.Form.formFailure('?/default', 'show-airport', 'Required field');
    if (showTime === null || showTime === '') return API.Form.formFailure('?/default', 'show-time', 'Required field');
    if (showTimeTZ === null || showTimeTZ === '') return API.Form.formFailure('?/default', 'show-time', 'Required field');
    if (company === null || company as string === '') return API.Form.formFailure('?/default', 'company', 'Required field');
    if (lineCheck === null || lineCheck as string === '') return API.Form.formFailure('?/default', 'line-check', 'Required field');

    const showUtc = helpers.timeStrAndTimeZoneToUTC(showTime, showTimeTZ);
    if (showUtc === null) return API.Form.formFailure('?/default', 'show-time', 'Unknown Timezone');

    // Create airport if it does not exist
    try {
      await addIfDoesNotExist(showAirport, aeroAPIKey);
      const airport = await prisma.airport.findUnique({
        where: { id: showAirport }
      });
      if (airport === null) return API.Form.formFailure('?/default', 'show-airport', 'Unknown airport');
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', 'show-airport', 'Error verifying airport');
    }

    if (endAirport !== null) {
      if (endAirport === '') return API.Form.formFailure('?/default', 'end-airport', 'Invalid field');
      try {
        await addIfDoesNotExist(endAirport, aeroAPIKey);
        const airport = await prisma.airport.findUnique({
          where: { id: endAirport }
        });
        if (airport === null) return API.Form.formFailure('?/default', 'show-airport', 'Unknown airport');
      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', 'show-airport', 'Error verifying airport');
      }
    }


    let tour: Prisma.TourGetPayload<{}> | null = null;

    if (params.tour === 'new') {
      try {
        tour = await prisma.tour.create({
          data: {
            startTime_utc: showUtc.value,
            startTimezone: showTimeTZ,
            startTimezoneOffset: showUtc.raw.rawOffsetInMinutes,
            startAirportId: showAirport,
            companyId: company,
            lineCheck: lineCheck === 'true',
            notes: notes ?? undefined
          }
        });

        await settings.set('entry.tour.current', tour.id);

      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', '*', 'Error creating tour');
      }
    } else {

      try {
        if (endTime !== null && endTimeTZ !== null) {
          const endUtc = helpers.timeStrAndTimeZoneToUTC(endTime, endTimeTZ);
          if (endUtc === null) return API.Form.formFailure('?/default', 'end-time', 'Unknown Timezone');

          tour = await prisma.tour.update({
            where: {
              id: tourId
            },
            data: {
              startTime_utc: showUtc.value,
              startTimezone: showTimeTZ,
              startTimezoneOffset: showUtc.raw.rawOffsetInMinutes,
              startAirportId: showAirport,
              endTime_utc: endUtc.value,
              endTimezone: endTimeTZ,
              endTimezoneOffset: endUtc.raw.rawOffsetInMinutes,
              endAirportId: endAirport,
              companyId: company,
              lineCheck: lineCheck === 'true',
              notes: notes ?? undefined
            }
          });
        } else {
          tour = await prisma.tour.update({
            where: {
              id: tourId
            },
            data: {
              startTime_utc: showUtc.value,
              startTimezone: showTimeTZ,
              startTimezoneOffset: showUtc.raw.rawOffsetInMinutes,
              startAirportId: showAirport,
              companyId: company,
              lineCheck: lineCheck === 'true',
              notes: notes ?? undefined
            }
          });
        }

      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', '*', 'Error updating tour');
      }

    }

    console.log('tour', tour);

    if (tour === null) throw redirect(301, '/tour');
    else throw redirect(301, `/tour/${tour.id}`);
  },

  delete: async ({ request, url }) => {
    const data = await request.formData();
    for (const key of data.keys()) {
      console.log(key, data.getAll(key));
    }


    let tour = data.get('id') as null | string;
    if (tour === null || tour === '' || isNaN(parseInt(tour))) return API.Form.formFailure('?/updateOrCreate', '*', 'Required Field');


    try {
      await prisma.tour.delete({ where: { id: parseInt(tour) }});

      const entrySettings = await settings.getSet('entry');
      if (entrySettings['entry.tour.current'] === parseInt(tour)) await settings.set('entry.tour.current', -1);

    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/update', '*', 'Could not delete');
    }

    throw redirect(301, '/tour');
  }
};
