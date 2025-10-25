import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API, ImageUploadState, type GXTrack, type KML } from '$lib/types';
import { dateToDateStringForm, delay, getTimezoneObjectFromTimezone, timeStrAndTimeZoneToUTC } from '$lib/helpers/index.js';
import { DB } from '$lib/types';
import { v4 as uuidv4 } from 'uuid';
import * as helpers from '$lib/helpers';
import type { Prisma } from '@prisma/client';
import { getTimeZones } from '@vvo/tzdb';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { XMLParser } from 'fast-xml-parser';
import { filterOutliers, generateAirportList } from '$lib/server/helpers';
import { getDistanceFromLatLonInKm } from '$lib/helpers';
import type * as Types from '@prisma/client';
import type { Legs } from '$lib/components/map/deck/types';

// TODO: Calculate sunset and sunrise time for this day in local and Zulu time and display

const AVG_FILTER_NUM = 2;

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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


  const legSelector = {
    id: true,
    dayId: true,
    day: {
      select: {
        startTime_utc: true
      }
    },
    originAirportId: true,
    destinationAirportId: true,
    diversionAirportId: true,
    startTime_utc: true,
    endTime_utc: true,
    totalTime: true,
    aircraft: { 
      select: { 
        registration: true,
        id: true,
        type: {
          select: { 
            typeCode: true 
          }
        }
      }
    },
    _count: {
      select: {
        approaches: true,
        positions: true
      }
    }
  } satisfies Prisma.LegSelect;


  type Entry = Prisma.LegGetPayload<{ select: typeof legSelector }>;
  



  // if (day === null) throw redirect(301, '/tour/' + params.tour + '/day');

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

  const legData = (await (await fetch('/api/legs?id=' + leg.id + '&fixes=true' + '&v=' + entrySettings['entry.dataVersion'])).json() as Legs)[0];

  console.log(legData);


  return {
    entrySettings,
    leg,
    legData,
    // stats: {
    //   time: leg === null || leg.positions.length === 0 ? null : (leg.positions[leg.positions.length - 1].timestamp - leg.positions[0].timestamp) / 60 / 60,
    //   avgSpeed: speed,
    //   maxSpeed: fastestSpeed,
    //   distance
    // },
    tickValues,
    startTime: dateToDateStringForm(leg?.startTime_utc ?? 0, false, 'UTC'),
    startTimezone: originAirport === null || leg === null ? null : getTimezoneObjectFromTimezone(originAirport.timezone),
    endTime: dateToDateStringForm(leg?.endTime_utc ?? 0, false, 'UTC'),
    endTimezone: destinationAirport === null || leg === null ? null : getTimezoneObjectFromTimezone(destinationAirport.timezone),
    airports,
    airportList: await generateAirportList(leg?.originAirportId ?? null, leg?.destinationAirportId ?? null, leg?.diversionAirportId ?? null),
    aircraft
  }
}

