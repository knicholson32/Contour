import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API, ImageUploadState } from '$lib/types';
import { delay } from '$lib/helpers/index.js';
import { v4 as uuidv4 } from 'uuid';

import * as helpers from '$lib/server/helpers';

const MAX_MB = 10;

export const load = async ({ fetch, params, url }) => {

  const entrySettings = await settings.getSet('entry');

  console.log(params);

  // const aircrafts = await prisma.aircraft.findMany({ include: { type: true, _count: true, legs: { select: { totalTime: true } } }, orderBy: [{ type: { typeCode: 'asc' } }, { registration: 'asc' }] });
  // if (params.id === undefined) {
  //   if (aircrafts.length > 0) throw redirect(301, '/entry/' + aircrafts[0].id + '?active=menu')
  //   else throw redirect(301, '/entry/new')
  // }

  // const aircraftTimes: { [key: string]: string } = {};
  // for (const ac of aircrafts) {
  //   const legTimes = ac.legs.map((v) => v.totalTime);
  //   if (legTimes.length !== 0) aircraftTimes[ac.id] = (legTimes.reduce((p, c) => p + c)).toFixed(1);
  //   else aircraftTimes[ac.id] = (0).toFixed(1);
  // }

  // const currentAircraft = await prisma.aircraft.findUnique({ where: { id: params.id }, include: { type: true, _count: true } });
  // if (params.id !== 'new' && currentAircraft === null) throw redirect(301, '/entry/new');

  // let orderGroups: { typeCode: string, regs: (typeof aircrafts[0])[] }[] = []
  // let currentType = '';
  // let currentGroup: (typeof aircrafts[0])[] = []
  // for (const ac of aircrafts) {
  //   if (ac.type.typeCode.trim().toLocaleUpperCase() !== currentType) {
  //     if (currentType !== '') orderGroups.push({ typeCode: currentType, regs: currentGroup });
  //     currentType = ac.type.typeCode.trim().toLocaleUpperCase();
  //     currentGroup = [];
  //   }
  //   currentGroup.push(ac);
  // }
  // if (currentType !== '') orderGroups.push({ typeCode: currentType, regs: currentGroup });

  // const types = await prisma.aircraftType.findMany();
  // const typeOptions: { title: string; value: string; unset?: boolean }[] = []

  // for (const t of types) {
  //   typeOptions.push({
  //     title: t.typeCode + ` (${t.model})`,
  //     value: t.id
  //   });
  // }

  // // Get all tail numbers (so we know if one exists)
  // const tails = aircrafts.map((v) => v.registration);
  // return {
  //   entrySettings,
  //   aircrafts,
  //   aircraftTimes,
  //   aircraft: currentAircraft,
  //   typeOptions,
  //   orderGroups,
  //   tails,
  //   types,
  //   params,
  //   regDefault: url.searchParams.get('reg'),
  //   enums: {
  //     categoryClass: Object.keys(CategoryClass).map((v) => { return { value: v, title: `${categoryClassToString(v as CategoryClass)} (${v})` }; }),
  //     gearType: Object.keys(GearType).map((v) => { return { value: v, title: `${gearTypeToString(v as GearType)} (${v})` }; }),
  //     engineType: Object.keys(EngineType).map((v) => { return { value: v, title: `${engineTypeToString(v as EngineType)} (${v})` }; }),
  //   }
  // }

  if (await settings.get('general.aeroAPI') === '') throw redirect(301, '/settings/general')

  const airports = await ((await fetch('/api/airports')).json()) as API.Airports;

  return {
    entry: params.id === undefined ? null : await prisma.leg.findUnique({ where: { id: params.id }, include: { _count: true, aircraft: { select: { registration: true, id: true }} }}),
    entries: await prisma.leg.findMany({ select: { id: true }}),
    airports: (airports.ok === true) ? airports.airports : [] as API.Types.Airport[],
    aircraft: await prisma.aircraft.findMany({ select: { registration: true, id: true, type: { select: { typeCode: true, make: true, model: true } } }, orderBy: { registration: 'asc' } }),
    params
  }
}

