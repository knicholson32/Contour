import ExcelJS from 'exceljs';
import prisma from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import type { RequestHandler } from './$types';

const toUnixStart = (date: string) => {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor(parsed.getTime() / 1000);
};

const toUnixEnd = (date: string) => {
  const parsed = new Date(`${date}T23:59:59.999Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor(parsed.getTime() / 1000);
};

const toISODate = (unixSeconds: number | null | undefined) => {
  if (!unixSeconds) return '';
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatAirport = (airport: { id: string; name: string | null } | null) => {
  if (!airport) return '';
  if (airport.name && airport.name.trim().length > 0) return `${airport.id} · ${airport.name}`;
  return airport.id;
};

const formatApproaches = (approaches: { type: string; runway: string | null; airportId: string; notes: string | null }[]) => {
  if (approaches.length === 0) return '';
  return approaches
    .map((approach) => {
      const runway = approach.runway ? ` RWY ${approach.runway}` : '';
      const notes = approach.notes ? ` (${approach.notes})` : '';
      return `${approach.type} @ ${approach.airportId}${runway}${notes}`;
    })
    .join(' | ');
};

const hours = (value: number) => (value === null || value === undefined ? 0 : Number.parseFloat(value.toFixed(2)));

const describeAircraft = (record: {
  registration: string;
  type: { make: string; model: string; typeCode: string } | null;
}) => {
  if (!record.type) return record.registration;
  return `${record.registration} · ${record.type.make} ${record.type.model} (${record.type.typeCode})`;
};

export const GET: RequestHandler = async ({ url }) => {
  const startParam = url.searchParams.get('start');
  const endParam = url.searchParams.get('end');
  const aircraftFilters = url.searchParams.getAll('aircraft').filter(Boolean);
  const airportFilters = url.searchParams.getAll('airport').filter(Boolean);

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

  if (aircraftFilters.length > 0) {
    where.aircraftId = { in: aircraftFilters };
  }

  if (airportFilters.length > 0) {
    where.OR = [
      { originAirportId: { in: airportFilters } },
      { destinationAirportId: { in: airportFilters } },
      { diversionAirportId: { in: airportFilters } }
    ];
  }

  const aircraftMetaPromise =
    aircraftFilters.length > 0
      ? prisma.aircraft.findMany({
          where: { id: { in: aircraftFilters } },
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
      : Promise.resolve([] as {
          id: string;
          registration: string;
          type: { make: string; model: string; typeCode: string } | null;
        }[]);

  const airportMetaPromise =
    airportFilters.length > 0
      ? prisma.airport.findMany({
          where: { id: { in: airportFilters } },
          select: { id: true, name: true }
        })
      : Promise.resolve([] as { id: string; name: string | null }[]);

  const [aircraftMeta, airportMeta] = await Promise.all([aircraftMetaPromise, airportMetaPromise]);

  const legs = await prisma.leg.findMany({
    where,
    orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }],
    include: {
      aircraft: {
        select: {
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
      },
      originAirport: { select: { id: true, name: true } },
      destinationAirport: { select: { id: true, name: true } },
      diversionAirport: { select: { id: true, name: true } },
      approaches: {
        select: { type: true, runway: true, airportId: true, notes: true }
      }
    }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Contour';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Logbook', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Aircraft', key: 'aircraft', width: 14 },
    { header: 'Aircraft Type', key: 'aircraftType', width: 24 },
    { header: 'Simulator', key: 'simulator', width: 12 },
    { header: 'From', key: 'from', width: 10 },
    { header: 'To', key: 'to', width: 10 },
    { header: 'Diversion', key: 'diversion', width: 12 },
    { header: 'Route', key: 'route', width: 28 },
    { header: 'Total Time', key: 'totalTime', width: 12, style: { numFmt: '0.00' } },
    { header: 'PIC', key: 'pic', width: 10, style: { numFmt: '0.00' } },
    { header: 'SIC', key: 'sic', width: 10, style: { numFmt: '0.00' } },
    { header: 'Night', key: 'night', width: 10, style: { numFmt: '0.00' } },
    { header: 'XC', key: 'xc', width: 10, style: { numFmt: '0.00' } },
    { header: 'Solo', key: 'solo', width: 10, style: { numFmt: '0.00' } },
    { header: 'Sim Instrument', key: 'simInstrument', width: 14, style: { numFmt: '0.00' } },
    { header: 'Actual Instrument', key: 'actInstrument', width: 16, style: { numFmt: '0.00' } },
    { header: 'Dual Given', key: 'dualGiven', width: 12, style: { numFmt: '0.00' } },
    { header: 'Dual Received', key: 'dualReceived', width: 14, style: { numFmt: '0.00' } },
    { header: 'Day Landings', key: 'dayLandings', width: 14, style: { numFmt: '0' } },
    { header: 'Night Landings', key: 'nightLandings', width: 16, style: { numFmt: '0' } },
    { header: 'Holds', key: 'holds', width: 10, style: { numFmt: '0' } },
    { header: 'Approaches', key: 'approaches', width: 36 },
    { header: 'Passengers', key: 'passengers', width: 12, style: { numFmt: '0' } },
    { header: 'Notes', key: 'notes', width: 40 }
  ];

  sheet.addRows(
    legs.map((leg) => ({
      date: toISODate(leg.startTime_utc),
      aircraft: leg.aircraft?.registration ?? '',
      aircraftType: leg.aircraft?.type
        ? `${leg.aircraft.type.make} ${leg.aircraft.type.model} (${leg.aircraft.type.typeCode})`
        : '',
      simulator: leg.aircraft?.simulator ? 'Yes' : 'No',
      from: formatAirport(leg.originAirport),
      to: formatAirport(leg.destinationAirport),
      diversion: formatAirport(leg.diversionAirport),
      route: leg.route ?? '',
      totalTime: hours(leg.totalTime),
      pic: hours(leg.pic),
      sic: hours(leg.sic),
      night: hours(leg.night),
      xc: hours(leg.xc),
      solo: hours(leg.solo),
      simInstrument: hours(leg.simulatedInstrument),
      actInstrument: hours(leg.actualInstrument),
      dualGiven: hours(leg.dualGiven),
      dualReceived: hours(leg.dualReceived),
      dayLandings: leg.dayLandings ?? 0,
      nightLandings: leg.nightLandings ?? 0,
      holds: leg.holds ?? 0,
      approaches: formatApproaches(leg.approaches),
      passengers: leg.passengers ?? 0,
      notes: leg.notes ?? ''
    }))
  );

  const infoSheet = workbook.addWorksheet('Filters');
  infoSheet.columns = [
    { header: 'Setting', key: 'setting', width: 22 },
    { header: 'Value', key: 'value', width: 60 }
  ];

  const infoRows: { setting: string; value: string }[] = [
    { setting: 'Generated At', value: new Date().toISOString() },
    { setting: 'Start Date', value: startParam ?? 'Not limited' },
    { setting: 'End Date', value: endParam ?? 'Not limited' },
    {
      setting: 'Aircraft Filter',
      value:
        aircraftFilters.length > 0
          ? aircraftMeta.length > 0
            ? aircraftMeta.map(describeAircraft).join(', ')
            : 'No matching aircraft for provided IDs'
          : 'All aircraft'
    },
    {
      setting: 'Airport Filter',
      value:
        airportFilters.length > 0
          ? airportMeta.length > 0
            ? airportMeta.map((airport) => formatAirport(airport)).join(', ')
            : 'No matching airports for provided IDs'
          : 'All airports'
    },
    { setting: 'Legs Exported', value: legs.length.toString() }
  ];

  infoSheet.addRows(infoRows);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `contour-logbook-${new Date().toISOString().replace(/[:]/g, '-')}.xlsx`;

  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
};
