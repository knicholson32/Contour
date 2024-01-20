import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API, ImageUploadState } from '$lib/types';
import { dateToDateStringForm, delay, getTimezoneObjectFromTimezone, timeStrAndTimeZoneToUTC } from '$lib/helpers/index.js';
import { v4 as uuidv4 } from 'uuid';
import * as helpers from '$lib/helpers';
import * as i from '$lib';

import { getTimeZones } from '@vvo/tzdb';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { generateDeadheads } from '$lib/server/db/deadhead';
import { generateAirportList } from '$lib/server/helpers';

// TODO: Calculate sunset and sunrise time for this day in local and Zulu time and display

const MAX_MB = 10;

export const load = async ({ fetch, params }) => {

  const entrySettings = await settings.getSet('entry');

  const legs = await prisma.leg.findMany({ 
    where: { dayId: parseInt(params.id) },
    select: { id: true, originAirportId: true, destinationAirportId: true, diversionAirportId: true, startTime_utc: true, endTime_utc: true, aircraftId: true },
    orderBy: { startTime_utc: 'asc' }
  });

  const leg = await prisma.leg.findUnique({ where: { id: params.leg }, include: { flightAwareData: true, day: true, aircraft: true }});

  const day = await prisma.dutyDay.findUnique({
    where: { id: entrySettings['entry.day.current'] },
    include: { legs: true, deadheads: {
      orderBy: { startTime_utc: 'asc' }
    }},
  });

  if (day === null) throw redirect(301, '/day');

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

  const legDeadheadCombo: ((typeof day.deadheads[0] | typeof legs[0]) & { type: 'deadhead' | 'leg', diversionAirportId: string | null })[] = [];
  for (const leg of legs) legDeadheadCombo.push({ ...leg, type: 'leg' });
  for (const dead of day.deadheads) legDeadheadCombo.push({ ...dead, type: 'deadhead', diversionAirportId: null });
  legDeadheadCombo.sort((a, b) => {
    if (a.startTime_utc === null || b.startTime_utc === null) return 0;
    return a.startTime_utc - b.startTime_utc
  });
  

  return {
    params,
    entrySettings,
    leg,
    // legs,
    day,
    positions: await prisma.position.findMany({ where: { legId: params.leg } }),
    fixes: await prisma.fix.findMany({ where: { legId: params.leg } }),
    legDeadheadCombo,
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

    const aeroAPIKey = await settings.get('general.aeroAPI');
    const fa = await settings.get('entry.day.entry.fa_id');

    const id = params.leg;

    const data = await request.formData();
    for (const key of data.keys()) {
      console.log(key, data.getAll(key));
    }


    // -----------------------------------------------------------------------------------------------------------------
    // Airports
    // -----------------------------------------------------------------------------------------------------------------

    let startAirport = data.get('from') as null | string;
    const startAirportTZ = data.get('from-tz') as null | string;
    let endAirport = data.get('to') as null | string;
    const endAirportTZ = data.get('to-tz') as null | string;
    let divertAirport = data.get('divert') as null | string;
    const divertAirportTZ = data.get('divert-tz') as null | string;

    if (startAirport === null || startAirport === '') return API.Form.formFailure('?/default', 'from', 'Required field');
    if (startAirportTZ === null || startAirportTZ === '') return API.Form.formFailure('?/default', 'from', 'Required field');
    if (endAirport === null || endAirport === '') return API.Form.formFailure('?/default', 'to', 'Required field');
    if (endAirportTZ === null || endAirportTZ === '') return API.Form.formFailure('?/default', 'to', 'Required field');

    startAirport = startAirport.trim().toLocaleUpperCase();
    endAirport = endAirport.trim().toLocaleUpperCase();
    divertAirport = divertAirport?.trim().toLocaleUpperCase() ?? '';
    if (divertAirport === '') divertAirport = null;


    // Create airport if it does not exist
    try {
      await addIfDoesNotExist(startAirport, aeroAPIKey);
      const airport = await prisma.airport.findUnique({
        where: { id: startAirport }
      });
      if (airport === null) return API.Form.formFailure('?/default', 'from', 'Unknown airport');
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', 'from', 'Error verifying airport');
    }

    // Create airport if it does not exist
    try {
      await addIfDoesNotExist(endAirport, aeroAPIKey);
      const airport = await prisma.airport.findUnique({
        where: { id: endAirport }
      });
      if (airport === null) return API.Form.formFailure('?/default', 'to', 'Unknown airport');
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', 'to', 'Error verifying airport');
    }

    // Create airport if it does not exist
    if (divertAirport !== null) {
      try {
        await addIfDoesNotExist(divertAirport, aeroAPIKey);
        const airport = await prisma.airport.findUnique({
          where: { id: endAirport }
        });
        if (airport === null) return API.Form.formFailure('?/default', 'divert', 'Unknown airport');
      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', 'divert', 'Error verifying airport');
      }
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Out / In Times
    // -----------------------------------------------------------------------------------------------------------------

    const startTime = data.get('out-date') as null | string;
    const startTimeTZ = data.get('out-tz') as null | string;
    const endTime = data.get('in-date') as null | string;
    const endTimeTZ = data.get('in-tz') as null | string;

    if (startTime === null || startTime === '') return API.Form.formFailure('?/default', 'out', 'Required field');
    if (startTimeTZ === null || startTimeTZ === '') return API.Form.formFailure('?/default', 'out', 'Required field');
    if (endTime === null || endTime === '') return API.Form.formFailure('?/default', 'in', 'Required field');
    if (endTimeTZ === null || endTimeTZ === '') return API.Form.formFailure('?/default', 'in', 'Required field');


    const startUTC = helpers.timeStrAndTimeZoneToUTC(startTime, startTimeTZ);
    if (startUTC === null) return API.Form.formFailure('?/default', 'out', 'Unknown Timezone');

    const endUTC = helpers.timeStrAndTimeZoneToUTC(endTime, endTimeTZ);
    if (endUTC === null) return API.Form.formFailure('?/default', 'in', 'Unknown Timezone');

    if (startUTC.value > endUTC.value) return API.Form.formFailure('?/default', 'out', 'Out is after In');
    if (endUTC.value - startUTC.value > 86400) return API.Form.formFailure('?/default', 'out', 'Flight time is longer than 24 hours');

    // -----------------------------------------------------------------------------------------------------------------
    // Aircraft
    // -----------------------------------------------------------------------------------------------------------------

    let aircraft = data.get('aircraft') as null | string;
    let ident = data.get('ident') as null | string;

    if (aircraft === null || aircraft === '') return API.Form.formFailure('?/default', 'aircraft', 'Required field');
    if (ident === null || ident === '') return API.Form.formFailure('?/default', 'ident', 'Required field');
    ident = ident.trim().toUpperCase();

    let aircraftId: string = '';

    try {
      const ac = await prisma.aircraft.findUnique({ where: { registration: aircraft as string }, select: { id: true } });
      if (ac === null) return API.Form.formFailure('?/default', 'aircraft', 'Aircraft does not exist.');
      aircraftId = ac.id;
    } catch (e) {
      return API.Form.formFailure('?/default', 'aircraft', 'Invalid data');
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Times
    // -----------------------------------------------------------------------------------------------------------------

    let totalTime = data.get('total-time') as null | string;
    let picTime = data.get('pic-time') as null | string;
    let sicTime = data.get('sic-time') as null | string;
    let nightTime = data.get('night-time') as null | string;
    let soloTime = data.get('solo-time') as null | string;
    let xcTime = data.get('xc-time') as null | string;
    let actualInstrumentTime = data.get('actual-instrument-time') as null | string;
    let simulatedInstrumentTime = data.get('simulated-instrument-time') as null | string;
    let dualGivenTime = data.get('dual-given-time') as null | string;
    let dualReceivedTime = data.get('dual-received-time') as null | string;
    let simTime = data.get('sim-time') as null | string;

    if (totalTime === null || totalTime === '') return API.Form.formFailure('?/default', 'total-time', 'Required field');
    if (picTime === null || picTime === '' || isNaN(parseFloat(picTime))) picTime = null;
    if (sicTime === null || sicTime === '' || isNaN(parseFloat(sicTime))) sicTime = null;
    if (nightTime === null || nightTime === '' || isNaN(parseFloat(nightTime))) nightTime = null;
    if (soloTime === null || soloTime === '' || isNaN(parseFloat(soloTime))) soloTime = null;
    if (xcTime === null || xcTime === '' || isNaN(parseFloat(xcTime))) xcTime = null;
    if (actualInstrumentTime === null || actualInstrumentTime === '' || isNaN(parseFloat(actualInstrumentTime))) actualInstrumentTime = null;
    if (simulatedInstrumentTime === null || simulatedInstrumentTime === '' || isNaN(parseFloat(simulatedInstrumentTime))) simulatedInstrumentTime = null;
    if (dualGivenTime === null || dualGivenTime === '' || isNaN(parseFloat(dualGivenTime))) dualGivenTime = null;
    if (dualReceivedTime === null || dualReceivedTime === '' || isNaN(parseFloat(dualReceivedTime))) dualReceivedTime = null;
    if (simTime === null || simTime === '' || isNaN(parseFloat(simTime))) simTime = null;

    // -----------------------------------------------------------------------------------------------------------------
    // Takeoffs & Landings and other Integers
    // -----------------------------------------------------------------------------------------------------------------
    
    let dayTakeoffs = data.get('day-takeoffs') as string | null;
    let dayLandings = data.get('day-landings') as string | null;
    let nightTakeoffs = data.get('night-takeoffs') as string | null;
    let nightLandings = data.get('night-landings') as string | null;
    let holds = data.get('holds') as string | null;
    let pax = data.get('pax') as string | null;

    if (dayTakeoffs === null || dayTakeoffs === '' || isNaN(parseInt(dayTakeoffs))) dayTakeoffs = null;
    if (dayLandings === null || dayLandings === '' || isNaN(parseInt(dayLandings))) dayLandings = null;
    if (nightTakeoffs === null || nightTakeoffs === '' || isNaN(parseInt(nightTakeoffs))) nightTakeoffs = null;
    if (nightLandings === null || nightLandings === '' || isNaN(parseInt(nightLandings))) nightLandings = null;
    if (holds === null || holds === '' || isNaN(parseInt(holds))) holds = null;
    if (pax === null || pax === '' || isNaN(parseInt(pax))) pax = null;


    // -----------------------------------------------------------------------------------------------------------------
    // Route
    // -----------------------------------------------------------------------------------------------------------------
    let route = data.get('route');


    // -----------------------------------------------------------------------------------------------------------------
    // Other
    // -----------------------------------------------------------------------------------------------------------------
    let flightReview = data.get('flight-review') as string | null === 'true' ? true : false;
    let checkride = data.get('checkride') as string | null === 'true' ? true : false;
    let ipc = data.get('ipc') as string | null === 'true' ? true : false;
    let faa6158 = data.get('faa6158') as string | null === 'true' ? true : false;
    let notes = data.get('comments') as string | null;

    try {
      const leg = await prisma.leg.update({ where: { id }, data: {
        ident: ident,
        originAirportId: startAirport,
        destinationAirportId: endAirport,
        diversionAirportId: divertAirport,

        aircraftId: aircraftId,

        startTime_utc: startUTC.value,
        endTime_utc: endUTC.value,

        totalTime: totalTime === null ? undefined : parseFloat(totalTime),
        pic: picTime === null ? undefined : parseFloat(picTime),
        sic: sicTime === null ? undefined : parseFloat(sicTime),
        night: nightTime === null ? undefined : parseFloat(nightTime),
        solo: soloTime === null ? undefined : parseFloat(soloTime),
        xc: xcTime === null ? undefined : parseFloat(xcTime),
        actualInstrument: actualInstrumentTime === null ? undefined : parseFloat(actualInstrumentTime),
        simulatedInstrument: simulatedInstrumentTime === null ? undefined : parseFloat(simulatedInstrumentTime),
        dualGiven: dualGivenTime === null ? undefined : parseFloat(dualGivenTime),
        dualReceived: dualReceivedTime === null ? undefined : parseFloat(dualReceivedTime),
        sim: simTime === null ? undefined : parseFloat(simTime),

        dayTakeOffs: dayTakeoffs === null ? undefined : parseInt(dayTakeoffs),
        dayLandings: dayLandings === null ? undefined : parseInt(dayLandings),
        nightTakeOffs: nightTakeoffs === null ? undefined : parseInt(nightTakeoffs),
        nightLandings: nightLandings === null ? undefined : parseInt(nightLandings),

        flightReview: flightReview,
        checkride: checkride,
        ipc: ipc,
        faa6158: faa6158,

        passengers: pax === null ? undefined : parseInt(pax),

        notes: notes === null ? undefined : notes
      }});

      await generateDeadheads(parseInt(params.id));

      return API.Form.formSuccess('?/default');

    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', '*', 'Could not create leg');
    }
  },

  delete: async ({ request, url, params }) => {
    const data = await request.formData();
    for (const key of data.keys()) {
      console.log(key, data.getAll(key));
    }


    let id = data.get('id') as null | string;
    if (id === null || id === '') return API.Form.formFailure('?/delete', '*', 'Required Field');

    try {
      await prisma.leg.delete({ where: { id } });
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/delete', '*', 'Could not delete');
    }

    await generateDeadheads(parseInt(params.id));

    const c = await prisma.leg.count({ where: { dayId: parseInt(params.id)}});

    if (c > 0) {
      throw redirect(301, '/day/' + params.id + '/entry?active=menu');
    } else {
      throw redirect(301, '/day/' + params.id);
    }
  }
};
