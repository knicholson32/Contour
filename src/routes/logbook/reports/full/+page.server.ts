import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { Prisma } from '@prisma/client';
import { dateToDateStringFormSimple } from '$lib/helpers';
import { redirect } from '@sveltejs/kit';

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
    { id: 'approaches', title: '# A', colSpan: 1 },
    { id: 'holds', title: '# H', colSpan: 1 },
  ]},
  { id: 'sim-atd', title: 'Sim or ATD' },
  { id: 'landings', title: 'Landings', subCols: [
    { id: 'landings.all', title: 'All', colSpan: 2, rotate: true },
    { id: 'landings.day', title: 'Day', colSpan: 2, rotate: true },
    { id: 'landings.night', title: 'Night', colSpan: 2, rotate: true }
  ]},
  { id: 'detail', title: 'Type if Pilot Experience or Training', subCols: [
    { id: 'xc', title: 'XC', colSpan: 3  },
    { id: 'xc-p2p', title: 'XC P2P', colSpan: 3  },
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

  const targetData = await prisma.leg.findMany({ take: select, skip: page * select, orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }], include: {
    aircraft: { include: { type: true } },
    originAirport: true,
    destinationAirport: true,
    diversionAirport: true,
    approaches: true,
    _count: { select: { approaches: true } }
  } });

  const forwardedData = await prisma.leg.aggregate({ take: page * select, orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }],
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

  const forwardedData_approaches_arr = ((await prisma.leg.findMany({ take: page * select, orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }],
    select: { _count: { select: { approaches: true } } }
  }))?.flatMap((v) => v._count.approaches))
  const forwardedData_approaches = forwardedData_approaches_arr.length === 0 ? 0 : forwardedData_approaches_arr.reduce((partialSum, v) => partialSum + v) ?? 0;

  const forwardedData_asel = (await prisma.leg.aggregate({ orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }], skip: 0, take: page * select,
    where: {
      aircraft: {
        type: {
          catClass: 'ASEL'
        }
      }
    },
    _sum: {
      totalTime: true
    }
  }))._sum.totalTime ?? 0;

  const forwardedData_amel = (await prisma.leg.aggregate({ orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }], skip: 0, take: page * select,
    where: {
      aircraft: {
        type: {
          catClass: 'AMEL'
        }
      }
    },
    _sum: {
      totalTime: true
    }
  }))._sum.totalTime ?? 0;

  const forwardedData_sim_atd = (await prisma.leg.aggregate({ orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }], skip: 0, take: page * select,
    where: {
      aircraft: {
        simulator: true
      }
    },
    _sum: {
      totalTime: true
    }
  }))._sum.totalTime ?? 0;


  const totalEntries = await prisma.leg.count();

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
        if (data.diversionAirport !== null) entry.text = (data.destinationAirport?.id ?? '') + ' -> ' + (data.diversionAirport?.id ?? '');
        else entry.text = data.destinationAirport?.id ?? '';
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
          entry.text = data.totalTime.toFixed(1);
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
        addTo(id, data.xc);
        entry.text = data.xc === 0 ? '' : data.xc.toFixed(1);
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
        case 'approaches':
        case 'holds':
        case 'landings.all':
        case 'landings.day':
        case 'landings.night':
          entry.text = summedData[id].toFixed(0);
          return entry;
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
          entry.text = summedData[id].toFixed(1);
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
    if (id in summedData) {
      switch (id) {
        case 'asel':
          entry.text = forwardedData_asel === 0 ? '' : forwardedData_asel.toFixed(1);
          return entry;
        case 'amel':
          entry.text = forwardedData_amel === 0 ? '' : forwardedData_amel.toFixed(1);
          return entry;
        case 'sim-atd':
          entry.text = forwardedData_sim_atd === 0 ? '' : forwardedData_sim_atd.toFixed(1);
          return entry;
        case 'approaches':
          entry.text = forwardedData_approaches === 0 ? '' : forwardedData_approaches.toFixed(0);
          return entry;
        case 'holds':
          entry.text = forwardedData._sum.holds?.toFixed(0) ?? '';
          return entry;
        case 'landings.all':
          entry.text = forwardedData._sum.dayLandings === null || forwardedData._sum.nightLandings === null ? '' : (forwardedData._sum.dayLandings + forwardedData._sum.nightLandings).toFixed(0);
          return entry;
        case 'landings.day':
          entry.text = forwardedData._sum.dayLandings?.toFixed(0) ?? '';
          return entry;
        case 'landings.night':
          entry.text = forwardedData._sum.nightLandings?.toFixed(0) ?? '';
          return entry;
        case 'total':
          entry.text = forwardedData._sum.totalTime?.toFixed(1) ?? '';
          return entry;
        case 'inst':
          entry.text = forwardedData._sum.actualInstrument?.toFixed(1) ?? '';
          return entry;
        case 'sim-inst':
          entry.text = forwardedData._sum.simulatedInstrument?.toFixed(1) ?? '';
          return entry;
        case 'xc':
          entry.text = forwardedData._sum.xc?.toFixed(1) ?? '';
          return entry;
        case 'xc-p2p':
          entry.text = forwardedData._sum.xc?.toFixed(1) ?? '';
          return entry;
        case 'night':
          entry.text = forwardedData._sum.night?.toFixed(1) ?? '';
          return entry;
        case 'solo':
          entry.text = forwardedData._sum.solo?.toFixed(1) ?? '';
          return entry;
        case 'pic':
          entry.text = forwardedData._sum.pic?.toFixed(1) ?? '';
          return entry;
        case 'sic':
          entry.text = forwardedData._sum.sic?.toFixed(1) ?? '';
          return entry;
        case 'dual-recv':
          entry.text = forwardedData._sum.dualReceived?.toFixed(1) ?? '';
          return entry;
        case 'dual-given':
          entry.text = forwardedData._sum.dualGiven?.toFixed(1) ?? '';
          return entry;
        case '':
          return entry;
        default:
          throw new Error(`Unimplemented forwarded type: ${id}`)
      }
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
    for (let i = signatureSectionColSpan.skipCols; i < dataColumnsOrdered.length; i++) row.push(displayForwarded(dataColumnsOrdered[i], rawColSpans[i]));
    totalsRows.push(row);
  }
  {
    // Amount this page
    let row: Row = [];
    for (let i = signatureSectionColSpan.skipCols; i < dataColumnsOrdered.length; i++) row.push(displayTotals(dataColumnsOrdered[i], rawColSpans[i]));
    totalsRows.push(row);
  }
  {
    // New total (forwarded + this page)
    let row: Row = [];
    for (let i = signatureSectionColSpan.skipCols; i < dataColumnsOrdered.length; i++) row.push(displayTotals(dataColumnsOrdered[i], rawColSpans[i]));
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
    forwardedData_amel,
    SIGNATURE_SECTION_COLS,
    DEFAULT_SPANS,
    COL_WIDTH_REM,
  }
};