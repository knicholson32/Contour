import type { PageServerLoad } from "./$types";
import * as settings from "$lib/server/settings";
import prisma from "$lib/server/prisma";
import { Prisma } from "@prisma/client";
import { Debug } from "$lib/types/prisma.js";

const DAY_SECONDS = 60 * 60 * 24;
const TOL_LOOKBACK_DAYS = 90;
const IFR_LOOKBACK_MONTHS = 6;
const IFR_REQUIRED_APPROACHES = 6;
const IFR_REQUIRED_HOLDS = 1;

const legSelect = {
  id: true,
  aircraft: { select: { registration: true } },
  startTime_utc: true,
  dayTakeOffs: true,
  dayLandings: true,
  nightTakeOffs: true,
  nightLandings: true,
  approaches: { select: { id: true } },
  ipc: true,
  holds: true
} as const;

type LegSummary = Prisma.LegGetPayload<{ select: typeof legSelect }>;

type TOLCurrencyReport = {
  isCurrent: boolean;
  takeoffs: number;
  landings: number;
  currencyExpiry: number;
  entries: {
    affecting: LegSummary[];
    notAffecting: LegSummary[];
  };
};

type IFRCurrencyReport = {
  isCurrent: boolean;
  approaches: number;
  holds: number;
  ipc: LegSummary | null;
  currencyExpiry: number;
  entries: {
    affecting: LegSummary[];
    notAffecting: LegSummary[];
  };
};

type GeneralAndNightCurrency = {
  general: TOLCurrencyReport;
  night: TOLCurrencyReport;
};

const toUnixSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

const addDaysToUnix = (unixSeconds: number, days: number) =>
  unixSeconds + days * DAY_SECONDS;

const addUtcMonths = (date: Date, months: number) => {
  const shifted = new Date(date.getTime());
  shifted.setUTCMonth(shifted.getUTCMonth() + months);
  return shifted;
};

const startOfMonthUtc = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const buildTolCurrencyReport = (legs: LegSummary[]): GeneralAndNightCurrency => {
  const emptyReport = (): TOLCurrencyReport => ({
    isCurrent: false,
    takeoffs: 0,
    landings: 0,
    currencyExpiry: -1,
    entries: {
      affecting: [],
      notAffecting: []
    }
  });

  const report: GeneralAndNightCurrency = {
    general: emptyReport(),
    night: emptyReport()
  };

  for (const leg of legs) {
    const dayTakeoffs = leg.dayTakeOffs ?? 0;
    const dayLandings = leg.dayLandings ?? 0;
    const nightTakeoffs = leg.nightTakeOffs ?? 0;
    const nightLandings = leg.nightLandings ?? 0;

    const hasDayActivity = dayTakeoffs > 0 || dayLandings > 0;
    const hasNightActivity = nightTakeoffs > 0 || nightLandings > 0;
    const hasCurrencyActivity = hasDayActivity || hasNightActivity;

    if (hasCurrencyActivity) {
      report.general.takeoffs += dayTakeoffs + nightTakeoffs;
      report.general.landings += dayLandings + nightLandings;
      report.general.entries.affecting.push(leg);
    } else {
      report.general.entries.notAffecting.push(leg);
    }

    if (!report.general.isCurrent) {
      report.general.isCurrent =
        report.general.takeoffs >= 3 && report.general.landings >= 3;

      if (report.general.isCurrent && leg.startTime_utc !== null) {
        report.general.currencyExpiry = addDaysToUnix(
          leg.startTime_utc,
          TOL_LOOKBACK_DAYS
        );
      }
    }

    if (hasNightActivity) {
      report.night.takeoffs += nightTakeoffs;
      report.night.landings += nightLandings;
      report.night.entries.affecting.push(leg);
    } else {
      report.night.entries.notAffecting.push(leg);
    }

    if (!report.night.isCurrent) {
      report.night.isCurrent =
        report.night.takeoffs >= 3 && report.night.landings >= 3;

      if (report.night.isCurrent && leg.startTime_utc !== null) {
        report.night.currencyExpiry = addDaysToUnix(
          leg.startTime_utc,
          TOL_LOOKBACK_DAYS
        );
      }
    }
  }

  return report;
};

