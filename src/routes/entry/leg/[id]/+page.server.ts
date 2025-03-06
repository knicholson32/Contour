import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API, ImageUploadState, legSelector, type Entry } from '$lib/types';
import { dateToDateStringForm, delay, getTimezoneObjectFromTimezone, timeStrAndTimeZoneToUTC } from '$lib/helpers/index.js';
import { DB } from '$lib/types';
import { v4 as uuidv4 } from 'uuid';
import * as helpers from '$lib/helpers';
import type { Prisma } from '@prisma/client';
import { getTimeZones } from '@vvo/tzdb';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { generateDeadheads } from '$lib/server/db/deadhead';
import { filterOutliers, generateAirportList, getDistanceFromLatLonInKm } from '$lib/server/helpers';
import type * as Types from '@prisma/client';
import { fetchLegsForSideMenu } from '$lib/server/lib/leg';
import Fuse from 'fuse.js';

// TODO: Calculate sunset and sunrise time for this day in local and Zulu time and display

const AVG_FILTER_NUM = 2;

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

  // Check to see if we are visiting this page to fully resolve the leg with it's tour / day pair
  const resolve = url.searchParams.get('resolve');
  if (leg !== null && resolve !== null) redirect(302, `/entry/leg/${params.id}?active=form${leg.dayId === null ? '' : '&day=' + leg.dayId}${leg.day?.tourId === undefined ? '' : '&tour=' + leg.day.tourId}`);

  // If this isn't a new leg, redirect up a level so we can select the most recent leg (or create one if there are none)
  if (leg === null && params.id !== 'new') redirect(302, `/entry/leg?${url.searchParams.toString()}`);

  // Get the dayId from the search params, if it exists
  const dayId = url.searchParams.get('day') === null ? null : parseInt(url.searchParams.get('day') ?? '-1');

  // Get the tourId form the search params, if it exists
  const tourId = url.searchParams.get('tour') === null ? null : parseInt(url.searchParams.get('tour') ?? '-1');

  let currentDay: Prisma.DutyDayGetPayload<{}> | null = null;
  if (dayId !== null) {
    currentDay = await prisma.dutyDay.findUnique({ where: { id: dayId } });
    if (currentDay === null) redirect(302, '/entry/leg' + url.search);
  }

  if (tourId !== null) {
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (tour === null) redirect(302, '/entry/leg' + url.search);
  }

  // Fetch all the legs for the side menu
  const legs = await fetchLegsForSideMenu(dayId, tourId, { search: url.searchParams.get('search')});


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


  interface Combo {
    type: string
    startTime_utc: number
    id: string
  }

  interface Deadhead extends Combo {
    type: 'deadhead',
    entry: Prisma.DeadheadGetPayload<{}>
  }

  interface Leg extends Combo {
    type: 'leg',
    entry: Entry
  }

  type LegOrDeadhead = Leg | Deadhead;

  let legDeadheadCombo: LegOrDeadhead[] | null = null;

  let simulatedLegs: Entry[] = [];

  if (dayId !== null) {
    simulatedLegs = await prisma.leg.findMany({ where: { aircraft: { simulator: true }, dayId: dayId }, select: legSelector });
    const day = await prisma.dutyDay.findUnique({
      where: { id: dayId },
      include: {
        legs: { select: legSelector, orderBy: { startTime_utc: 'asc' }, where: { aircraft: { simulator: false } } },
        deadheads: { orderBy: { startTime_utc: 'asc' } }
      },
    });

    if (day !== null) {
      legDeadheadCombo = [];
      for (const leg of day.legs) {
        const entry: Leg = { type: 'leg', entry: leg, startTime_utc: leg.startTime_utc ?? 0, id: leg.id }
        legDeadheadCombo.push(entry);
      }
      for (const dead of day.deadheads) {
        const entry: Deadhead = { type: 'deadhead', entry: dead, startTime_utc: dead.startTime_utc ?? 0, id: dead.id }
        legDeadheadCombo.push(entry);
      }
      legDeadheadCombo.sort((a, b) => {
        if (a.startTime_utc === null || b.startTime_utc === null) return 0;
        return a.startTime_utc - b.startTime_utc
      });
    }
  }

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


  let flight = 0;
  let distance = 0;
  let speed = 0;
  let numPositions = 0;

  let speeds: number[] = [];

  flight += leg?.totalTime ?? 0;
  if (leg !== null && leg.positions.length > 1) {
    let lastPos = leg.positions[0];
    let lastValidPos = lastPos;
    numPositions += leg.positions.length;
    speed = speed + lastPos.groundspeed;
    speeds.push(lastPos.groundspeed);
    for (let i = 1; i < leg.positions.length; i++) {
      const pos = leg.positions[i];
      if (pos.updateType !== null && (pos.updateType as DB.UpdateType) !== DB.UpdateType.PROJECTED) {
        lastValidPos = pos;
      } else {
        pos.groundspeed = lastValidPos.groundspeed;
        pos.altitude = lastValidPos.altitude;
      }
      distance = distance + getDistanceFromLatLonInKm(lastPos.latitude, lastPos.longitude, pos.latitude, pos.longitude);
      speed = speed + pos.groundspeed;
      speeds.push(pos.groundspeed);
      lastPos = pos;
    }
  }

  speeds = filterOutliers(speeds);
  speeds.sort((a, b) => b - a);

  let fastestSpeed = 0;
  if (speeds.length > 0) {
    let filteredCount = 0;
    for (let i = 0; i < AVG_FILTER_NUM && i < speeds.length; i++) {
      filteredCount++;
      fastestSpeed = fastestSpeed + speeds[i];
    }
    fastestSpeed = fastestSpeed / filteredCount;
  }

  distance = distance * 0.54;
  if (numPositions > 0) speed = speed / numPositions;

  let selectedAircraftAPI: API.Types.Aircraft | null = null;
  if (leg !== null) selectedAircraftAPI = leg.aircraft;

  return {
    params,
    searchParams: {
      dayId,
      tourId
    },
    entrySettings,
    leg,
    legs,
    currentDay,
    selectedAircraftAPI,
    // positions: await prisma.position.findMany({ where: { legId: params.leg } }),
    // fixes: await prisma.fix.findMany({ where: { legId: params.leg } }),
    legDeadheadCombo,
    simulatedLegs,
    stats: {
      time: leg === null || leg.positions.length === 0 ? null : (leg.positions[leg.positions.length - 1].timestamp - leg.positions[0].timestamp) / 60 / 60,
      avgSpeed: speed,
      maxSpeed: fastestSpeed,
      distance
    },
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

export const actions = {
  deleteFA: async ({ request, url, params }) => {
    const id = params.id;

    const currentLeg = await prisma.leg.findUnique({ where: { id } });
    if (currentLeg === null) return API.Form.formFailure('?/default', '*', 'Leg does not exist');

    try {
      await prisma.flightAwareData.delete({ where: { legId: currentLeg.id } });
    } catch(e) {}
    try {
      await prisma.position.deleteMany({ where: { legId: currentLeg.id } });
    } catch(e) { }
    try {
      await prisma.fix.deleteMany({ where: { legId: currentLeg.id } });
    } catch (e) { }

  },
  update: async ({ request, url, params }) => {

    const aeroAPIKey = await settings.get('general.aeroAPI');
    const fa = await settings.get('entry.day.entry.fa_id');

    const id = params.id;

    const currentLeg = await prisma.leg.findUnique({ where: { id }, include: { day: true }});
    if (currentLeg === null) return API.Form.formFailure('?/default', '*', 'Leg does not exist');

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

    const startEmpty = startAirport === null || startAirport === '';
    const endEmpty = endAirport === null || endAirport === '';

    if ((startEmpty && !endEmpty) || (endEmpty && !startEmpty)) return API.Form.formFailure('?/default', 'from', 'Specify both start and end airport or no airports');
    // if (startAirportTZ === null || startAirportTZ === '') return API.Form.formFailure('?/default', 'from', 'Required field');
    // if (endAirportTZ === null || endAirportTZ === '') return API.Form.formFailure('?/default', 'to', 'Required field');


    startAirport = startAirport?.trim().toLocaleUpperCase() ?? '';
    if (startAirport === '') startAirport = null;
    endAirport = endAirport?.trim().toLocaleUpperCase() ?? '';
    if (endAirport === '') endAirport = null;
    divertAirport = divertAirport?.trim().toLocaleUpperCase() ?? '';
    if (divertAirport === '') divertAirport = null;


    // Create airport if it does not exist
    if (startAirport !== null) {
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
    }

    // Create airport if it does not exist
    if (endAirport !== null) {
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
    }

    // Create airport if it does not exist
    if (divertAirport !== null) {
      try {
        await addIfDoesNotExist(divertAirport, aeroAPIKey);
        const airport = await prisma.airport.findUnique({
          where: { id: divertAirport }
        });
        if (airport === null) return API.Form.formFailure('?/default', 'divert', 'Unknown airport');
      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', 'divert', 'Error verifying airport');
      }
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Aircraft
    // -----------------------------------------------------------------------------------------------------------------

    let aircraft = data.get('aircraft') as null | string;
    let ident = data.get('ident') as null | string;

    if (aircraft === null || aircraft === '') return API.Form.formFailure('?/default', 'aircraft', 'Required field');
    if (ident !== null && ident !== '') ident = ident.trim().toUpperCase();

    let aircraftId: string = '';
    let ac: Prisma.AircraftGetPayload<{ include: { type: true } }> | null = null;
    try {
      ac = await prisma.aircraft.findUnique({ where: { registration: aircraft as string }, include: { type: true } });
      if (ac === null) return API.Form.formFailure('?/default', 'aircraft', 'Aircraft does not exist.');
      aircraftId = ac.id;

    } catch (e) {
      return API.Form.formFailure('?/default', 'aircraft', 'Invalid data');
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Out / In Times
    // -----------------------------------------------------------------------------------------------------------------

    let useBlock = data.get('use-block') === 'true';
    const startTime = data.get('out-date') as null | string;
    const startTimeTZ = data.get('out-tz') as null | string;
    const endTime = data.get('in-date') as null | string;
    const endTimeTZ = data.get('in-tz') as null | string;
    const date = data.get('date') as null | string;

    // Initialize time variables that we may modify later
    let startUTCValue = currentLeg.startTime_utc;
    let endUTCValue = currentLeg.endTime_utc;
    let relativeOrder = currentLeg.relativeOrder;

    if (useBlock || (currentLeg.dayId !== null && ac.simulator === false)) {
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

      // Assign the start and end values based on the time pickers
      startUTCValue = startUTC.value;
      endUTCValue = endUTC.value;

      // Assign useBlock as true, just in case this is a duty day without a sim and the user somehow selected false
      useBlock = true;
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

    // Calculate sim time based on whether or not this is a sim aircraft
    let simTime = 0;
    if (ac.simulator) simTime = parseFloat(totalTime);

    // If we have provided a date, the user wants to use that instead of the flight aware info.
    if (!useBlock) {
      // Set the start value to the start of the duty day, or the date for the leg
      if (date !== null) startUTCValue = Math.floor(new Date(date).getTime() / 1000);
      else startUTCValue = currentLeg.day?.startTime_utc ?? 0; // This will never happen (the ??) but TS doesn't know that
      endUTCValue = startUTCValue + (parseFloat(totalTime) * 60 * 60);
      // TODO: Probably we should then go through all the other legs that share this date and resolve any order gaps
      relativeOrder = await prisma.leg.count({ where: { startTime_utc: startUTCValue } });
    }

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

        startTime_utc: startUTCValue,
        endTime_utc: endUTCValue,
        relativeOrder: relativeOrder,

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

        dayTakeOffs: dayTakeoffs === null ? undefined : parseInt(dayTakeoffs),
        dayLandings: dayLandings === null ? undefined : parseInt(dayLandings),
        nightTakeOffs: nightTakeoffs === null ? undefined : parseInt(nightTakeoffs),
        nightLandings: nightLandings === null ? undefined : parseInt(nightLandings),

        holds: holds === null ? undefined : parseInt(holds),

        flightReview: flightReview,
        checkride: checkride,
        ipc: ipc,
        faa6158: faa6158,

        useBlock: useBlock,

        passengers: pax === null ? undefined : parseInt(pax),

        notes: notes === null ? undefined : notes
      }});


      console.log('GENERATE', leg.dayId !== null);
      if (leg.dayId !== null) await generateDeadheads(leg.dayId);

      // ---------------------------------------------------------------------------------------------------------------
      // Approaches
      // ---------------------------------------------------------------------------------------------------------------

      const approaches = data.getAll('approach') as string[];
      await prisma.approach.deleteMany({ where: { legId: leg.id }});

      try {
        const inserts: Types.Prisma.PrismaPromise<any>[] = [];
        for (const a of approaches) {
          const approach = JSON.parse(a) as Types.Approach;
          if (approach === null) continue;
          approach.legId = leg.id;
          await addIfDoesNotExist(approach.airportId, aeroAPIKey);
          inserts.push(prisma.approach.create({ data: approach }));
        }
        await prisma.$transaction(inserts);
      } catch (e) {
        console.log('ERROR: Failed to parse approach', e);
      }

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

    let tourId = data.get('tour') as null | string;
    let dayId = data.get('day') as null | string;
    try {
      await prisma.approach.deleteMany({ where: { legId: id } });
      const leg = await prisma.leg.delete({ where: { id } });
      if (leg.dayId !== null) await generateDeadheads(leg.dayId);
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/delete', '*', 'Could not delete');
    }

    const u = new URLSearchParams(url.search);
    u.delete('/delete');
    if (dayId !== null) u.set('day', dayId);
    if (tourId !== null) u.set('tour', tourId);
    redirect(302, `/entry/leg?${u.toString()}`);
  },

  modifyDutyDay: async ({ request, url, params }) => {
    const data = await request.formData();
    for (const key of data.keys()) console.log(key, data.getAll(key));

    // Get the day ID that the user submitted
    let dayId = data.get('dutyDayID') as null | string;
    // If blank, the day should be removed, so assign null
    if (dayId === '') dayId = null;

    // Get the current leg info so we can see if there is currently a day. We'll use that
    // to decide if we should generate deadheads for the updated day.
    const currentLeg = await prisma.leg.findUnique({ where: { id: params.id } });
    if (currentLeg === null) return API.Form.formFailure('?/modifyDutyDay', '*', 'Leg does not exist');

    // Try-Catch for error protection
    try {
      // Check if the day should be removed
      if (dayId === null) {
        // It should. Update the leg to remove the duty day association
        await prisma.leg.update({ where: { id: params.id }, data: { dayId: null } });
      } else {
        // We are modifying or adding a day association

        // Get the numeric value passed by the user. If not a number, error.
        let dayIdNumeric = parseInt(dayId);
        if (isNaN(dayIdNumeric)) return API.Form.formFailure('?/modifyDutyDay', '*', 'Leg is not a number');

        // Check that the day actually exists
        const proposedDay = await prisma.dutyDay.findUnique({ where: { id: dayIdNumeric }});
        if (proposedDay === null) return API.Form.formFailure('?/modifyDutyDay', '*', 'Proposed day does not exist');

        // Modify the leg to associate with the day
        await prisma.leg.update({ where: { id: params.id }, data: { dayId: dayIdNumeric } })
        // Update the deadheads for the day we just added the leg to
        await generateDeadheads(dayIdNumeric);
      }

      // If the leg was assigned to a day, update that day's deadheads
      if (currentLeg.dayId !== null) await generateDeadheads(currentLeg.dayId);

      // Done!
      return API.Form.formSuccess('?/modifyDutyDay');

    } catch (e) {
      // We had an error somewhere in the process
      console.log('Error modifying a leg duty day', e);
      return API.Form.formFailure('?/modifyDutyDay', '*', 'Could not modify');
    }
  }
};
