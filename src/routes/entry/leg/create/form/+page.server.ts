import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import type { Prisma } from '@prisma/client';
import { redirect } from '@sveltejs/kit';
import type * as Types from '@prisma/client';
import * as options from '$lib/server/db/options';
import { API, DayNewEntryState } from '$lib/types';
import * as Positions from '$lib/server/db/positions';
import * as Fixes from '$lib/server/db/fixes';
import * as aero from '$lib/server/api/flightaware';
import { v4 as uuidv4 } from 'uuid';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { generateDeadheads } from '$lib/server/db/deadhead';
import { generateAirportList, isNightOperation } from '$lib/server/helpers';

const FORTY_EIGHT_HOURS = 48 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const EIGHT_HOURS = 8 * 60 * 60;

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch, url }) => {


  const entrySettings = await settings.getSet('entry');
  const aeroAPIKey = await settings.get('general.aeroAPI');

  const selection = url.searchParams.get('selection') === null ? null : url.searchParams.get('selection');
  const dayId = url.searchParams.get('day') === null ? null : parseInt(url.searchParams.get('day') ?? '-1');

  if (selection !== null && (entrySettings['entry.day.entry.fa_id'] === '' || entrySettings['entry.day.entry.state'] === DayNewEntryState.NOT_STARTED)) throw redirect(301, '../link' + url.search);
  if (aeroAPIKey === '') throw redirect(301, '/settings');

  const airportsRaw = await ((await fetch('/api/airports')).json()) as API.Airports;
  const airports = (airportsRaw.ok === true) ? airportsRaw.airports : [] as API.Types.Airport[]

  const aircraft = await prisma.aircraft.findMany({ select: { registration: true, id: true, type: { select: { typeCode: true, make: true, model: true } } }, orderBy: { registration: 'asc' } });
  
  if (selection === null) {
    return {
      airports,
      aircraft,
      dayId
    };
  }


  let entry = await options.getFlightOptionFaFlightID(entrySettings['entry.day.entry.fa_id']);


  if (entry === undefined) {
    console.log(`Could not verify - FA Flight ID ${entrySettings['entry.day.entry.fa_id']} did not load a value from the DB.`);
    await settings.set('entry.day.entry.fa_id', '');
    await settings.set('entry.day.entry.state', DayNewEntryState.NOT_STARTED);
    throw redirect(301, '../link' + url.search);
  }


  if (entry.registration !== null) {
    let unknownAircraft = true;
    for (const a of aircraft) {
      if (a.registration === entry.registration) {
        unknownAircraft = false;
        break;
      }
    }

    if (unknownAircraft) {
      const u = new URLSearchParams();
      u.set('reg', entry.registration);
      u.set('ref', `/entry/leg/create/form?${url.searchParams.toString()}`);
      u.set('active', 'form');
      throw redirect(301, `/aircraft/entry/new?${u.toString()}`);
    }
  }

  // Create airport if it does not exist
  try {
    await addIfDoesNotExist(entry.originAirportId, aeroAPIKey);
    await addIfDoesNotExist(entry.destinationAirportId, aeroAPIKey);
    await addIfDoesNotExist(entry.diversionAirportId, aeroAPIKey);
  } catch (e) {

  }

  // Get the airports based on the info from the selected option
  let originAirport: API.Types.Airport | null = null;
  for (const apt of airports) {
    if (apt.id === entry.originAirportId) {
      originAirport = apt;
      break;
    }
  }

  const destAirport = (entry.diversionAirportId !== null) ? entry.diversionAirportId : entry.destinationAirportId;
  let destinationAirport: API.Types.Airport | null = null;
  for (const apt of airports) {
    if (apt.id === destAirport) {
      destinationAirport = apt;
      break;
    }
  }

  const airportList = await generateAirportList(entry.originAirportId, entry.destinationAirportId, entry.diversionAirportId);

  const runwayOperations = {
    dayTO: 0,
    dayLdg: 0,
    nightTO: 0,
    nightLdg: 0
  }

  if (originAirport !== null) {
    const apt = airportList.find((v) => v.id === originAirport?.id);
    if (apt !== undefined) {
      const nightOp = isNightOperation(new Date(entry.startTime * 1000), apt.latitude, apt.longitude);
      if (nightOp) runwayOperations.nightTO++;
      else runwayOperations.dayTO++;
    }
  }

  if (destinationAirport !== null) {
    const apt = airportList.find((v) => v.id === destinationAirport?.id);
    if (apt !== undefined) {
      const nightOp = isNightOperation(new Date(entry.endTime * 1000), apt.latitude, apt.longitude);
      if (nightOp) runwayOperations.nightLdg++;
      else runwayOperations.dayLdg++;
    }
  }

  // const totalTime = ((entry.endTime - entry.startTime) / 60 / 60)

  const existingFData = await prisma.flightAwareData.findUnique({ where: { faFlightId: entry.faFlightId } });


  const u = new URLSearchParams(url.search);
  u.delete('selection');
  u.set('active', 'menu');
  const changeSourceURL = `/entry/leg/create/fa${selection === null ? '' : '/' + selection}?${u.toString()}`;

  return {
    entry,
    params,
    entrySettings,
    changeSourceURL,
    dayId,
    // totalTime,
    runwayOperations,
    xc: entry.diversionAirportId === null ? (entry.originAirportId === entry.destinationAirportId ? false : true) : (entry.originAirportId === entry.diversionAirportId ? false : true),
    existingEntry: existingFData !== null,
    startTime: helpers.dateToDateStringForm(entry.startTime, false, 'UTC'),
    startTimezone: originAirport === null ? null : helpers.getTimezoneObjectFromTimezone(originAirport.timezone),
    endTime: helpers.dateToDateStringForm(entry.endTime, false, 'UTC'),
    endTimezone: destinationAirport === null ? null : helpers.getTimezoneObjectFromTimezone(destinationAirport.timezone),
    airports,
    airportList,
    aircraft: aircraft
  };
};

