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
import { filterOutliers, generateAirportList, getDistanceFromLatLonInKm } from '$lib/server/helpers';
import type * as Types from '@prisma/client';

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

  if (leg === null) throw redirect(302, `/entry/leg/${params.id}?active=form`);


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

  // let speedScaler = 1;
  // let maxSpeed = 0;
  // let maxAlt = 0;

  // if (leg !== null) {
  //   for (const p of leg.positions) {
  //     if (p.altitude * 100 > maxAlt) maxAlt = p.altitude * 100;
  //     if (p.groundspeed > maxSpeed) maxSpeed = p.groundspeed;
  //   }
  //   speedScaler = maxAlt / maxSpeed * 1;
  // }


  // let flight = 0;
  // let distance = 0;
  // let speed = 0;
  // let numPositions = 0;

  // let speeds: number[] = [];

  // flight += leg?.totalTime ?? 0;
  // if (leg !== null && leg.positions.length > 1) {
  //   let lastPos = leg.positions[0];
  //   let lastValidPos = lastPos;
  //   numPositions += leg.positions.length;
  //   speed = speed + lastPos.groundspeed;
  //   speeds.push(lastPos.groundspeed);
  //   for (let i = 1; i < leg.positions.length; i++) {
  //     const pos = leg.positions[i];
  //     if (pos.updateType !== null && (pos.updateType as DB.UpdateType) !== DB.UpdateType.PROJECTED) {
  //       lastValidPos = pos;
  //     } else {
  //       pos.groundspeed = lastValidPos.groundspeed;
  //       pos.altitude = lastValidPos.altitude;
  //     }
  //     distance = distance + getDistanceFromLatLonInKm(lastPos.latitude, lastPos.longitude, pos.latitude, pos.longitude);
  //     speed = speed + pos.groundspeed;
  //     speeds.push(pos.groundspeed);
  //     lastPos = pos;
  //   }
  // }

  // speeds = filterOutliers(speeds);
  // speeds.sort((a, b) => b - a);

  // let fastestSpeed = 0;
  // if (speeds.length > 0) {
  //   let filteredCount = 0;
  //   for (let i = 0; i < AVG_FILTER_NUM && i < speeds.length; i++) {
  //     filteredCount++;
  //     fastestSpeed = fastestSpeed + speeds[i];
  //   }
  //   fastestSpeed = fastestSpeed / filteredCount;
  // }

  // distance = distance * 0.54;
  // if (numPositions > 0) speed = speed / numPositions;

  // let selectedAircraftAPI: API.Types.Aircraft | null = null;
  // if (leg !== null) selectedAircraftAPI = leg.aircraft;

  return {
    params,
    entrySettings,
    leg,
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

      if (gxTrack === null || altitude === null || speed === null || course === null) {
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
        if (speed[i] === 0) continue;

        inserts.push(prisma.position.create({ data: {
          legId: id,
          altitude: (altitude[i] / 100),
          altitudeChange: '',
          groundspeed: speed[i],
          heading: course[i],
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

    throw redirect(301, `/entry/leg/${id}`);
    
  },

  delete: async ({ request, url, params }) => {
    const data = await request.formData();
  }
    
};
