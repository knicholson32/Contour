import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import * as DeckTypes from '$lib/components/map/deck/types.js';
import { addIfDoesNotExist } from '$lib/server/db/airports.js';
import { getDistanceFromLatLonInKm } from '$lib/helpers/index.js';

const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;

export const load = async ({ fetch, params, parent, url }) => {

  const legsRaw = await prisma.leg.findMany({ 
    select: { 
      id: true, 
      startTime_utc: true,
      totalTime: true,
      aircraft: {
        select: {
          type: {
            select: {
              typeCode: true
            }
          }
        }
      },
      dayLandings: true,
      nightLandings: true,
      originAirport: {
        select: {
          id: true,
          latitude: true,
          longitude: true
        }
      },
      destinationAirport: {
        select: {
          id: true,
          latitude: true,
          longitude: true
        }
      },
      diversionAirport: {
        select: {
          id: true,
          latitude: true,
          longitude: true
        }
      }
    } 
  });
  const airports = await prisma.airport.findMany({ select: { ...DeckTypes.AirportSelect, _count: { select: { legOrigin: true, legDestination: true, legDiversion: true } }} });

  const visitedAirports: DeckTypes.Airport[] = [];
  const legs: DeckTypes.Leg[] = [];

  for (const airport of airports) {
    const numLegs = airport._count.legDestination + airport._count.legOrigin + airport._count.legDiversion;
    if (numLegs === 0) continue;
    visitedAirports.push({
      id: airport.id,
      latitude: airport.latitude,
      longitude: airport.longitude,
      priority: numLegs,
      // name: airport.name
    });
  }

  const settingsGroup = await settings.getMany('general.prefers_globe', 'tour.defaultStartApt', 'general.aeroAPI', 'entry.dataVersion');
  await addIfDoesNotExist(settingsGroup['tour.defaultStartApt'], settingsGroup['general.aeroAPI']);
  const startAirport = await prisma.airport.findUnique({ where: { id: settingsGroup['tour.defaultStartApt'] } });

  const airportVisits: {id: string, visits: number}[] = [];
  const aircraftTypes: {id: string, legs: number}[] = [];
  let numPastYear = 0;
  let totalDistanceMiles = 0;
  let totalHours = 0;
  let totalHoursYear = 0;
  let dayLandings = 0;
  let nightLandings = 0;
  let totalLandings = 0;
  let totalLandingsYear = 0;
  const now = Math.floor((new Date()).getTime() / 1000);
  for (const leg of legsRaw) {
    if (leg.startTime_utc + SECONDS_PER_YEAR >= now ) {
      numPastYear++;
      totalHoursYear += leg.totalTime;
      totalLandingsYear += leg.dayLandings + leg.nightLandings
    }
    dayLandings += leg.dayLandings;
    nightLandings += leg.nightLandings;
    totalLandings += leg.dayLandings + leg.nightLandings
    const origin = leg.originAirport;
    const destination = leg.diversionAirport === null ? leg.destinationAirport : leg.diversionAirport;
    if (origin !== null && destination !== null) {
      totalDistanceMiles += getDistanceFromLatLonInKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude)  * 0.54;
    }
    totalHours += leg.totalTime;
    if (origin !== null) {
      const idx = airportVisits.findIndex((a) => a.id === origin.id);
      if (idx === -1) airportVisits.push({ id: origin.id, visits: 1 });
      else airportVisits[idx].visits++;
    }
    if (destination !== null) {
      const idx = airportVisits.findIndex((a) => a.id === destination.id);
      if (idx === -1) airportVisits.push({ id: destination.id, visits: 1 });
      else airportVisits[idx].visits++;
    }

    const idx = aircraftTypes.findIndex((a) => a.id === leg.aircraft.type.typeCode);
    if (idx === -1) aircraftTypes.push({ id: leg.aircraft.type.typeCode, legs: 1 });
    else aircraftTypes[idx].legs++;
  }

  airportVisits.sort((a, b) => b.visits - a.visits);
  aircraftTypes.sort((a, b) => b.legs - a.legs);

  return {
    visitedAirports,
    summary: {
      numFlights: legsRaw.length,
      numFlightsLast12Months: numPastYear,
      totalDistanceMiles,
      totalHours,
      totalHoursLast12Months: totalHoursYear,
      dayLandings,
      nightLandings,
      totalLandings,
      totalLandingsLast12Months: totalLandingsYear,
      topAirports: airportVisits.slice(0, 10),
      topAircraftTypes: aircraftTypes.slice(0, 10)
    },
    prefersGlobe: settingsGroup['general.prefers_globe'],
    startAirport,
    dataVersion: settingsGroup['entry.dataVersion']
  }



};