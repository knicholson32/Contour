import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { Prisma } from '@prisma/client';
import { dateToDateStringFormSimple } from '$lib/helpers';
import { redirect } from '@sveltejs/kit';
import { getAirportIDList, getP2P } from '$lib/server/helpers/index.js';

type SubCol = {
  id: string,
  title: string;
  colSpan?: number;
  rotate?: boolean;
}

type Descriptor = SubCol & {
  subCols?: SubCol[];
}

const dataDescriptorDefault: Descriptor[] = [
  { id: 'date', title: 'Date', colSpan: 4 },
  { id: 'type', title: 'Aircraft Type', colSpan: 5 },
  { id: 'ident', title: 'Aircraft Ident', colSpan: 4 },
  { id: 'route', title: 'Route of Flight', subCols: [
    { id: 'from', title: 'From', colSpan: 3 },
    { id: 'via', title: 'Via', colSpan: 3 },
    { id: 'to', title: 'To', colSpan: 3 }
  ]},
  { id: 'total', title: 'Total', colSpan: 3  },
  { id: 'cat-class', title: 'Cat / Class', subCols: [
    { id: 'asel', title: 'ASEL', colSpan: 3 },
    { id: 'amel', title: 'AMEL', colSpan: 3 },
  ]},
  { id: 'inst-title', title: 'Instrument', subCols: [
    { id: 'inst', title: 'Inst' },
    { id: 'sim-inst', title: 'Sim Inst' },
    { id: 'approaches', title: '# A', colSpan: 2 },
    { id: 'holds', title: '# H', colSpan: 2 },
  ]},
  { id: 'sim-atd', title: 'Sim or ATD' },
  { id: 'landings', title: 'Landings', subCols: [
    { id: 'landings.all', title: 'All', colSpan: 2, rotate: true },
    { id: 'landings.day', title: 'Day', colSpan: 2, rotate: true },
    { id: 'landings.night', title: 'Night', colSpan: 2, rotate: true }
  ]},
  { id: 'detail', title: 'Type of Pilot Experience or Training', subCols: [
    { id: 'xc', title: 'XC', colSpan: 3  },
    { id: 'xc-p2p', title: 'XC P2P', colSpan: 3  },
    { id: 'crossings', title: 'Xing', colSpan: 1, rotate: true  },
    { id: 'night', title: 'Night', colSpan: 3  },
    { id: 'solo', title: 'Solo', colSpan: 3  },
    { id: 'pic', title: 'PIC', colSpan: 3  },
    { id: 'sic', title: 'SIC', colSpan: 3  },
    { id: 'dual-recv', title: 'Dual Recv.', colSpan: 3  },
    { id: 'dual-given', title: 'Dual Given', colSpan: 3  },
  ]},
  { id: 'notes', title: 'Remarks and Endorsements', colSpan: 15},
];

const SIGNATURE_SECTION_COLS = 6;
const DEFAULT_SPANS = 2;
const COL_WIDTH_REM = 1.25;

const DEFAULT_PER_PAGE = 100;

