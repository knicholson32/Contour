import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { Prisma } from '@prisma/client';
import { dateToDateStringFormSimple } from '$lib/helpers';

type SubCol = {
  title: string;
  colSpan?: number;
  rotate?: boolean;
}

type Descriptor = SubCol & {
  subCols?: SubCol[];
}

type DataType = 'Table' | 'String' | 'Boolean' | 'Float' | 'Int';

type Structure = {
  name: string,
  type: DataType,
  children?: Structure[]
}

const dataDescriptor: Descriptor[] = [
  { title: 'Date', colSpan: 4 },
  { title: 'Aircraft Type', colSpan: 5 },
  { title: 'Aircraft Ident', colSpan: 4 },
  { title: 'Route of Flight', subCols: [
    { title: 'From', colSpan: 3 },
    { title: 'Via', colSpan: 3 },
    { title: 'To', colSpan: 3 }
  ]},
  { title: 'Total' },
  { title: 'Cat / Class', subCols: [
    { title: 'ASEL', colSpan: 3 },
    { title: 'AMEL', colSpan: 3 },
  ]},
  { title: 'Instrument', subCols: [
    { title: 'Inst' },
    { title: 'Sim Inst' },
    { title: '# A', colSpan: 1 },
    { title: '# H', colSpan: 1 },
  ]},
  { title: 'Sim or ATD' },
  { title: 'Landings', subCols: [
    { title: 'All', colSpan: 2, rotate: true },
    { title: 'Day', colSpan: 2, rotate: true },
    { title: 'Night', colSpan: 2, rotate: true }
  ]},
  { title: 'Sim or ATD', subCols: [
    { title: 'XC' },
    { title: 'XC P2P' },
    { title: 'Night' },
    { title: 'Solo' },
    { title: 'PIC' },
    { title: 'SIC' },
    { title: 'Dual Recv.' },
    { title: 'Dual Given' },
  ]},
  { title: 'Remarks and Endorsements', colSpan: 15},
];

const SIGNATURE_SECTION_COLS = 6;
const DEFAULT_SPANS = 2;
const COL_WIDTH_REM = 1.25;