const buildIfrCurrencyReport = (legs: LegSummary[]): IFRCurrencyReport => {
  const report: IFRCurrencyReport = {
    isCurrent: false,
    approaches: 0,
    holds: 0,
    ipc: null,
    currencyExpiry: -1,
    entries: {
      affecting: [],
      notAffecting: []
    }
  };

  for (const leg of legs) {
    const approachCount = leg.approaches?.length ?? 0;
    const holdsCount = leg.holds ?? 0;
    const hasApproachActivity = approachCount > 0 || holdsCount > 0;

    if (leg.ipc) {
      report.isCurrent = true;
      report.ipc = leg;
      report.entries.affecting.push(leg);

      if (leg.startTime_utc !== null) {
        const expiry = addUtcMonths(
          new Date(leg.startTime_utc * 1000),
          IFR_LOOKBACK_MONTHS
        );
        report.currencyExpiry = toUnixSeconds(expiry);
      }
      break;
    }

    if (hasApproachActivity) {
      report.approaches += approachCount;
      report.holds += holdsCount;
      report.entries.affecting.push(leg);

      if (
        !report.isCurrent &&
        report.approaches >= IFR_REQUIRED_APPROACHES &&
        report.holds >= IFR_REQUIRED_HOLDS &&
        leg.startTime_utc !== null
      ) {
        report.isCurrent = true;
        const expiry = addUtcMonths(
          new Date(leg.startTime_utc * 1000),
          IFR_LOOKBACK_MONTHS
        );
        report.currencyExpiry = toUnixSeconds(expiry);
      }
    } else {
      report.entries.notAffecting.push(leg);
    }
  }

  return report;
};

// 61.57(a) counts three takeoffs and three landings independently; they need
// not fall on the same leg. Requiring both here would silently discard a leg
// that logged only one of the two, and its count with it.
const makeTolWhere = (
  base: Prisma.LegWhereInput,
  tolWindowStartSeconds: number
): Prisma.LegWhereInput => ({
  AND: [
    base,
    {
      OR: [
        { dayTakeOffs: { gt: 0 } },
        { nightTakeOffs: { gt: 0 } },
        { dayLandings: { gt: 0 } },
        { nightLandings: { gt: 0 } }
      ]
    },
    { startTime_utc: { gte: tolWindowStartSeconds } }
  ]
});

export const load: PageServerLoad = async () => {
  const now = new Date();
  const nowSeconds = toUnixSeconds(now);
  const tolWindowStartSeconds =
    nowSeconds - TOL_LOOKBACK_DAYS * DAY_SECONDS;
  const ifrWindowStart = startOfMonthUtc(addUtcMonths(now, -IFR_LOOKBACK_MONTHS));
  const ifrWindowStartSeconds = toUnixSeconds(ifrWindowStart);

  const debug = await settings.get("system.debug");

  const [aselLegs, amelLegs] = await Promise.all([
    prisma.leg.findMany({
      where: makeTolWhere(
        { aircraft: { type: { catClass: "ASEL" } } },
        tolWindowStartSeconds
      ),
      select: legSelect,
      orderBy: { startTime_utc: "desc" }
    }),
    prisma.leg.findMany({
      where: makeTolWhere(
        { aircraft: { type: { catClass: "AMEL" } } },
        tolWindowStartSeconds
      ),
      select: legSelect,
      orderBy: { startTime_utc: "desc" }
    })
  ]);

  const aselCurrency = buildTolCurrencyReport(aselLegs);
  const amelCurrency = buildTolCurrencyReport(amelLegs);

  const ifrLegs = await prisma.leg.findMany({
    where: {
      AND: [
        { aircraft: { type: { catClass: { in: ["ASEL", "AMEL", "ASES", "AMES"] } } } },
        { startTime_utc: { gte: ifrWindowStartSeconds } },
        {
          OR: [
            { holds: { gt: 0 } },
            { approaches: { some: {} } },
            { ipc: true }
          ]
        }
      ]
    },
    select: legSelect,
    orderBy: { startTime_utc: "desc" }
  });

  const ifrCurrency = buildIfrCurrencyReport(ifrLegs);

  const typeRatings = await prisma.aircraftType.findMany({
    where: {
      AND: [
        {
          OR: [
            { typeRatingRequired: true },
            { engine: { in: ["TF", "TJ", "TP", "TS"] } }
          ]
        },
        {
          NOT: {
            aircraft: { every: { simulator: true } }
          }
        }
      ]
    },
    orderBy: { typeCode: "asc" }
  });

  if (debug >= Debug.DEBUG) {
    console.log("Currency type ratings in scope:", typeRatings.length);
  }

  const types = await Promise.all(
    typeRatings.map(async (type) => {
      const legs = await prisma.leg.findMany({
        where: makeTolWhere(
          { aircraft: { type: { id: type.id } } },
          tolWindowStartSeconds
        ),
        select: legSelect,
        orderBy: { startTime_utc: "desc" }
      });

      return {
        type,
        ...buildTolCurrencyReport(legs)
      };
    })
  );

  return {
    nowSeconds,
    currency: {
      asel: aselCurrency,
      amel: amelCurrency,
      ifr: ifrCurrency,
      types
    }
  };
};
