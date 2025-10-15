import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

const toDateString = (unixSeconds: number | null | undefined) => {
  if (!unixSeconds) return null;
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

export const load = (async () => {
  const [dateAgg, totalLegs, aircraftRecords, originIds, destinationIds, diversionIds] = await Promise.all([
    prisma.leg.aggregate({
      _min: { startTime_utc: true },
      _max: { startTime_utc: true }
    }),
    prisma.leg.count(),
    prisma.aircraft.findMany({
      orderBy: [{ registration: 'asc' }],
      select: {
        id: true,
        registration: true,
        simulator: true,
        type: {
          select: {
            make: true,
            model: true,
            typeCode: true
          }
        }
      }
    }),
    prisma.leg.findMany({
      where: { originAirportId: { not: null } },
      distinct: ['originAirportId'],
      select: { originAirportId: true }
    }),
    prisma.leg.findMany({
      where: { destinationAirportId: { not: null } },
      distinct: ['destinationAirportId'],
      select: { destinationAirportId: true }
    }),
    prisma.leg.findMany({
      where: { diversionAirportId: { not: null } },
      distinct: ['diversionAirportId'],
      select: { diversionAirportId: true }
    })
  ]);

  const airportIds = new Set<string>();
  for (const record of originIds) if (record.originAirportId) airportIds.add(record.originAirportId);
  for (const record of destinationIds) if (record.destinationAirportId) airportIds.add(record.destinationAirportId);
  for (const record of diversionIds) if (record.diversionAirportId) airportIds.add(record.diversionAirportId);

  const airports = airportIds.size === 0
    ? []
    : await prisma.airport.findMany({
      where: { id: { in: Array.from(airportIds) } },
      select: { id: true, name: true },
      orderBy: [{ id: 'asc' }]
    });

  return {
    totalLegs,
    defaultRange: {
      start: toDateString(dateAgg._min.startTime_utc),
      end: toDateString(dateAgg._max.startTime_utc)
    },
    aircraft: aircraftRecords.map((record) => ({
      id: record.id,
      registration: record.registration,
      simulator: record.simulator,
      label: record.type
        ? `${record.registration} · ${record.type.make} ${record.type.model} (${record.type.typeCode})`
        : record.registration
    })),
    airports: airports.map((airport) => ({
      id: airport.id,
      label: airport.name ? `${airport.id} · ${airport.name}` : airport.id
    }))
  };
}) satisfies PageServerLoad;
