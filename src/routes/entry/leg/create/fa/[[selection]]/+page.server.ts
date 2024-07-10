import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import { redirect } from '@sveltejs/kit';
import * as options from '$lib/server/db/options';
import { API, DayNewEntryState } from '$lib/types';
import type { Prisma } from '@prisma/client';
import { addIfDoesNotExist } from '$lib/server/db/airports';
import { generateAirportList } from '$lib/server/helpers';

const FORTY_EIGHT_HOURS = 48 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const EIGHT_HOURS = 8 * 60 * 60;

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch, url }) => {

  const entrySettings = await settings.getSet('entry');
  const settingsResults = await settings.getMany('general.aeroAPI', 'entry.flight_id.last');
  const aeroAPIKey = settingsResults['general.aeroAPI'];
  if (aeroAPIKey === '') throw redirect(302, '/settings');

  let currentDay: Prisma.DutyDayGetPayload<{}> | null = null;
  let currentTour: Prisma.TourGetPayload<{}> | null = null;

  // Get the day info if it exists
  const dayId = url.searchParams.get('day') === null ? null : parseInt(url.searchParams.get('day') ?? '-1');
  if (dayId !== null) {
    currentDay = await prisma.dutyDay.findUnique({ where: { id: dayId }, include: { legs: true } });
    if (currentDay === null) throw redirect(302, '/entry/leg' + url.search);
  }

  // Resolve the tour info it the day exists
  if (currentDay !== null) {
    currentTour = await prisma.tour.findUnique({ where: { id: currentDay.tourId } });
    if (currentTour === null) throw redirect(301, '/entry/day');
  }

  // TODO: This needs to be updated to support adding legs without a tour or day
  // Redirect if there is no tour or day, as we need the tour number and day number to create flight options
  // if (currentTour === null || currentDay === null) throw redirect(301, '/entry/leg' + url.search);

  const flightIDRaw = url.searchParams.get('flight-id');
  const flightIDs = flightIDRaw === null ? [] : flightIDRaw.split(',').map((v) => {
    if (v.indexOf('-') !== -1) return v.trim()
    else return v.trim().toUpperCase()
  });
  const noCache = url.searchParams.get('no-cache') === 'true';
  const expansive = url.searchParams.get('expansive') === 'true';
  const fetchAirports = url.searchParams.get('fetch-airports') === 'true';

  if ((flightIDs.length === 0) && settingsResults['entry.flight_id.last'] !== '') {
    const u = new URLSearchParams(url.search);
    u.set('flight-id', settingsResults['entry.flight_id.last']);
    throw redirect(301, `/entry/leg/create/fa?${u.toString()}`);
  }

  if (noCache && flightIDs.length !== 0){
    try {
      if (expansive) {
        await options.getOptionsAndCache(aeroAPIKey, currentTour?.id ?? null, flightIDs, { forceExpansiveSearch: true });
      } else {
        // Check if we have a day to base the search on
        if (currentDay === null) {
          // We do not. Rely on the date selected during the search
          const date = url.searchParams.get('date');
          console.log('date!', date);
          if (date !== null) {
            const d = Math.floor((new Date(date)).getTime() / 1000);
            await options.getOptionsAndCache(aeroAPIKey, currentTour?.id ?? null, flightIDs, { startTime: d, endTime: d + TWENTY_FOUR_HOURS });
          }
        } else {
          // We do. Use that day to narrow the search window
          await options.getOptionsAndCache(aeroAPIKey, currentTour?.id ?? null, flightIDs, { startTime: currentDay.startTime_utc, endTime: currentDay.endTime_utc });
        }
      }
    } catch (e) {
      console.log('ERROR', e);
    }
  }

  if (flightIDs.length !== 0) await settings.set('entry.flight_id.last', flightIDs.join(', '));
  
  const availableOptions = flightIDs.length === 0 ? [] : await prisma.option.findMany({ where: { cancelled: false, OR: [ { ident: { in: flightIDs } }, {faFlightId: { in: flightIDs } }] }, orderBy: { startTime: 'desc' }, select: { faFlightId: true, startTime: true, endTime: true, originAirportId: true, destinationAirportId: true, diversionAirportId: true, ident: true, inaccurateTiming: true, progressPercent: true, aircraftType: true }})
  

  const flightIDOptions: string[] = [];
  const availableOptionsTotal = await prisma.option.findMany({ where: { cancelled: false }, select: { ident: true } });
  for (const o of availableOptionsTotal) if (!flightIDOptions.includes(o.ident)) flightIDOptions.push(o.ident);

  if (fetchAirports === true) {
    for (const o of availableOptions) {
      await addIfDoesNotExist(o.originAirportId, aeroAPIKey);
      await addIfDoesNotExist(o.destinationAirportId, aeroAPIKey);
      await addIfDoesNotExist(o.diversionAirportId, aeroAPIKey);
    }
  }

  const selected = (params.selection === undefined) ? null : await prisma.option.findUnique({ where: { faFlightId: params.selection } });
  if (selected !== null && availableOptions.length === 0) throw redirect(301, '../');

  if (selected !== null) {
    await addIfDoesNotExist(selected.originAirportId, aeroAPIKey);
    await addIfDoesNotExist(selected.destinationAirportId, aeroAPIKey);
    await addIfDoesNotExist(selected.diversionAirportId, aeroAPIKey);
  }

  const airportsRaw = await ((await fetch('/api/airports')).json()) as API.Airports;
  const airports = (airportsRaw.ok === true) ? airportsRaw.airports : [] as API.Types.Airport[];

  type AirportDetails = {
    id: string,
    obj: API.Types.Airport | null
    timestamp: string
  };

  const optionsExport: { 
    fa_flight_id: string,
    ident: string,
    startTime: number,
    endTime: number,
    progress: number,
    inaccurateTiming: boolean,
    exists: boolean,
    originAirport: AirportDetails,
    destinationAirport: AirportDetails,
    diversionAirport?: AirportDetails,
    type: {
      name: string,
      id?: string,
    },
    duration: string,
    faLink: string
  }[] = [];

  const aircraftTypes = await prisma.aircraftType.findMany({ select: { id: true, typeCode: true }});
  const getAircraftIdFromTypeCode = (code: string | null) => {
    if (code === null) return null;
    for (const t of aircraftTypes) if (t.typeCode === code) return t;
    return null;
  }



  for (const o of availableOptions) {

    let duration = helpers.duration(o.startTime, o.endTime);

    const originAirport = helpers.getAirportFromICAO(o.originAirportId, airports);
    let originTimezone = helpers.getTimezoneObjectFromTimezone(originAirport?.timezone ?? null);

    const destAirport = helpers.getAirportFromICAO(o.destinationAirportId, airports);
    let destTimezone = helpers.getTimezoneObjectFromTimezone(destAirport?.timezone ?? null);

    const diversionAirport = helpers.getAirportFromICAO(o.diversionAirportId, airports);
    let diversionTimezone = helpers.getTimezoneObjectFromTimezone(diversionAirport?.timezone ?? null);

    let diversion: AirportDetails | undefined = undefined;
    if (o.diversionAirportId !== null) {
      diversion = {
        id: o.diversionAirportId ?? 'Unknown',
        obj: diversionAirport,
        timestamp: helpers.timeToTimezoneToString(o.endTime, diversionTimezone) ?? helpers.getHoursMinutesUTC(new Date(o.endTime * 1000), true)
      }
    }

    optionsExport.push({
      fa_flight_id: o.faFlightId,
      ident: o.ident,
      startTime: o.startTime,
      endTime: o.endTime,
      progress: o.progressPercent ?? 0,
      inaccurateTiming: o.inaccurateTiming,
      exists: await prisma.flightAwareData.findUnique({ where: { faFlightId: o.faFlightId } }) !== null,
      originAirport: {
        id: o.originAirportId ?? 'Unknown',
        obj: originAirport,
        timestamp: helpers.timeToTimezoneToString(o.startTime, originTimezone) ?? helpers.getHoursMinutesUTC(new Date(o.startTime * 1000), true)
      },
      destinationAirport: {
        id: o.destinationAirportId ?? 'Unknown',
        obj: destAirport,
        timestamp: helpers.timeToTimezoneToString(o.endTime, destTimezone) ?? helpers.getHoursMinutesUTC(new Date(o.endTime * 1000), true)
      },
      diversionAirport: diversion,
      type: {
        name: o.aircraftType ?? 'Unknown',
        id: getAircraftIdFromTypeCode(o.aircraftType)?.id ?? undefined
      },
      duration,
      faLink: ''
    })
  }

  // Get the airports based on the info from the selected option
  let originAirport: API.Types.Airport | null = null;
  let destinationAirport: API.Types.Airport | null = null;
  if (selected !== null) {
    for (const apt of airports) {
      if (apt.id === selected.originAirportId) {
        originAirport = apt;
        break;
      }
    }

    const destAirport = (selected.diversionAirportId !== null) ? selected.diversionAirportId : selected.destinationAirportId;
    for (const apt of airports) {
      if (apt.id === destAirport) {
        destinationAirport = apt;
        break;
      }
    }
  }

  const totalTime = selected === null ? 0 : ((selected.endTime - selected.startTime) / 60 / 60);
  const existingFData = selected === null ? null : await prisma.flightAwareData.findUnique({ where: { faFlightId: selected.faFlightId } });

  

  return {
    entrySettings,
    options: optionsExport,
    flightIDOptions,
    selected,
    startTime: selected === null || originAirport === null ? null : helpers.dateToDateStringForm(selected.startTime, false, originAirport.timezone) + ' ' + helpers.getTimezoneObjectFromTimezone(originAirport.timezone)?.abbreviation,
    startTimezone: selected === null || originAirport === null ? null : originAirport.timezone,
    endTime: selected === null || destinationAirport === null ? null : helpers.dateToDateStringForm(selected.endTime, false, destinationAirport.timezone) + ' ' + helpers.getTimezoneObjectFromTimezone(destinationAirport.timezone)?.abbreviation,
    endTimezone: selected === null ||  destinationAirport === null ? null : destinationAirport.timezone,
    totalTime,
    existingEntry: existingFData !== null,
    airportList: selected === null ? null : await generateAirportList(selected.originAirportId, selected.destinationAirportId, selected.diversionAirportId),
    currentTour,
    currentDay,
    airports,
    params
  };
};

export const actions = {
  default: async ({ request, url, params }) => {

    const aeroAPIKey = await settings.get('general.aeroAPI');
    if (aeroAPIKey === '') return API.Form.formFailure('?/default', '*', 'Configure Aero API key in settings');

    if (params.selection === undefined) throw redirect(301, '/entry/leg/create/fa');
    const selected = await prisma.option.findUnique({ where: { faFlightId: params.selection }});
    if (selected === null) return API.Form.formFailure('?/default', '*', 'Option does not exist');

    await settings.set('entry.day.entry.fa_id', params.selection);
    await settings.set('entry.day.entry.fa_link', `https://www.flightaware.com/live/flight/id/${params.selection}:0`);
    await settings.set('entry.day.entry.state', DayNewEntryState.LINK_CONFIRMED);

    const u = new URLSearchParams(url.search);
    u.set('selection', params.selection);
    u.set('clearChanges', 'true');
    throw redirect(301, '/entry/leg/create/form?' + u.toString());

  }
};