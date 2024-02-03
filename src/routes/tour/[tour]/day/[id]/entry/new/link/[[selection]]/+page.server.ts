import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import * as aeroAPI from '$lib/server/api/flightaware';
import { redirect } from '@sveltejs/kit';
import * as options from '$lib/server/db/options';
import { API, DayNewEntryState } from '$lib/types';
import { getTimeZones } from '@vvo/tzdb';
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
  if (aeroAPIKey === '') throw redirect(301, '/settings');

  if (isNaN(parseInt(params.tour))) throw redirect(301, '/tour');
  const currentTour = await prisma.tour.findUnique({
    where: { id: parseInt(params.tour) },
  });
  if (currentTour === null) throw redirect(301, '/tour/new');

  if (isNaN(parseInt(params.id))) throw redirect(301, '/tour/' + params.tour + '/day');
  const currentDay = await prisma.dutyDay.findUnique({
    where: { id: parseInt(params.id) },
    include: { legs: true },
  });
  if (currentDay === null) throw redirect(301, '/tour/' + params.tour + '/day');

  const flightIDRaw = url.searchParams.get('flight-id');
  const flightIDs = flightIDRaw === null ? [] : flightIDRaw.split(',').map((v) => {
    if (v.indexOf('-') !== -1) return v.trim()
    else return v.trim().toUpperCase()
  });
  const noCache = url.searchParams.get('no-cache') === 'true';
  const expansive = url.searchParams.get('expansive') === 'true';
  const fetchAirports = url.searchParams.get('fetch-airports') === 'true';

  console.log(settingsResults);



  if ((flightIDs.length === 0) && settingsResults['entry.flight_id.last'] !== '') throw redirect(301, `/tour/${currentTour.id}/day/${currentDay.id}/entry/new/link?flight-id=${settingsResults['entry.flight_id.last']}`);

  if (noCache && flightIDs.length !== 0){
    try {
      if (expansive) {
        await options.getOptionsAndCache(aeroAPIKey, currentTour.id, flightIDs, { forceExpansiveSearch: true });
      } else {
        await options.getOptionsAndCache(aeroAPIKey, currentTour.id, flightIDs, { startTime: currentDay.startTime_utc, endTime: currentDay.endTime_utc });
      }
    } catch (e) {
      console.log('ERROR', e);
    }
  }

  if (flightIDs.length !== 0) await settings.set('entry.flight_id.last', flightIDs.join(', '));
  
  const availableOptions = flightIDs.length === 0 ? [] : await prisma.option.findMany({ where: { cancelled: false, OR: [ { ident: { in: flightIDs } }, {faFlightId: { in: flightIDs } }] }, orderBy: { startTime: 'desc' }, select: { faFlightId: true, startTime: true, endTime: true, originAirportId: true, destinationAirportId: true, diversionAirportId: true, ident: true, inaccurateTiming: true, progressPercent: true, aircraftType: true }})
  

  const flightIDOptions: string[] = [];
  const availableOptionsTotal = await prisma.option.findMany({ where: { cancelled: false }, select: { ident: true } });
  console.log(availableOptionsTotal);
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

    if (isNaN(parseInt(params.tour))) throw redirect(301, '/tour');
    const currentTour = await prisma.tour.findUnique({
      where: { id: parseInt(params.tour) },
    });
    if (currentTour === null) throw redirect(301, '/tour/new');

    const currentDay = await prisma.dutyDay.findUnique({
      where: { id: parseInt(params.id) },
      include: { legs: true },
    });
    if (currentDay === null) throw redirect(301, '/tour/' + params.tour + '/day');

    if (params.selection === undefined) throw redirect(301, '/tour/' + params.tour + '/day/' + params.id + '/entry/link');
    const selected = await prisma.option.findUnique({ where: { faFlightId: params.selection }});
    if (selected === null) return API.Form.formFailure('?/default', '*', 'Option does not exist');



    await settings.set('entry.day.entry.fa_id', params.selection);
    await settings.set('entry.day.entry.fa_link', `https://www.flightaware.com/live/flight/id/${params.selection}:0`);
    await settings.set('entry.day.entry.state', DayNewEntryState.LINK_CONFIRMED);

    throw redirect(301, '/tour/' + params.tour + '/day/' + params.id + '/entry/new/form');


  //   let link = data.get('fa-link') as null | string;
  //   const flightID = data.get('flight-id') as null | string;
  //   const noCache = data.get('no-cache') as null | string === 'true' ? true : false;

  //   if (link === null || link === '') return API.Form.formFailure('?/default', 'fa-link', 'Required field');
  //   if (!helpers.validateURL(link)) return API.Form.formFailure('?/default', 'fa-link', 'Invalid URL');
  //   if (link.startsWith('https://flightaware.com/')) link = 'https://www.' + link.substring(8);
  //   console.log(link);
  //   if (!link.startsWith('https://www.flightaware.com/')) return API.Form.formFailure('?/default', 'fa-link', 'Not a FlightAware link');

  //   try {

  //     const fa_flight_id = await aeroAPI.getFlightIDFromURL(link);
  //     if (fa_flight_id === null || typeof fa_flight_id !== 'string' || fa_flight_id.length === 0) {
  //       console.log('fa_flight_id', fa_flight_id);
  //       return API.Form.formFailure('?/default', 'fa-link', 'Invalid FlightAware link');
  //     }

  //     if (noCache) {
  //       if (flightID === null || flightID === '') await options.getOptionsAndCache(aeroAPIKey, currentTour.id, [fa_flight_id], {});
  //       else await options.getOptionsAndCache(aeroAPIKey, currentTour.id, [flightID.trim().toUpperCase()], { clearCache: true, startTime: currentDay.startTime_utc, endTime: currentDay.endTime_utc });
  //     }

  //     console.log(fa_flight_id);

  //     // See if the flight is currently cached
  //     let entry = await options.getFlightOptionFaFlightID(fa_flight_id);

  //     if (entry === undefined) {
  //       if(noCache) {
  //         if (flightID === null || flightID === '') return API.Form.formFailure('?/default', 'flight-id', 'Not cached. Required for efficiency.');
  //         await options.getOptionsAndCache(aeroAPIKey, currentTour.id, [flightID.trim().toUpperCase()], { clearCache: true, forceExpansiveSearch: true });
  //       } else await options.getOptionsAndCache(aeroAPIKey, currentTour.id, [fa_flight_id], { });
  //       entry = await options.getFlightOptionFaFlightID(fa_flight_id);
  //       if (entry === undefined) return API.Form.formFailure('?/default', 'fa-link', 'Flight could not be found');
  //     }

  //     console.log('Linked Option', entry);

  //     await settings.set('entry.day.entry.fa_id', fa_flight_id);
  //     await settings.set('entry.day.entry.fa_link', link);
  //     await settings.set('entry.day.entry.state', DayNewEntryState.LINK_ENTERED);

  //   } catch (e) {
  //     console.log(e);
  //     if (e instanceof aeroAPI.AeroAPIError) {
  //       const err = (e as aeroAPI.AeroAPIError) ?? { detail: 'Unknown Error'};
  //       return API.Form.formFailure('?/default', '*', 'Error processing link: ' + err.apiErr.detail);
  //     } else {
  //       return API.Form.formFailure('?/default', '*', 'Error processing link');
  //     }
  //   }

  //   throw redirect(301, '/tour/' + params.tour + '/day/' + params.id + '/entry/new/verify');

  //   // return API.Form.formFailure('?/default', '*', 'test');

  //   // // const ref = url.searchParams.get('ref');
  //   // // console.log('ref', ref);
  //   // // if (ref !== null) throw redirect(301, ref);
  //   // // else throw redirect(301, '/aircraft/entry/' + id + '?active=form');

  }
};