export const actions = {
  createOrModify: async ({ request, params, url, fetch }) => {

    const id = (params.id !== 'new' ? params.id : undefined) ?? uuidv4();

    const data = await request.formData();
    await delay(500);
    for (const key of data.keys()) {
      console.log(key, data.getAll(key));
    }

    let date = data.get('date');
    let aircraft = data.get('aircraft');
    let from = data.get('from');
    let fromTz = data.get('from-tz');
    let to = data.get('to');
    let toTz = data.get('to-tz');
    let route = data.get('route');
    let pax = data.get('pax');
    let totalTime = data.get('total-time');
    let picTime = data.get('pic-time');
    let sicTime = data.get('sic-time');
    let nightTime = data.get('night-time');
    let soloTime = data.get('solo-time');
    let xcTime = data.get('xc-time');
    let dayTakeoffs = data.get('day-takeoffs');
    let dayLandings = data.get('day-landings');
    let nightTakeoffs = data.get('night-takeoffs');
    let nightLandings = data.get('night-landings');
    let actualInstrumentTime = data.get('actual-instrument-time');
    let simulatedInstrumentTime = data.get('simulated-instrument-time');
    let holds = data.get('holds');
    let dualGivenTime = data.get('dual-given-time');
    let dualReceivedTime = data.get('dual-received-time');
    let simTime = data.get('sim-time');
    let comments = data.get('comments');

    if (date === null || date === '') return API.Form.formFailure('?/default', 'date', 'Required field');
    if (aircraft === null || aircraft === '') return API.Form.formFailure('?/default', 'aircraft', 'Required field');
    if (from === null || from === '') return API.Form.formFailure('?/default', 'from', 'Required field');
    if (to === null || to === '') return API.Form.formFailure('?/default', 'to', 'Required field');
    if (totalTime === null || totalTime === '') return API.Form.formFailure('?/default', 'total-time', 'Required field');

    let aircraftId: string = '';


    // Check airports
    try {
      if (await prisma.airport.findUnique({ where: { id: from as string } }) === null) {
        // Issue a post request to add the airport to the DB
        const r = await fetch('/api/airports/' + from, { method: 'POST' });
        // Get the resulting airport
        const airport = (await r.json()) as API.Response;
        // Check if the API request was successful
        if (airport.ok === false) {
          return API.Form.formFailure('?/default', 'from', 'Airport could not be found. Check ICAO.');
        }
      }
    } catch (e) {
      return API.Form.formFailure('?/default', 'from', 'Invalid data');
    }

    try {
      if (await prisma.airport.findUnique({ where: { id: to as string } }) === null) {
        // Issue a post request to add the airport to the DB
        const r = await fetch('/api/airports/' + to, { method: 'POST' });
        // Get the resulting airport
        const airport = (await r.json()) as API.Response;
        // Check if the API request was successful
        if (airport.ok === false) {
          return API.Form.formFailure('?/default', 'to', 'Airport could not be found. Check ICAO.');
        }
      }
    } catch (e) {
      return API.Form.formFailure('?/default', 'to', 'Invalid data');
    }

    // TODO: Check aircraft
    try {
      const ac = await prisma.aircraft.findUnique({ where: { registration: aircraft as string }, select: { id: true } });
      if (ac === null) return API.Form.formFailure('?/default', 'aircraft', 'Aircraft does not exist.');
      aircraftId = ac.id;
    } catch (e) {
      return API.Form.formFailure('?/default', 'aircraft', 'Invalid data');
    }

    // Assign defaults if these values are not provided
    if (pax === null                      || pax === ''                      || (typeof pax === 'string' && isNaN(parseInt(pax))))                                             pax = '0';
    if (picTime === null                  || picTime === ''                  || (typeof picTime === 'string' && isNaN(parseInt(picTime))))                                     picTime = '0';
    if (sicTime === null                  || sicTime === ''                  || (typeof sicTime === 'string' && isNaN(parseInt(sicTime))))                                     sicTime = '0';
    if (nightTime === null                || nightTime === ''                || (typeof nightTime === 'string' && isNaN(parseInt(nightTime))))                                 nightTime = '0';
    if (soloTime === null                 || soloTime === ''                 || (typeof soloTime === 'string' && isNaN(parseInt(soloTime))))                                   soloTime = '0';
    if (xcTime === null                   || xcTime === ''                   || (typeof xcTime === 'string' && isNaN(parseInt(xcTime))))                                       xcTime = '0';
    if (dayTakeoffs === null              || dayTakeoffs === ''              || (typeof dayTakeoffs === 'string' && isNaN(parseInt(dayTakeoffs))))                             dayTakeoffs = '0';
    if (dayLandings === null              || dayLandings === ''              || (typeof dayLandings === 'string' && isNaN(parseInt(dayLandings))))                             dayLandings = '0';
    if (nightTakeoffs === null            || nightTakeoffs === ''            || (typeof nightTakeoffs === 'string' && isNaN(parseInt(nightTakeoffs))))                         nightTakeoffs = '0';
    if (nightLandings === null            || nightLandings === ''            || (typeof nightLandings === 'string' && isNaN(parseInt(nightLandings))))                         nightLandings = '0';
    if (actualInstrumentTime === null     || actualInstrumentTime === ''     || (typeof actualInstrumentTime === 'string' && isNaN(parseInt(actualInstrumentTime))))           actualInstrumentTime = '0';
    if (simulatedInstrumentTime === null  || simulatedInstrumentTime === ''  || (typeof simulatedInstrumentTime === 'string' && isNaN(parseInt(simulatedInstrumentTime))))     simulatedInstrumentTime = '0';
    if (holds === null                    || holds === ''                    || (typeof holds === 'string' && isNaN(parseInt(holds))))                                         holds = '0';
    if (dualGivenTime === null            || dualGivenTime === ''            || (typeof dualGivenTime === 'string' && isNaN(parseInt(dualGivenTime))))                         dualGivenTime = '0';
    if (dualReceivedTime === null         || dualReceivedTime === ''         || (typeof dualReceivedTime === 'string' && isNaN(parseInt(dualReceivedTime))))                   dualReceivedTime = '0';
    if (simTime === null                  || simTime === ''                  || (typeof simTime === 'string' && isNaN(parseInt(simTime))))                                     simTime = '0';
    if (comments === null                 || comments === '')                                                                                                                  comments = '';

    return API.Form.formFailure('?/default', '*', 'Blah');
    return API.Form.formSuccess('?/default');

    if (params.id === 'new') {
      try {
        await prisma.leg.create({ data: {
          id,
          aircraftId: aircraftId,

          originAirportId: from as string,
          destinationAirportId: to as string,

          totalTime: parseFloat(totalTime as string),
          pic: parseFloat(picTime as string),
          sic: parseFloat(sicTime as string),
          night: parseFloat(nightTime as string),
          solo: parseFloat(soloTime as string),
          xc: parseFloat(xcTime as string),

          dayTakeOffs: parseInt(dayTakeoffs as string),
          dayLandings: parseInt(dayLandings as string),
          nightTakeOffs: parseInt(nightTakeoffs as string),
          nightLandings: parseInt(nightLandings as string),

          simulatedInstrument: parseFloat(simulatedInstrumentTime as string),
          actualInstrument: parseFloat(actualInstrumentTime as string),
          holds: parseInt(holds as string),

          dualGiven: parseFloat(dualGivenTime as string),
          dualReceived: parseFloat(dualReceivedTime as string),
          sim: parseFloat(simTime as string),

          passengers: parseInt(pax as string),

          notes: comments as string
        } });
      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', '*', 'Aircraft already exists');
      }
    } else {
      try {

        const currentData = await prisma.aircraft.findUnique({ where: { id }, include: { type: true }});

        // console.log('1', (taa === 'true') === currentData?.taa);
        // console.log('2', taa === null ? null : (taa === 'true') === currentData?.taa ? null : (taa === 'true'));

        const data = {
          id,
          type: { connect: { id: type as string } },
          registration: (tail as string).toLocaleUpperCase(),
          year: year === null ? null : parseInt(year as string),
          serial: serial as string | null,
          simulator: (sim as string) === 'true',
          complex: complex === null ? null : (complex === 'true') === currentData?.type.complex ? null : (complex === 'true'),
          taa: taa === null ? null : (taa === 'true') === currentData?.type.taa ? null : (taa === 'true'),
          highPerformance: hp === null ? null : (hp === 'true') === currentData?.type.highPerformance ? null : (hp === 'true'),
          pressurized: press === null ? null : (press === 'true') === currentData?.type.pressurized ? null : (press === 'true'),
          notes: notes as string | null
        };
        console.log('update', data);
        await prisma.aircraft.update({ where: { id }, data });
      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', '*', 'An unknown error occurred. See logs.');
      }
    }

    // try {

    //   console.log(imageState);

    //   if (imageState as ImageUploadState === ImageUploadState.UPDATE) {
    //     if (image !== null && image !== '' && !(image instanceof File && image.size === 0)) {
    //       const results = await helpers.uploadImage(image, MAX_MB);
    //       if (results.success !== true) return API.Form.formFailure('?/default', 'image', results.message);
    //       try {
    //         await prisma.aircraft.update({ where: { id }, data: { imageId: results.id } });
    //       } catch (e) {
    //         console.log('Error adding image to aircraft', e);
    //         return API.Form.formFailure('?/default', 'image', 'Could not add image to aircraft type');
    //       }
    //     }
    //   } else if (imageState as ImageUploadState === ImageUploadState.DELETE) {
    //     const imageId = await prisma.aircraftType.findUnique({ where: { id }, select: { imageId: true } });
    //     if (imageId?.imageId !== null && imageId?.imageId !== undefined) {
    //       await prisma.aircraftType.update({ where: { id }, data: { imageId: null }, select: { id: true } });
    //       await prisma.image.delete({ where: { id: imageId.imageId } });
    //     }
    //   }
    // } catch (e) {
    //   console.log('Error uploading image to aircraft', e);
    //   return API.Form.formFailure('?/default', 'image', 'Could not add image to aircraft type');
    // }

    // // Clear any hanging images
    // await helpers.clearHangingImages()

    // const ref = url.searchParams.get('ref');
    // console.log('ref',ref);
    // if (ref !== null) throw redirect(301, ref);
    // else throw redirect(301, '/aircraft/entry/' + id + '?active=form');
    // // return API.Form.formSuccess('?/default');
    return API.Form.formSuccess('?/default');
  },

  delete: async ({ request, params }) => {

    // const data = await request.formData();
    // const id = data.get('id');
    // if (id === null || id === '') return API.Form.formFailure('?/delete', 'id', 'Required field');
    // await delay(500);

    // try {
    //   await prisma.aircraft.delete({ where: { id: id as string } });
    // } catch (e) {
    //   console.log('Error deleting aircraft', e);
    //   return API.Form.formFailure('?/default', '*', 'Could not delete. Log entries with this aircraft still exist.');
    // }

    // // Clear any hanging images
    // await helpers.clearHangingImages()

    // // Done!
    // throw redirect(301, '/aircraft/entry');
    return API.Form.formSuccess('?/default');
  },
};