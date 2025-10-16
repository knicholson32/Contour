import ExcelJS from 'exceljs';
import type { RequestHandler } from './$types';
import {
  fetchExportLegs,
  fetchFilterMetadata,
  parseFiltersFromUrl,
  describeAircraft,
  formatAirport,
  formatApproaches,
  hours,
  toISODate
} from '../../../../lib/components/routeSpecific/pdf/utils.server.js';

export const GET: RequestHandler = async ({ url }) => {
  const filters = parseFiltersFromUrl(url);
  const legs = await fetchExportLegs(filters);
  const { aircraftMeta, airportMeta } = await fetchFilterMetadata(filters);

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
    { setting: 'Start Date', value: filters.start ?? 'Not limited' },
    { setting: 'End Date', value: filters.end ?? 'Not limited' },
    {
      setting: 'Aircraft Filter',
      value:
        filters.aircraftIds.length > 0
          ? aircraftMeta.length > 0
            ? aircraftMeta.map(describeAircraft).join(', ')
            : 'No matching aircraft for provided IDs'
          : 'All aircraft'
    },
    {
      setting: 'Airport Filter',
      value:
        filters.airportIds.length > 0
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