export const actions = {
  default: async ({ request, url, params }) => {


    const aeroAPIKey = await settings.get('general.aeroAPI');
    const fa = await settings.get('entry.day.entry.fa_id');

    const dayId = url.searchParams.get('day') === null ? null : parseInt(url.searchParams.get('day') ?? '-1');
    const day = dayId === -1 || dayId === null ? null : await prisma.dutyDay.findUnique({ where: { id: dayId }});
    const selection = url.searchParams.get('selection') === null ? null : url.searchParams.get('selection');

    let entry = await options.getFlightOptionFaFlightID(fa);
    if (entry === undefined && selection !== null) return API.Form.formFailure('?/default', '*', 'No FA Entry');

    if (await prisma.flightAwareData.findUnique({ where: { faFlightId: fa } }) !== null) return API.Form.formFailure('?/default', '*', 'Entry with FA already exists');

    const id = uuidv4();

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
    let ac: Prisma.AircraftGetPayload<{}> | null = null;

    try {
      ac = await prisma.aircraft.findUnique({ where: { registration: aircraft as string } });
      if (ac === null) return API.Form.formFailure('?/default', 'aircraft', 'Aircraft does not exist.');
      aircraftId = ac.id;
    } catch (e) {
      return API.Form.formFailure('?/default', 'aircraft', 'Invalid data');
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Out / In Times
    // -----------------------------------------------------------------------------------------------------------------

    let useBlock = data.get('use-block') !== 'false';
    const startTime = data.get('out-date') as null | string;
    const startTimeTZ = data.get('out-tz') as null | string;
    const endTime = data.get('in-date') as null | string;
    const endTimeTZ = data.get('in-tz') as null | string;
    const date = data.get('date') as null | string;

    // Initialize time variables that we may modify later
    let startUTCValue = Math.floor(new Date().getTime() / 1000);
    let endUTCValue = startUTCValue;
    let relativeOrder = 0;

    if (useBlock || (day !== null && ac.simulator === false)) {
      if (startTime === null || startTime === '') return API.Form.formFailure('?/default', 'out', 'Required field');
      if (startTimeTZ === null || startTimeTZ === '') return API.Form.formFailure('?/default', 'out', 'Required field');
      if (endTime === null || endTime === '') return API.Form.formFailure('?/default', 'in', 'Required field');
      if (endTimeTZ === null || endTimeTZ === '') return API.Form.formFailure('?/default', 'in', 'Required field');
      if (date === null && dayId === null) return API.Form.formFailure('?/default', 'date', 'Required field');

      const startUTC = helpers.timeStrAndTimeZoneToUTC(startTime, startTimeTZ);
      if (startUTC === null) return API.Form.formFailure('?/default', 'out', 'Unknown Timezone');

      const endUTC = helpers.timeStrAndTimeZoneToUTC(endTime, endTimeTZ);
      if (endUTC === null) return API.Form.formFailure('?/default', 'in', 'Unknown Timezone');

      if (startUTC.value > endUTC.value) return API.Form.formFailure('?/default', 'out', 'In is after Out');
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
      if (date === null) startUTCValue = Math.floor(day?.startTime_utc ?? 0); // This will never happen (the ??) but TS doesn't know that
      else startUTCValue = Math.floor(new Date(date).getTime() / 1000);
      endUTCValue = startUTCValue + (parseFloat(totalTime) * 60 * 60);
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
      const leg = await prisma.leg.create({ data: {
        id,

        dayId: dayId,
        ident: ident,
        originAirportId: startAirport,
        destinationAirportId: endAirport,
        diversionAirportId: divertAirport,

        route: (entry !== undefined && entry.filedRoute !== null) ? entry.filedRoute : undefined,

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

      // If we make it here, it is time to commit the FlightAware data

      try {
        let faFlightId: string | null = null;
        if (entry !== undefined) {
          const flightAwareData = await prisma.flightAwareData.create({ data: {
            faFlightId: entry.faFlightId,

            operator: entry.operator,
            flightNumber: entry.flightNumber,
            registration: entry.registration,
            inboundFaFlightId: entry.inboundFaFlightId,

            sourceLink: await settings.get('entry.day.entry.fa_link'),

            blocked: entry.blocked,
            diverted: entry.diverted,
            cancelled: entry.cancelled,
            positionOnly: entry.positionOnly,

            departureDelay: entry.departureDelay,
            arrivalDelay: entry.arrivalDelay,
            filedEte: entry.filedEte,
            progressPercent: entry.progressPercent,
            status: entry.status,
            aircraftType: entry.aircraftType,
            routeDistance: entry.routeDistance,
            filedAirspeed: entry.filedAirspeed,
            filedAltitude: entry.filedAltitude,
            filedRoute: entry.filedRoute,
            seatsCabinBusiness: entry.seatsCabinBusiness,
            seatsCabinCoach: entry.seatsCabinCoach,
            seatsCabinFirst: entry.seatsCabinFirst,
            gateOrigin: entry.gateOrigin,
            gateDestination: entry.gateDestination,
            terminalOrigin: entry.terminalOrigin,
            terminalDestination: entry.terminalDestination,
            type: entry.type,

            scheduledOut: entry.scheduledOut,
            scheduledOff: entry.scheduledOff,
            actualOut: entry.actualOut,
            actualOff: entry.actualOff,
            scheduledIn: entry.scheduledIn,
            scheduledOn: entry.scheduledOn,
            actualIn: entry.actualIn,
            actualOn: entry.actualOn,

            legId: id
          }});
          faFlightId = flightAwareData.faFlightId;
        }

        // If we make it here, it is time to store positions

        try {
          if (faFlightId !== null) {
            const track = await aero.getFlightTrack(faFlightId, aeroAPIKey);
            await Positions.storePositions(track.positions, leg.id);
          }

          // If we made it here, it is time to store the route

          try {
            if (faFlightId !== null) {
              const route = await aero.getFlightRoute(faFlightId, aeroAPIKey);
              await Fixes.storeFixes(route.fixes, leg.id);
            }
          } catch (e) {
            console.log(e);
            // It is OK if we can't store the route?
          }

          // If we made it here, it is time to store the approaches

          try {

            const approaches = data.getAll('approach') as string[];

            const inserts: Types.Prisma.PrismaPromise<any>[] = [];

            for (const a of approaches) {
              const approach = JSON.parse(a) as Types.Approach;
              if (approach === null) continue;
              approach.legId = leg.id;
              await addIfDoesNotExist(approach.airportId, aeroAPIKey);
              inserts.push(prisma.approach.create({ data: approach }));
            }

            await prisma.$transaction(inserts);

            // If we made it here, it is time to store the deadheads

            try {

              // Generate deadheads if the day exists
              if (dayId !== null) await generateDeadheads(dayId);

              // If we made it here, we are done!
              await settings.set('entry.day.entry.fa_id', '');
              await settings.set('entry.day.entry.fa_link', '');
              await settings.set('entry.day.entry.state', DayNewEntryState.NOT_STARTED);

            } catch (e) {
              console.log(e);
              await prisma.approach.deleteMany({ where: { legId: leg.id }});
              await Positions.deletePositions(leg.id);
              await Fixes.deleteFixes(leg.id);
              if (faFlightId !== null) await prisma.flightAwareData.delete({ where: { faFlightId: faFlightId } });
              await prisma.leg.delete({ where: { id: leg.id } });
              return API.Form.formFailure('?/default', '*', 'Could not create deadheads');
            }
          } catch (e) {
            console.log(e);
            await Positions.deletePositions(leg.id);
            await Fixes.deleteFixes(leg.id);
            if (faFlightId !== null) await prisma.flightAwareData.delete({ where: { faFlightId: faFlightId } });
            await prisma.leg.delete({ where: { id: leg.id } });
            return API.Form.formFailure('?/default', '*', 'Could not create approaches');
          }
        } catch (e) {
          console.log(e);
          if (faFlightId !== null) {
            await prisma.flightAwareData.delete({ where: { faFlightId: faFlightId } });
          }
          await prisma.leg.delete({ where: { id: leg.id } });
          return API.Form.formFailure('?/default', '*', 'Could not store positions');
        }
      } catch (e) {
        console.log(e);
        await prisma.leg.delete({ where: { id: leg.id }});
        return API.Form.formFailure('?/default', '*', 'Could not create FlightAware Entry');
      }
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', '*', 'Could not create leg');
    }

    // return API.Form.formSuccess('?/default');

    // Remove search params that are not required anymore
    const u = new URLSearchParams(url.search);
    u.delete('selection');
    u.delete('flight-id');
    u.delete('date');
    throw redirect(301, `/entry/leg/${id}?${u.toString()}`);
  }
};