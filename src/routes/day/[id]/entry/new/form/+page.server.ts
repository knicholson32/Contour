import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import * as aeroAPI from '$lib/server/api/flightaware';
import { redirect } from '@sveltejs/kit';
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
export const load = async ({ params, fetch }) => {

  const entrySettings = await settings.getSet('entry');
  const aeroAPIKey = await settings.get('general.aeroAPI');

  const currentTour = await prisma.tour.findUnique({
    where: { id: entrySettings['entry.tour.current'] },
  });
  if (currentTour === null) throw redirect(301, '/tour/new');

  if (isNaN(parseInt(params.id))) throw redirect(301, '/day');
  const currentDay = await prisma.dutyDay.findUnique({
    where: { id: parseInt(params.id) },
    include: { legs: true },
  });
  if (currentDay === null) throw redirect(301, '/day');

  if (entrySettings['entry.day.entry.fa_id'] === '' || entrySettings['entry.day.entry.state'] === DayNewEntryState.NOT_STARTED) throw redirect(301, '../link');
  if (aeroAPIKey === '') throw redirect(301, '/settings');


  
  let entry = await options.getFlightOptionFaFlightID(entrySettings['entry.day.entry.fa_id']);


  const airportsRaw = await ((await fetch('/api/airports')).json()) as API.Airports;
  const airports = (airportsRaw.ok === true) ? airportsRaw.airports : [] as API.Types.Airport[]

  if (entry === undefined) {
    console.log(`Could not verify - FA Flight ID ${entrySettings['entry.day.entry.fa_id']} did not load a value from the DB.`);
    await settings.set('entry.day.entry.fa_id', '');
    await settings.set('entry.day.entry.state', DayNewEntryState.NOT_STARTED);
    throw redirect(301, '../link');
  }

  console.log(entry);

  const aircraft = await prisma.aircraft.findMany({ select: { registration: true, id: true, type: { select: { typeCode: true, make: true, model: true } } }, orderBy: { registration: 'asc' } });

  if (entry.registration !== null) {
    let unknownAircraft = true;
    for (const a of aircraft) {
      if (a.registration === entry.registration) {
        unknownAircraft = false;
        break;
      }
    }

    if (unknownAircraft) throw redirect(301, `/aircraft/entry/new?reg=${entry.registration}&ref=/day/${params.id}/entry/new/form&active=form`)
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
      const nightOp = isNightOperation(new Date(entry.startTime * 1000), apt.latitude, apt.longitude);
      if (nightOp) runwayOperations.nightLdg++;
      else runwayOperations.dayLdg++;
    }
  }

  // const totalTime = ((entry.endTime - entry.startTime) / 60 / 60)

  const existingFData = await prisma.flightAwareData.findUnique({ where: { faFlightId: entry.faFlightId } });


  return {
    entry,
    params,
    entrySettings,
    currentTour,
    currentDay,
    // totalTime,
    runwayOperations,
    xc: entry.diversionAirportId === null ? (entry.originAirportId === entry.destinationAirportId ? false : true) : (entry.originAirportId === entry.diversionAirportId ? false : true),
    existingEntry: existingFData !== null,
    startTime: originAirport === null ? null : helpers.dateToDateStringForm(entry.startTime, false, 'UTC'),
    startTimezone: originAirport === null ? null : helpers.getTimezoneObjectFromTimezone(originAirport.timezone),
    endTime: destinationAirport === null ? null : helpers.dateToDateStringForm(entry.endTime, false, 'UTC'),
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

    let entry = await options.getFlightOptionFaFlightID(fa);
    if (entry === undefined) return API.Form.formFailure('?/default', '*', 'No FA Entry');

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

    if (startUTC.value > endUTC.value) return API.Form.formFailure('?/default', 'out', 'In is after Out');
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
      const leg = await prisma.leg.create({ data: {
        id,

        dayId: parseInt(params.id),
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

      // If we make it here, it is time to commit the FlightAware data

      try {
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

        // If we make it here, it is time to store positions

        try {
          const track = await aero.getFlightTrack(flightAwareData.faFlightId, aeroAPIKey);
          await Positions.storePositions(track.positions, leg.id);

          // If we made it here, it is time to store the route

          try {
            const route = await aero.getFlightRoute(flightAwareData.faFlightId, aeroAPIKey);
            await Fixes.storeFixes(route.fixes, leg.id);

            await generateDeadheads(parseInt(params.id));

            // If we made it here, we are done!
            await settings.set('entry.day.entry.fa_id', '');
            await settings.set('entry.day.entry.fa_link', '');
            await settings.set('entry.day.entry.state', DayNewEntryState.NOT_STARTED);

          } catch (e) {
            console.log(e);
            await Positions.deletePositions(leg.id);
            await prisma.flightAwareData.delete({ where: { faFlightId: flightAwareData.faFlightId } });
            await prisma.leg.delete({ where: { id: leg.id } });
            return API.Form.formFailure('?/default', '*', 'Could not store fixes');
          }
        } catch (e) {
          console.log(e);
          await prisma.flightAwareData.delete({ where: { faFlightId: flightAwareData.faFlightId } });
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

    throw redirect(301, '/day/' + params.id + '/entry/' + id);
  }
};