export const load = async ({ fetch, params, parent, url }) => {

  
  const name = await settings.get('general.name');

  // Get a copy of the descriptor that we can modify
  let dataDescriptor = JSON.parse(JSON.stringify(dataDescriptorDefault)) as Descriptor[];

  const p = url.searchParams.get('page');
  if (p === null || isNaN(parseInt(p))) redirect(303, '/logbook/reports/full?page=1&select=' + DEFAULT_PER_PAGE);
  const s = url.searchParams.get('select');
  if (s === null || isNaN(parseInt(s))) redirect(303, '/logbook/reports/full?page=' + p + '&select=' + DEFAULT_PER_PAGE);

  const count = await prisma.leg.count();
  const select = parseInt(s);
  const page = parseInt(p) - 1;

  const possibleAirports = await getAirportIDList();

  if (page < 0) redirect(303, '/logbook/reports/full');
  if (select < 0) redirect(303, '/logbook/reports/full');
  if (page * select > count - 1) redirect(303, `/logbook/reports/full?page=${Math.ceil(count / select)}&select=${select}`);

  const hide = url.searchParams.getAll('hide');
  for (const h of hide) {
    // Find top-level matches
    dataDescriptor = dataDescriptor.filter((d) => d.id !== h);
    // Filter sub columns
    for (const d of dataDescriptor) d.subCols = d.subCols?.filter((d) => d.id !== h);
  }

  const targetDataTask = prisma.leg.findMany({ take: select, skip: page * select, orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }], include: {
    aircraft: { include: { type: true } },
    originAirport: true,
    destinationAirport: true,
    diversionAirport: true,
    approaches: true,
    _count: { select: { approaches: true } }
  } });

  const forwardedSumsTask = prisma.leg.aggregate({ take: page * select, orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }],
    _sum: {
      totalTime: true,
      actualInstrument: true,
      simulatedInstrument: true,
      holds: true,
      dayLandings: true,
      nightLandings: true,
      xc: true,
      night: true,
      solo: true,
      pic: true,
      sic: true,
      dualReceived: true,
      dualGiven: true,
    }
  });

  const totalsDataTask = prisma.leg.aggregate({ take: page * select + select, orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }],
    _sum: {
      totalTime: true,
      actualInstrument: true,
      simulatedInstrument: true,
      holds: true,
      dayLandings: true,
      nightLandings: true,
      xc: true,
      night: true,
      solo: true,
      pic: true,
      sic: true,
      dualReceived: true,
      dualGiven: true,
    }
  });

  const forwardedDataApproachesTask = prisma.leg.findMany({ skip: 0, take: page * select, orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }],
    select: { _count: { select: { approaches: true } } }
  })

  const forwardedDataSpecializedTask = prisma.leg.findMany({ skip: 0, take: page * select, orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }],
    select: {
      totalTime: true,
      xc: true,
      crossing: true,
      aircraft: { select: { type: { select: { catClass: true } }, simulator: true } },
      originAirportId: true,
      destinationAirportId: true,
      diversionAirportId: true,
      route: true
    }
  });

  const totalEntriesTask = prisma.leg.count();

  const [targetData, forwardedSums, totalsData, forwardedDataSpecialized, forwardedData_approaches_raw, totalEntries] 
    = await prisma.$transaction([targetDataTask, forwardedSumsTask, totalsDataTask, forwardedDataSpecializedTask, forwardedDataApproachesTask, totalEntriesTask]);

  const forwardedData_approaches_arr = forwardedData_approaches_raw?.flatMap((v) => v._count.approaches);
  const forwardedData_approaches = forwardedData_approaches_arr.length === 0 ? 0 : forwardedData_approaches_arr.reduce((partialSum, v) => partialSum + v) ?? 0;

  const specialTotalsForwarded = {
    asel: forwardedDataSpecialized.flatMap((d) => d.aircraft.type.catClass === 'ASEL' ? d.totalTime : 0).reduce((acc, cur) => acc+cur, 0),
    amel: forwardedDataSpecialized.flatMap((d) => d.aircraft.type.catClass === 'AMEL' ? d.totalTime : 0).reduce((acc, cur) => acc+cur, 0),
    simAtd: forwardedDataSpecialized.flatMap((d) => d.aircraft.simulator ? d.totalTime : 0).reduce((acc, cur) => acc+cur, 0),
    xcP2P: forwardedDataSpecialized.flatMap((d) => getP2P(d.totalTime, d.xc, d.originAirportId, d.destinationAirportId, d.diversionAirportId, d.route, possibleAirports)).reduce((a, c) => a + c, 0),
    crossings: forwardedDataSpecialized.flatMap((d) => d.crossing ? 1 : 0).reduce((a: number, c: number) => a + c, 0)
  }

  const specialTotalsCurrentPage = {
    asel: targetData.flatMap((d) => d.aircraft.type.catClass === 'ASEL' ? d.totalTime : 0).reduce((acc, cur) => acc+cur, 0),
    amel: targetData.flatMap((d) => d.aircraft.type.catClass === 'AMEL' ? d.totalTime : 0).reduce((acc, cur) => acc+cur, 0),
    simAtd: targetData.flatMap((d) => d.aircraft.simulator ? d.totalTime : 0).reduce((acc, cur) => acc+cur, 0),
    xcP2P: targetData.flatMap((d) => getP2P(d.totalTime, d.xc, d.originAirportId, d.destinationAirportId, d.diversionAirportId, d.route, possibleAirports)).reduce((a, c) => a + c, 0),
    crossings: targetData.flatMap((d) => d.crossing ? 1 : 0).reduce((a: number, c: number) => a + c, 0)
  }

  let signatureSectionWidthCols = SIGNATURE_SECTION_COLS;
  let signatureSectionColSpan: { heading: number, titles: number, skipCols: number, dataColSpans: number[] } = { heading: 0, titles: 0, skipCols: signatureSectionWidthCols + 0, dataColSpans: []};
  const registerColumn = (colSpan: number) => {
    if (signatureSectionWidthCols > 1) {
      signatureSectionColSpan.heading += colSpan;
      signatureSectionWidthCols--;
    } else if (signatureSectionWidthCols === 1) {
      signatureSectionColSpan.titles += colSpan;
      signatureSectionWidthCols--;
    } else {
      signatureSectionColSpan.dataColSpans.push(colSpan);
    }
  }

  // Create an array to old the raw number of spans for each column. This allows the data logic to not care
  // what the specific assigned col span is for each data column.
  let rawColSpans: number[] = [];
  
  const dataColumnsOrdered: string[] = [];
  // Initialize the number of cols to set the grid to in the front-end
  let numCols = 0;
  // for (const descriptor of dataDescriptor) if (descriptor.colSpan !== undefined) numCols += descriptor.colSpan - 2;
  for (const descriptor of dataDescriptor) {
    // Check if it has sub columns. If so, its size is purely based on those sub columns
    if (descriptor.subCols !== undefined) {
      // It does. Look at the sub columns;
      let subColSpans = 0;
      for (const subCol of descriptor.subCols) {
        // Add this sub column as a data column
        dataColumnsOrdered.push(subCol.id);
        // Check if the column has a span defined
        if (subCol.colSpan === undefined) {
          subColSpans += DEFAULT_SPANS;
          // Assign the raw number of spans for this column
          rawColSpans.push(DEFAULT_SPANS);
          registerColumn(DEFAULT_SPANS);
        } else {
          subColSpans += subCol.colSpan;
          // Assign the raw number of spans for this column
          rawColSpans.push(subCol.colSpan);
          registerColumn(subCol.colSpan);
        }
      }
      // To prevent bugs, assign the colSpan of the top-level descriptor to the sub of the sub column spans.
      descriptor.colSpan = subColSpans;
      // Add the col spans to the total
      numCols += subColSpans;
    } else {
      // It does not. We will use the top-level descriptor spans, and default to DEFAULT_SPANS if none are specified.
      // Add this sub column as a data column
      dataColumnsOrdered.push(descriptor.id);
      // Check if this column has a span defined
      if (descriptor.colSpan === undefined) {
        numCols += DEFAULT_SPANS;
        // Assign the raw number of spans for this column
        rawColSpans.push(DEFAULT_SPANS);
        registerColumn(DEFAULT_SPANS);
      } else {
        numCols += descriptor.colSpan;
        // Assign the raw number of spans for this column
        rawColSpans.push(descriptor.colSpan);
        registerColumn(descriptor.colSpan);
      }
    } 
  }

  type Entry = {
    colSpan: number,
    text: string,
    hover?: string,
    link?: string,
    strike?: string,
    textLeft?: boolean
  }

  type Row = Entry[];


  const summedData: { [key: string]: number } = {};
  const addTo = (title: string, val: number) => {
    if (!(title in summedData)) summedData[title] = 0;
    summedData[title] += val;
  }
  const calculateDataField = (id: string, colSpan: number, data: typeof targetData[0]): Entry => {
    let entry: Entry = { colSpan: colSpan, text: '' };
    switch (id) {
      case 'date':
        entry.text = dateToDateStringFormSimple(data.startTime_utc, true)
        entry.link = `/entry/leg/${data.id}`
        return entry;
      case 'type':
        entry.text = data.aircraft.type.typeCode;
        entry.link = `/aircraft/type/${data.aircraft.aircraftTypeId}`;
        return entry;
      case 'ident':
        entry.text = data.ident ?? data.aircraft.registration;
        entry.link = `/aircraft/entry/${data.aircraftId}`;
        return entry;
      case 'from':
        entry.text = data.originAirport?.id ?? '';
        return entry;
      case 'to':
        if (data.diversionAirport !== null) {
          entry.strike = (data.destinationAirport?.id ?? '');
          entry.text = (data.destinationAirport?.id ?? '') + ' → ' + (data.diversionAirport?.id ?? '');
        } else entry.text = data.destinationAirport?.id ?? '';
        return entry;
      case 'via':
        if (data.route !== null) {
          entry.text = data.route;
          if (data.route.split(' ').length > 1) entry.hover = data.route;
        }
        return entry;
      case 'total':
        addTo(id, data.totalTime);
        entry.text = data.totalTime.toFixed(1);
        return entry;
      case 'asel':
        if (data.aircraft.type.catClass === 'ASEL') {
          addTo(id, data.totalTime);
          entry.text = data.totalTime === 0 ? '' : data.totalTime.toFixed(1);
        }
        return entry;
      case 'amel':
        if (data.aircraft.type.catClass === 'AMEL') {
          addTo(id, data.totalTime);
          entry.text = data.totalTime === 0 ? '' : data.totalTime.toFixed(1);
        }
        return entry;
      case 'inst':
        addTo(id, data.actualInstrument);
        entry.text = data.actualInstrument === 0 ? '' : data.actualInstrument.toFixed(1);
        return entry;
      case 'sim-inst':
        addTo(id, data.simulatedInstrument);
        entry.text = data.simulatedInstrument === 0 ? '' : data.simulatedInstrument.toFixed(1);
        return entry;
      case 'approaches':
        addTo(id, data._count.approaches);
        entry.text = data._count.approaches === 0 ? '' : data._count.approaches.toFixed(0);
        entry.hover = data.approaches.flatMap((a) => a.airportId + ' ' + a.composite).join('\n');
        return entry;
      case 'holds':
        addTo(id, data.holds);
        entry.text = data.holds === 0 ? '' : data.holds.toFixed(0);
        return entry;
      case 'sim-atd':
        if (data.aircraft.simulator === true) {
          addTo(id, data.totalTime);
          entry.text = data.totalTime.toFixed(1);
        }
        return entry;
      case 'landings.all': // Landings
        let totalLandings = (data.dayLandings + data.nightLandings);
        addTo(id, totalLandings);
        entry.text = totalLandings === 0 ? '' : totalLandings.toFixed(0);
        return entry;
      case 'landings.day': // Landings
        addTo(id, data.dayLandings);
        entry.text = data.dayLandings === 0 ? '' : data.dayLandings.toFixed(0);
        return entry;
      case 'landings.night': // Landings
        addTo(id, data.nightLandings);
        entry.text = data.nightLandings === 0 ? '' : data.nightLandings.toFixed(0);
        return entry;
      case 'xc':
        addTo(id, data.xc);
        entry.text = data.xc === 0 ? '' : data.xc.toFixed(1);
        return entry;
      case 'xc-p2p':
        const p2p = getP2P(data.totalTime, data.xc, data.originAirportId, data.destinationAirportId, data.diversionAirportId, data.route, possibleAirports);
        if (p2p > 0) {
          entry.text = p2p.toFixed(1);
          addTo(id, p2p);
        }
        return entry;
      case 'crossings':
        if (data.crossing === true) {
          entry.text = '1';
          addTo(id, 1);
        }
        return entry;
      case 'night':
        addTo(id, data.night);
        entry.text = data.night === 0 ? '' : data.night.toFixed(1);
        return entry;
      case 'solo':
        addTo(id, data.solo);
        entry.text = data.solo === 0 ? '' : data.solo.toFixed(1);
        return entry;
      case 'pic':
        addTo(id, data.pic);
        entry.text = data.pic === 0 ? '' : data.pic.toFixed(1);
        return entry;
      case 'sic':
        addTo(id, data.sic);
        entry.text = data.sic === 0 ? '' : data.sic.toFixed(1);
        return entry;
      case 'dual-recv':
        addTo(id, data.dualReceived);
        entry.text = data.dualReceived === 0 ? '' : data.dualReceived.toFixed(1);
        return entry;
      case 'dual-given':
        addTo(id, data.dualGiven);
        entry.text = data.dualGiven === 0 ? '' : data.dualGiven.toFixed(1);
        return entry;
      case 'notes':
        entry.text = data.notes;
        entry.textLeft = true;
        return entry;
      case '':
        return entry;
      default:
        throw new Error(`Unimplemented type: ${id}`)
    }
  }

  const displayTotals = (id: string, colSpan: number): Entry => {
    let entry: Entry = { colSpan: colSpan, text: '' };
    if (id in summedData) {
      switch (id) {
        case 'total':
        case 'asel':
        case 'amel':
        case 'inst':
        case 'sim-inst':
        case 'sim-atd':
        case 'xc':
        case 'xc-p2p':
        case 'night':
        case 'solo':
        case 'pic':
        case 'sic':
        case 'dual-recv':
        case 'dual-given':
          if (summedData[id] === 1) console.log(summedData);
          entry.text = summedData[id] === 0 ? '' : summedData[id].toFixed(1);
          return entry;
        case 'approaches':
        case 'holds':
        case 'crossings':
        case 'landings.all':
        case 'landings.day':
        case 'landings.night':
          entry.text = summedData[id] === 0 ? '' : summedData[id].toFixed(0);
          return entry;
        case '':
          return entry;
        default:
          throw new Error(`Unimplemented conversion type: ${id}`)
      }
    }
    return entry;
  }

  const displayForwarded = (id: string, colSpan: number): Entry => {
    let entry: Entry = { colSpan: colSpan, text: '' };
    switch (id) {
      case 'asel':
        entry.text = specialTotalsForwarded.asel.toFixed(1);
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'amel':
        entry.text = specialTotalsForwarded.amel.toFixed(1);
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'sim-atd':
        entry.text = specialTotalsForwarded.simAtd.toFixed(1);
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'approaches':
        entry.text = forwardedData_approaches === 0 ? '' : forwardedData_approaches.toFixed(0);
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'holds':
        entry.text = forwardedSums._sum.holds?.toFixed(0) ?? '';
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'landings.all':
        entry.text = forwardedSums._sum.dayLandings === null || forwardedSums._sum.nightLandings === null ? '' : (forwardedSums._sum.dayLandings + forwardedSums._sum.nightLandings).toFixed(0);
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'landings.day':
        entry.text = forwardedSums._sum.dayLandings?.toFixed(0) ?? '';
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'landings.night':
        entry.text = forwardedSums._sum.nightLandings?.toFixed(0) ?? '';
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'total':
        entry.text = forwardedSums._sum.totalTime?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'inst':
        entry.text = forwardedSums._sum.actualInstrument?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'sim-inst':
        entry.text = forwardedSums._sum.simulatedInstrument?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'xc':
        entry.text = forwardedSums._sum.xc?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'xc-p2p':
        entry.text = specialTotalsForwarded.xcP2P.toFixed(1);
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'crossings':
        entry.text = specialTotalsForwarded.crossings.toFixed(0);
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'night':
        entry.text = forwardedSums._sum.night?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'solo':
        entry.text = forwardedSums._sum.solo?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'pic':
        entry.text = forwardedSums._sum.pic?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'sic':
        entry.text = forwardedSums._sum.sic?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'dual-recv':
        entry.text = forwardedSums._sum.dualReceived?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'dual-given':
        entry.text = forwardedSums._sum.dualGiven?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case '':
      case 'notes':
        return entry;
      default:
        throw new Error(`Unimplemented forwarded type: ${id}`)
    }
  }

  const displayNewTotals = (id: string, colSpan: number): Entry => {
    let entry: Entry = { colSpan: colSpan, text: '' };

    switch (id) {
      case 'asel':
        entry.text = (specialTotalsForwarded.asel + specialTotalsCurrentPage.asel).toFixed(1);
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'amel':
        entry.text = (specialTotalsForwarded.amel + specialTotalsCurrentPage.amel).toFixed(1);
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'sim-atd':
        entry.text = (specialTotalsForwarded.simAtd + specialTotalsCurrentPage.simAtd).toFixed(1);
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'approaches':
        entry.text = (forwardedData_approaches + targetData.flatMap((d) => d._count.approaches).reduce((a, c) => a + c, 0)).toFixed(0);
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'holds':
        entry.text = totalsData._sum.holds?.toFixed(0) ?? ''
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'landings.all':
        entry.text = ((totalsData._sum.dayLandings ?? 0) + (totalsData._sum.nightLandings ?? 0)).toFixed(0);
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'landings.day':
        entry.text = totalsData._sum.dayLandings?.toFixed(0) ?? '';
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'landings.night':
        entry.text = totalsData._sum.nightLandings?.toFixed(0) ?? '';
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'total':
        entry.text = totalsData._sum.totalTime?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'inst':
        entry.text = totalsData._sum.actualInstrument?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'sim-inst':
        entry.text = totalsData._sum.simulatedInstrument?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'xc':
        entry.text = totalsData._sum.xc?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'xc-p2p':
        entry.text = (specialTotalsForwarded.xcP2P + specialTotalsCurrentPage.xcP2P).toFixed(1);
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'crossings':
        entry.text = (specialTotalsForwarded.crossings + specialTotalsCurrentPage.crossings).toFixed(0);
        if (entry.text === '0') entry.text = '';
        return entry;
      case 'night':
        entry.text = totalsData._sum.night?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'solo':
        entry.text = totalsData._sum.solo?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'pic':
        entry.text = totalsData._sum.pic?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'sic':
        entry.text = totalsData._sum.sic?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'dual-recv':
        entry.text = totalsData._sum.dualReceived?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'dual-given':
        entry.text = totalsData._sum.dualGiven?.toFixed(1) ?? '';
        if (entry.text === '0.0') entry.text = '';
        return entry;
      case 'notes':
      case '':
        return entry;
      default:
        throw new Error(`Unimplemented forwarded type: ${id}`)
    }
    return entry;
  }


  const rows: Row[]  = [];
  let currentCol = 0;
  for (const entry of targetData) {
    let row: Row = [];
    for (const dataCol of dataColumnsOrdered) row.push(calculateDataField(dataCol, rawColSpans[currentCol++], entry));
    rows.push(row);
    currentCol = 0;
  }


  const totalsRows: Row[]  = [];
  {
    // Amount forwarded
    let row: Row = [];
    for (let i = signatureSectionColSpan.skipCols; i < dataColumnsOrdered.length; i++) {
      row.push(displayForwarded(dataColumnsOrdered[i], rawColSpans[i]));
    }
    totalsRows.push(row);
  }
  {
    // Amount this page
    let row: Row = [];
    for (let i = signatureSectionColSpan.skipCols; i < dataColumnsOrdered.length; i++) {
      row.push(displayTotals(dataColumnsOrdered[i], rawColSpans[i]));
    }
    totalsRows.push(row);
  }
  {
    // New total (forwarded + this page)
    let row: Row = [];
    for (let i = signatureSectionColSpan.skipCols; i < dataColumnsOrdered.length; i++) {
      row.push(displayNewTotals(dataColumnsOrdered[i], rawColSpans[i]));
    }
    totalsRows.push(row);
  }

  return {
    name,
    dataDescriptor,
    numCols,
    rows,
    select,
    page,
    totalsRows,
    rawColSpans,
    totalEntries,
    signatureSectionColSpan,
    SIGNATURE_SECTION_COLS,
    DEFAULT_SPANS,
    COL_WIDTH_REM,
  }
};