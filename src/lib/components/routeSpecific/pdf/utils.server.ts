import prisma from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import { toUnixEnd, toUnixStart } from './utils.format';
export * from './utils.format';

const legInclude = {
  aircraft: {
    select: {
      registration: true,
      simulator: true,
      type: {
        select: {
          make: true,
          model: true,
          typeCode: true,
          catClass: true
        }
      }
    }
  },
  originAirport: { select: { id: true, name: true } },
  destinationAirport: { select: { id: true, name: true } },
  diversionAirport: { select: { id: true, name: true } },
  approaches: { select: { type: true, runway: true, airportId: true, notes: true } }
} satisfies Prisma.LegInclude;

export type ExportLeg = Prisma.LegGetPayload<{ include: typeof legInclude }>;

export type ExportFilters = {
  start?: string | null;
  end?: string | null;
  aircraftIds: string[];
  airportIds: string[];
  where: Prisma.LegWhereInput;
};

export const parseFiltersFromUrl = (params: URLSearchParams): ExportFilters => {
  const startParam = params.get('start');
  const endParam = params.get('end');
  const aircraftIds = params.getAll('aircraft').filter(Boolean);
  const airportIds = params.getAll('airport').filter(Boolean);

  const where: Prisma.LegWhereInput = {};

  if (startParam || endParam) {
    const dateFilter: Prisma.IntFilter = {};
    if (startParam) {
      const unix = toUnixStart(startParam);
      if (unix !== null) dateFilter.gte = unix;
    }
    if (endParam) {
      const unix = toUnixEnd(endParam);
      if (unix !== null) dateFilter.lte = unix;
    }
    if (Object.keys(dateFilter).length > 0) where.startTime_utc = dateFilter;
  }

  if (aircraftIds.length > 0) where.aircraftId = { in: aircraftIds };

  if (airportIds.length > 0) {
    where.OR = [
      { originAirportId: { in: airportIds } },
      { destinationAirportId: { in: airportIds } },
      { diversionAirportId: { in: airportIds } }
    ];
  }

  return {
    start: startParam,
    end: endParam,
    aircraftIds,
    airportIds,
    where
  };
};

export const fetchExportLegs = async (filters: ExportFilters) =>
  prisma.leg.findMany({
    where: filters.where,
    orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }],
    include: legInclude
  });

export const fetchFilterMetadata = async (filters: ExportFilters) => {
  const [aircraftMeta, airportMeta] = await Promise.all([
    filters.aircraftIds.length > 0
      ? prisma.aircraft.findMany({
          where: { id: { in: filters.aircraftIds } },
          select: {
            id: true,
            registration: true,
            type: {
              select: {
                make: true,
                model: true,
                typeCode: true
              }
            }
          }
        })
      : Promise.resolve([]),
    filters.airportIds.length > 0
      ? prisma.airport.findMany({
          where: { id: { in: filters.airportIds } },
          select: { id: true, name: true }
        })
      : Promise.resolve([])
  ]);

  return { aircraftMeta, airportMeta };
};
