import ExcelJS, { type Alignment } from 'exceljs';
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
} from '$lib/components/routeSpecific/pdf/utils.server.js';
import { getP2P, getAirportIDList } from '$lib/server/helpers';

export const GET: RequestHandler = async ({ url }) => {
  const filters = parseFiltersFromUrl(url.searchParams);
  const legs = await fetchExportLegs(filters);
  const { aircraftMeta, airportMeta } = await fetchFilterMetadata(filters);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Contour';
  workbook.created = new Date();

  const possibleAirports = await getAirportIDList();

  const sheet = workbook.addWorksheet('Logbook', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });


  sheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Reg.', key: 'aircraft', width: 8 },
    { header: 'Type Code', key: 'aircraftTypeCode', width: 12 },
    { header: 'Type Name', key: 'aircraftTypeName', width: 20 },
    { header: 'From', key: 'from', width: 8 },
    { header: 'Route', key: 'route', width: 10 },
    { header: 'To', key: 'to', width: 8 },
    { header: 'Diversion', key: 'diversion', width: 8 },
    { header: 'Total Time', key: 'totalTime', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'ASEL', key: 'asel', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'AMEL', key: 'amel', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'PIC', key: 'pic', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'SIC', key: 'sic', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'Night', key: 'night', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'XC', key: 'xc', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'P2P', key: 'xc-p2p', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'Xing', key: 'crossing', width: 6, style: { numFmt: '0', alignment: { horizontal: 'center' } } },
    { header: 'Solo', key: 'solo', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'Simulated', key: 'simInstrument', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'Actual', key: 'actInstrument', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'Holds', key: 'holds', width: 6, style: { numFmt: '0', alignment: { horizontal: 'center' } } },
    { header: 'Approaches', key: 'approaches', width: 24 },
    { header: 'Total', key: 'simulator', width: 6, style: { numFmt: '0.0', alignment: { horizontal: 'center', wrapText: true } } },
    { header: 'ATD', key: 'simulatorATD', width: 6, style: { numFmt: '0.0', alignment: { horizontal: 'center', wrapText: true } } },
    { header: 'FTD', key: 'simulatorFTD', width: 6, style: { numFmt: '0.0', alignment: { horizontal: 'center', wrapText: true } } },
    { header: 'FSS', key: 'simulatorFFS', width: 6, style: { numFmt: '0.0', alignment: { horizontal: 'center', wrapText: true } } },
    { header: 'Given', key: 'dualGiven', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'Received', key: 'dualReceived', width: 10, style: { numFmt: '0.0', alignment: { horizontal: 'center' } } },
    { header: 'Day', key: 'dayLandings', width: 6, style: { numFmt: '0', alignment: { horizontal: 'center' } } },
    { header: 'Night', key: 'nightLandings', width: 6, style: { numFmt: '0', alignment: { horizontal: 'center' } } },
    { header: 'Passengers', key: 'passengers', width: 10, style: { numFmt: '0', alignment: { horizontal: 'center' } } },
    { header: 'Notes', key: 'notes', width: 50 }
  ];

  const columns = sheet.columns;

  sheet.insertRow(0, '');

  const mergeGroups = [
    { title: 'Aircraft', keys: ['aircraft', 'aircraftTypeCode', 'aircraftTypeName'] },
    { title: 'Route of Flight', keys: ['from', 'route', 'to', 'diversion'] },
    { title: 'Cat / Class', keys: ['asel', 'amel'] },
    { title: 'Instrument', keys: ['simInstrument', 'actInstrument', 'approaches', 'holds'] },
    { title: 'Dual', keys: ['dualGiven', 'dualReceived'] },
    { title: 'Cross Country', keys: ['xc', 'xc-p2p', 'crossing'] },
    { title: 'Simulated Flight', keys: ['simulator', 'simulatorATD', 'simulatorFTD', 'simulatorFFS'] },
    { title: 'Landings', keys: ['dayLandings', 'nightLandings'] },
  ];

  let columnKeys = columns.map((c) => c.key);
  let mergedColumns: string[] = [];

  for (const group of mergeGroups) {
    if (group.keys.length === 0) throw new Error(`Invalid group designation: ${JSON.stringify(group)}: 'keys' cannot be empty.`)

    const i = columns.findIndex((c) => c.key === group.keys[0]);
    if (i === -1) throw new Error(`Invalid group designation: ${JSON.stringify(group)}: Cannot find '${group.keys[0]}'.`)
    if (i + group.keys.length >= columns.length) throw new Error(`Invalid group designation: ${JSON.stringify(group)}: Column overrun would occur, based on location of '${group.keys[0]}'.`)
    for (let j = i; j < group.keys.length + i; j++) if (!group.keys.includes(columns[j].key)) throw new Error(`Invalid group designation: ${JSON.stringify(group)}: All keys must be consecutive columns. Found: '${columns[j].key}'`);
    const j = i + group.keys.length - 1;

    // Created a merged title

    sheet.mergeCells(1, i + 1, 1, j + 1);
    const cell = sheet.getCell(1, i+1);
    cell.value = group.title;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const key of group.keys) mergedColumns.push(key);
  }

  for (const key of columnKeys) {
    if (mergedColumns.includes(key)) continue;
    const i = columns.findIndex((c) => c.key === key);
    sheet.mergeCells(2, i+1, 1, i+1);
    const cell = sheet.getCell(1, i+1);
    cell.value = columns[i].header;
    cell.alignment = { ...columns[i].style?.alignment, vertical: 'middle' } as Partial<Alignment>;
  }
  
  // sheet.unMergeCells(7, 1, 10, 2);

  sheet.addRows(
    legs.map((leg) => ({
      date: toISODate(leg.startTime_utc),
      aircraft: leg.aircraft?.registration ?? '',
      aircraftTypeCode: leg.aircraft?.type ? leg.aircraft.type.typeCode : '',
      aircraftTypeName: leg.aircraft?.type ? `${leg.aircraft.type.make} ${leg.aircraft.type.model}` : '',
      from: formatAirport(leg.originAirport),
      to: formatAirport(leg.destinationAirport),
      diversion: formatAirport(leg.diversionAirport),
      route: leg.route ?? '',
      totalTime: hours(leg.totalTime),
      simulator: leg.aircraft.simulator ? leg.totalTime : '',
      simulatorATD: leg.aircraft.simulator && leg.aircraft.simulatorType === 'ATD' ? leg.totalTime : '',
      simulatorFTD: leg.aircraft.simulator && leg.aircraft.simulatorType === 'FTD' ? leg.totalTime : '',
      simulatorFFS: leg.aircraft.simulator && leg.aircraft.simulatorType === 'FFS' ? leg.totalTime : '',
      asel: hours(leg.aircraft.type.catClass === 'ASEL' ? leg.totalTime : 0),
      amel: hours(leg.aircraft.type.catClass === 'AMEL' ? leg.totalTime : 0),
      pic: hours(leg.pic),
      sic: hours(leg.sic),
      night: hours(leg.night),
      crossing: leg.crossing ? 1 : '',
      xc: hours(leg.xc),
      'xc-p2p': hours(getP2P(leg.totalTime, leg.xc, leg.originAirportId, leg.destinationAirportId, leg.diversionAirportId, leg.route, possibleAirports)),
      solo: hours(leg.solo),
      simInstrument: hours(leg.simulatedInstrument),
      actInstrument: hours(leg.actualInstrument),
      holds: (leg.holds ?? 0) === 0 ? '' : (leg.holds ?? 0),
      approaches: formatApproaches(leg.approaches),
      dualGiven: hours(leg.dualGiven),
      dualReceived: hours(leg.dualReceived),
      dayLandings: leg.dayLandings ?? 0,
      nightLandings: leg.nightLandings ?? 0,
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