export const actions = {
  update: async ({ request, url, params }) => {

    // const aeroAPIKey = await settings.get('general.aeroAPI');
    // const fa = await settings.get('entry.day.entry.fa_id');

    const id = params.id;

    // const currentLeg = await prisma.leg.findUnique({ where: { id }});
    // if (currentLeg === null) return API.Form.formFailure('?/default', '*', 'Leg does not exist');

    const data = await request.formData();
    for (const key of data.keys()) {
      console.log(key, data.getAll(key));
    }

    const file = data.get('file.upload') as File | null;
    if (file === null || file.size === 0) return API.Form.formFailure('?/default', 'file.upload', 'File Required');

    const inserts: Types.Prisma.PrismaPromise<any>[] = [];

    const processKML = async (file: File) => {
      const parser = new XMLParser({ ignoreAttributes: false });
      let jObj = parser.parse(await file.text()) as KML;

      let gxTrack: GXTrack | null = null;
      let altitude: number[] | null = null;
      let speed: number[] | null = null;
      let course: number[] | null = null;
  
      try {
        // Assume that it is the format that ForeFlight uses
        for (const placemark of jObj.kml.Document.Placemark) {
          if (placemark.name === '' && (placemark as GXTrack)['gx:Track'] !== undefined) {
            gxTrack = placemark as GXTrack;
            break;
          }
        }
  
        for (const data of jObj.kml.Document.ExtendedData.SchemaData['gx:SimpleArrayData']) {
          if (data['@_name'] === 'course') course = data['gx:value'];
          else if (data['@_name'] === 'speed_kts') speed = data['gx:value'];
          else if (data['@_name'] === 'altitude') altitude = data['gx:value'];
        }
      } catch (e) {
        // It wasn't the format that ForeFlight uses. Try to parse it as a FlightAware KML
        try {
          // Assume that it is the format that ForeFlight uses
          for (const placemark of jObj.kml.Document.Placemark) {
            if ((placemark as GXTrack)['gx:Track'] !== undefined) {
              gxTrack = placemark as GXTrack;
              break;
            }
          }
  
          if (gxTrack !== null && gxTrack['gx:Track']['gx:coord'].length > 1) {
            // Extract timestamps
            const timestamps = gxTrack['gx:Track'].when.map((t: string) => Math.floor(new Date(t).getTime() / 1000));
            // Calculate the speed and altitude from the coordinates
            let pastPosition: [number, number] = [gxTrack['gx:Track']['gx:coord'][0].split(' ').flatMap((v) => parseFloat(v))[0], gxTrack['gx:Track']['gx:coord'][0].split(' ').flatMap((v) => parseFloat(v))[1]];
  
            altitude = [gxTrack['gx:Track']['gx:coord'][0].split(' ').flatMap((v) => parseFloat(v))[3] * 3.28084];
            speed = [];
            course = [];
            for (let i = 1; i < gxTrack['gx:Track']['gx:coord'].length; i++) {
              const coord = gxTrack['gx:Track']['gx:coord'][i].split(' ').flatMap((v) => parseFloat(v));
              const timeDiff = timestamps[i] - timestamps[i - 1];
              const pos = [coord[0], coord[1]];
              const distanceKM = getDistanceFromLatLonInKm(pastPosition[1], pastPosition[0], pos[1], pos[0]);
              speed.push(((distanceKM / timeDiff) * 3600) * 0.539957); // Convert to knots
              if (speed[i - 1] === 0) speed[i - 1] = speed[i];
              if (speed[i] === 0) speed[i] = speed[i - 1];
              course.push(Math.atan2(pos[1] - pastPosition[1], pos[0] - pastPosition[0]) * (180 / Math.PI));
              altitude.push(coord[2] * 3.28084);
              pastPosition = [coord[0], coord[1]];
            }
          }
        } catch (e) {
          // Unknown format
        }
      }

      if (gxTrack === null || altitude === null || speed === null || course === null || altitude.length === 0 || speed.length === 0 || course.length === 0) {
        // TODO: Throw an error
        return;
      }
  
      if (gxTrack['gx:Track']['gx:coord'].length !== gxTrack['gx:Track'].when.length) {
        // TODO: Throw an error
        return;
      }


      let lastTime = -1;
      for (let i = 0; i < gxTrack['gx:Track']['gx:coord'].length; i++) {


        const coord = gxTrack['gx:Track']['gx:coord'][i].split(' ').flatMap((v) => parseFloat(v));
        const time = Math.floor(new Date(gxTrack['gx:Track']['when'][i]).getTime() / 1000);
        if (lastTime !== -1 && time - lastTime > 120) break;
        lastTime = time;
        if (speed !== null && speed[i] === 0) continue;

        inserts.push(prisma.position.create({ data: {
          legId: id,
          altitude: altitude === null ? 0 : isNaN(altitude[i]) ? 0 : (altitude[i] / 100),
          altitudeChange: '',
          groundspeed: speed === null ? 0 : isNaN(speed[i]) ? 0 : speed[i],
          heading: course === null ? 0 : isNaN(course[i]) ? 0 : course[i],
          latitude: coord[1],
          longitude: coord[0],
          timestamp: time,
          updateType: 'KML'
        }}));
      }
    }

    const processCSV = async (file: File) => {

    }

    await prisma.position.deleteMany({ where: { legId: id } });

    if (file.type === 'application/vnd.google-earth.kml+xml') await processKML(file);
    else if (file.type === 'text/csv') await processCSV(file);

    try {
      // Execute the prisma transaction that will add all the points
      await prisma.$transaction(inserts)

    } catch (e) {
      const err = e as Error;
      console.log('Unable to add positions!', e);
      return API.Form.formFailure('?/update', 'file.upload', 'Unable to save: ' + err.message);
    }

    redirect(301, `/entry/leg/${id}`);
    
  },

  delete: async ({ request, url, params }) => {
    const data = await request.formData();
  }
    
};
