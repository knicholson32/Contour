import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import * as DeckTypes from '$lib/components/map/deck/types.js';
import { addIfDoesNotExist } from '$lib/server/db/airports.js';

export const load = async ({ fetch, params, parent, url }) => {
  const legsRaw = await prisma.leg.findMany({ select: { id: true, originAirportId: true, destinationAirportId: true, diversionAirportId: true } });
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

  const settingsGroup = await settings.getMany('general.prefers_globe', 'tour.defaultStartApt', 'general.aeroAPI');
  await addIfDoesNotExist(settingsGroup['tour.defaultStartApt'], settingsGroup['general.aeroAPI']);
  const startAirport = await prisma.airport.findUnique({ where: { id: settingsGroup['tour.defaultStartApt'] } });




  return {
    visitedAirports,
    segments: await (await fetch('/api/legs')).json() as DeckTypes.Legs,
    prefersGlobe: settingsGroup['general.prefers_globe'],
    startAirport
  }



};