export const load = async ({ fetch, params, parent, url }) => {

  const name = await settings.get('general.name');

  const entryData = await prisma.leg.findMany({ take: 24, orderBy: [{ startTime_utc: 'asc' }, { relativeOrder: 'asc' }], include: {
    aircraft: { include: { type: true } },
    originAirport: true,
    destinationAirport: true,
    diversionAirport: true,
    _count: { select: { approaches: true } }
  } });

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
        dataColumnsOrdered.push(subCol.title);
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
      dataColumnsOrdered.push(descriptor.title);
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
  const calculateDataField = (dataColTitle: string, colSpan: number, data: typeof entryData[0]): Entry => {
    let entry: Entry = { colSpan: colSpan, text: '' };
    switch (dataColTitle) {
      case 'Date':
        entry.text = dateToDateStringFormSimple(data.startTime_utc, true)
        return entry;
      case 'Aircraft Type':
        entry.text = data.aircraft.type.typeCode;
        return entry;
      case 'Aircraft Ident':
        entry.text = data.ident ?? data.aircraft.registration;
        return entry;
      case 'From':
        entry.text = data.originAirport?.id ?? '';
        return entry;
      case 'To':
        if (data.diversionAirport !== null) entry.text = (data.destinationAirport?.id ?? '') + ' -> ' + (data.diversionAirport?.id ?? '');
        else entry.text = data.destinationAirport?.id ?? '';
        return entry;
      case 'Via':
        if (data.route !== null) {
          entry.text = data.route;
          if (data.route.split(' ').length > 1) entry.hover = data.route;
        }
        return entry;
      case 'Total':
        addTo(dataColTitle, data.totalTime);
        entry.text = data.totalTime.toFixed(1);
        return entry;
      case 'ASEL':
        if (data.aircraft.type.catClass === 'ASEL') {
          addTo(dataColTitle, data.totalTime);
          entry.text = data.totalTime.toFixed(1);
        }
        return entry;
      case 'AMEL':
        if (data.aircraft.type.catClass === 'AMEL') {
          addTo(dataColTitle, data.totalTime);
          entry.text = data.totalTime.toFixed(1);
        }
        return entry;
      case 'Inst':
        addTo(dataColTitle, data.actualInstrument);
        entry.text = data.actualInstrument.toFixed(1);
        return entry;
      case 'Sim Inst':
        addTo(dataColTitle, data.simulatedInstrument);
        entry.text = data.simulatedInstrument.toFixed(1);
        return entry;
      case '# A':
        addTo(dataColTitle, data._count.approaches);
        entry.text = data._count.approaches.toFixed(0);
        return entry;
      case '# H':
        addTo(dataColTitle, data.holds);
        entry.text = data.holds.toFixed(0);
        return entry;
      case 'Sim or ATD':
        if (data.aircraft.simulator === true) {
          addTo(dataColTitle, data.totalTime);
          entry.text = data.totalTime.toFixed(1);
        }
        return entry;
      case 'All': // Landings
        addTo(dataColTitle, (data.dayLandings + data.nightLandings));
        entry.text = (data.dayLandings + data.nightLandings).toFixed(0);
        return entry;
      case 'Day': // Landings
        addTo(dataColTitle, data.dayLandings);
        entry.text = data.dayLandings.toFixed(0);
        return entry;
      case 'Night': // Landings
        addTo(dataColTitle, data.nightLandings);
        entry.text = data.nightLandings.toFixed(0);
        return entry;
      case 'XC':
        addTo(dataColTitle, data.xc);
        entry.text = data.xc.toFixed(1);
        return entry;
      case 'XC P2P':
        addTo(dataColTitle, data.xc);
        entry.text = data.xc.toFixed(1);
        return entry;
      case 'Solo':
        addTo(dataColTitle, data.solo);
        entry.text = data.solo.toFixed(1);
        return entry;
      case 'PIC':
        addTo(dataColTitle, data.pic);
        entry.text = data.pic.toFixed(1);
        return entry;
      case 'SIC':
        addTo(dataColTitle, data.sic);
        entry.text = data.sic.toFixed(1);
        return entry;
      case 'Dual Recv.':
        addTo(dataColTitle, data.dualReceived);
        entry.text = data.dualReceived.toFixed(1);
        return entry;
      case 'Dual Given':
        addTo(dataColTitle, data.dualGiven);
        entry.text = data.dualGiven.toFixed(1);
        return entry;
      case 'Remarks and Endorsements':
        entry.text = data.notes;
        entry.textLeft = true;
        return entry;
      case '':
        return entry;
      default:
        throw new Error(`Unimplemented type: ${dataColTitle}`)
    }
  }

  const displayTotals = (dataColTitle: string, colSpan: number): Entry => {
    let entry: Entry = { colSpan: colSpan, text: '' };

    if (dataColTitle in summedData) {
      switch (dataColTitle) {
        case 'Total':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'ASEL':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'AMEL':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'Inst':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'Sim Inst':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case '# A':
          entry.text = summedData[dataColTitle].toFixed(0);
          return entry;
        case '# H':
          entry.text = summedData[dataColTitle].toFixed(0);
          return entry;
        case 'Sim or ATD':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'All': // Landings
          entry.text = summedData[dataColTitle].toFixed(0);
          return entry;
        case 'Day': // Landings
          entry.text = summedData[dataColTitle].toFixed(0);
          return entry;
        case 'Night': // Landings
          entry.text = summedData[dataColTitle].toFixed(0);
          return entry;
        case 'XC':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'XC P2P':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'Solo':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'PIC':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'SIC':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'Dual Recv.':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case 'Dual Given':
          entry.text = summedData[dataColTitle].toFixed(1);
          return entry;
        case '':
          return entry;
        default:
          throw new Error(`Unimplemented conversion type: ${dataColTitle}`)
      }
    }

    return entry;
    
  }

  const rows: Row[]  = [];
  let currentCol = 0;
  for (const entry of entryData) {
    let row: Row = [];
    for (const dataCol of dataColumnsOrdered) row.push(calculateDataField(dataCol, rawColSpans[currentCol++], entry));
    rows.push(row);
    currentCol = 0;
  }

  const totalsRows: Row[]  = [];
  for (let j = 0; j < 3; j++) {
    let row: Row = [];
    for (let i = signatureSectionColSpan.skipCols; i < dataColumnsOrdered.length; i++) {
      const dataCol = dataColumnsOrdered[i];
      console.log(dataCol);
      row.push(displayTotals(dataCol, rawColSpans[i]));
    }
    totalsRows.push(row);
  }


  return {
    name,
    dataDescriptor,
    numCols,
    rows,
    totalsRows,
    signatureSectionColSpan,
    SIGNATURE_SECTION_COLS,
    DEFAULT_SPANS,
    COL_WIDTH_REM,
  }
};