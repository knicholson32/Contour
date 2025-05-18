import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import { Prisma } from '@prisma/client';
import { Debug } from '$lib/types/prisma.js';

export const load = async ({ fetch, params, parent, url }) => {

  const now = new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);

  const debug = await settings.get('system.debug');

  const legSelect = {
    aircraft: { select: { registration: true } },
    originAirportId: true,
    diversionAirportId: true,
    destinationAirportId: true,
    totalTime: true,
    startTime_utc: true,
    dayTakeOffs: true,
    dayLandings: true,
    nightTakeOffs: true,
    nightLandings: true,
    approaches: true,
    ipc: true,
    holds: true
  }

  type TOLCurrencyReport = {
    isCurrent: boolean,
    takeoffs: number,
    landings: number,
    currencyExpiry: number,
    entries: {
      notAffecting: Prisma.LegGetPayload<{ select: typeof legSelect }>[],
      affecting: Prisma.LegGetPayload<{ select: typeof legSelect }>[]
    }
  }

  type IFRCurrencyReport = {
    isCurrent: boolean,
    approaches: number,
    holds: number,
    ipc: Prisma.LegGetPayload<{ select: typeof legSelect }> | null
    currencyExpiry: number,
    entries: {
      notAffecting: Prisma.LegGetPayload<{ select: typeof legSelect }>[],
      affecting: Prisma.LegGetPayload<{ select: typeof legSelect }>[]
    }
  }

  type GeneralAndNightCurrency = {
    general: TOLCurrencyReport,
    night: TOLCurrencyReport
  }

  const calculateCurrency = (legs: Prisma.LegGetPayload<{ select: typeof legSelect }>[]) => {

    const currency: GeneralAndNightCurrency = {
      general: {
        isCurrent: false,
        takeoffs: 0,
        landings: 0,
        currencyExpiry: -1,
        entries: {
          notAffecting: [],
          affecting: []
        }
      },
      night: {
        isCurrent: false,
        takeoffs: 0,
        landings: 0,
        currencyExpiry: -1,
        entries: {
          notAffecting: [],
          affecting: []
        }
      }
    }

    for (const leg of legs) {
      if (leg.dayTakeOffs > 0 || leg.dayLandings > 0 || leg.nightTakeOffs > 0 || leg.nightTakeOffs > 0) {
        currency.general.takeoffs += leg.dayTakeOffs + leg.nightTakeOffs;
        currency.general.landings += leg.dayLandings + leg.nightLandings;
        currency.general.entries.affecting.push(leg);
      } else {
        currency.general.entries.notAffecting.push(leg);
      }

      // If we aren't current yet, check if that has changed
      if (!currency.general.isCurrent) {
        // Calculate if we are current yet
        currency.general.isCurrent = currency.general.landings >= 3 && currency.general.takeoffs >= 3;
        // Check if this entry made the difference
        if (currency.general.isCurrent) {
          // It did. This is the limiting factor, so use it to calculate how many days of currency are left
          currency.general.currencyExpiry = leg.startTime_utc === null ? -1 : leg.startTime_utc + (60 * 60 * 25 * 90);
        }
      }

      if (leg.nightTakeOffs > 0 || leg.nightTakeOffs > 0) {
        currency.night.takeoffs += leg.nightTakeOffs;
        currency.night.landings += leg.nightLandings;
        currency.night.entries.affecting.push(leg);
      } else {
        currency.night.entries.notAffecting.push(leg);
      }

      // If we aren't current yet, check if that has changed
      if (!currency.night.isCurrent) {
        // Calculate if we are current yet
        currency.night.isCurrent = currency.night.landings >= 3 && currency.night.takeoffs >= 3;
        // Check if this entry made the difference
        if (currency.night.isCurrent) {
          // It did. This is the limiting factor, so use it to calculate how many days of currency are left
          currency.night.currencyExpiry = leg.startTime_utc === null ? -1 : leg.startTime_utc + (60 * 60 * 25 * 90);
        }
      }
    }

    return currency;
  }

  const monthsAgo = (date: Date, months: number) => {
    date.setUTCMonth(date.getUTCMonth() - months);
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  const aselLegs = await prisma.leg.findMany({
    where: {
      AND: [
        { aircraft: { type: { catClass: 'ASEL' } } },
        {
          OR: [
            { dayTakeOffs: { gt: 0 } },
            { nightTakeOffs: { gt: 0 } },
          ]
        },
        {
          OR: [
            { dayLandings: { gt: 0 } },
            { nightLandings: { gt: 0 } },
          ]
        },
        { startTime_utc: { gte: nowSeconds - (60 * 60 * 24 * 90) } }
      ]
    },
    select: legSelect,
    orderBy: { startTime_utc: 'desc' }
  });
  const ASELCurrency = calculateCurrency(aselLegs);

  const amelLegs = await prisma.leg.findMany({
    where: {
      AND: [
        { aircraft: { type: { catClass: 'AMEL' } } },
        {
          OR: [
            { dayTakeOffs: { gt: 0 } },
            { nightTakeOffs: { gt: 0 } },
          ]
        },
        {
          OR: [
            { dayLandings: { gt: 0 } },
            { nightLandings: { gt: 0 } },
          ]
        },
        { startTime_utc: { gte: nowSeconds - (60 * 60 * 24 * 90) } }
      ]
    },
    select: legSelect,
    orderBy: { startTime_utc: 'desc' }
  });
  const AMELCurrency = calculateCurrency(amelLegs);



  const ifrCatClass = [
    'ASEL',
    'AMEL',
    'ASES',
    'AMES'
  ];
  
  const sixMonthsAgo = monthsAgo(new Date(now), 6);
  const ifr = await prisma.leg.findMany({
    where: {
      AND: [
        { aircraft: { type: { catClass: { in: ifrCatClass } } } },
        { startTime_utc: { gte: Math.floor(sixMonthsAgo.getTime() / 1000) } },
        { OR: [
          { holds: { gt: 0 } },
          { approaches: { some: {} } },
          { ipc: true },
        ]},
      ]
    },
    select: legSelect,
    orderBy: { startTime_utc: 'desc' }
  });


  const IFRCurrency: IFRCurrencyReport = {
    isCurrent: false,
    approaches: 0,
    holds: 0,
    ipc: null,
    currencyExpiry: -1,
    entries: {
      affecting: [],
      notAffecting: []
    }
  }


  for (const leg of ifr) {
    
    if (leg.ipc === true) {
      IFRCurrency.isCurrent = true;
      IFRCurrency.ipc = leg;
      IFRCurrency.entries.affecting.push(leg);
      if (leg.startTime_utc !== null) {
        const sixMonthsAfter = monthsAgo(new Date(leg.startTime_utc * 1000), -6);
        IFRCurrency.currencyExpiry = Math.floor(sixMonthsAfter.getTime() / 1000);
      }
      break;
    }

  }

  if (!IFRCurrency.isCurrent) {
    for (const leg of ifr) {
      if (leg.approaches.length > 0 || leg.holds > 0) {
        IFRCurrency.approaches += leg.approaches.length;
        IFRCurrency.holds += leg.holds;
        IFRCurrency.entries.affecting.push(leg);
      } else {
        IFRCurrency.entries.notAffecting.push(leg);
      }

      // If we aren't current yet, check if that has changed
      if (!IFRCurrency.isCurrent) {
        // Calculate if we are current yet
        IFRCurrency.isCurrent = IFRCurrency.approaches >= 6 && IFRCurrency.holds >= 1;
        // Check if this entry made the difference
        if (IFRCurrency.isCurrent) {
          if (debug >= Debug.VERY_VERBOSE) console.log(leg);
          // It did. This is the limiting factor, so use it to calculate how many days of currency are left
          if (leg.startTime_utc !== null) {
            const sixMonthsAfter = monthsAgo(new Date(leg.startTime_utc * 1000), -6);
            IFRCurrency.currencyExpiry = Math.floor(sixMonthsAfter.getTime() / 1000);
          }
        }
      }
    }
  }


  const typeRatings = await prisma.aircraftType.findMany({ 
    where: {
      AND: [
        { 
          OR: [
            { typeRatingRequired: true },
            { engine: { in: ['TF', 'TJ', 'TP', 'TS'] } }
          ]
        },
        { NOT: { aircraft: { every: { simulator: true } } } }
      ]
    }
  });

  if (debug >= Debug.DEBUG) console.log(typeRatings);

  const types: ({ type: Prisma.AircraftTypeGetPayload<{}>} & GeneralAndNightCurrency)[] = [];
  for (const typeRating of typeRatings) {
    const typeLegs = await prisma.leg.findMany({ 
      where: { 
        AND: [
          { aircraft: { type: { id: typeRating.id } } },
          {
            OR: [
              { dayTakeOffs: { gt: 0 } },
              { nightTakeOffs: { gt: 0 } },
            ]
          },
          {
            OR: [
              { dayLandings: { gt: 0 } },
              { nightLandings: { gt: 0 } },
            ]
          },
          { startTime_utc: { gte: nowSeconds - (60 * 60 * 24 * 90) } }
        ]
      },
      select: legSelect,
      orderBy: { startTime_utc: 'desc' }
    });

    const currency = calculateCurrency(typeLegs);

    types.push({
      type: typeRating,
      ...currency
    })

  }

  return {
    nowSeconds,
    currency: {
      asel: ASELCurrency,
      amel: AMELCurrency,
      ifr: IFRCurrency,
      types
    }
  };
};