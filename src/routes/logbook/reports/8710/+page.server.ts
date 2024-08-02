import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';

type FAA8710Row = {
  total: number,
  instructionReceived: number,
  solo: number,
  pic: number,
  sic: number,
  xc: {
    instructionReceived: number,
    solo: number,
    pic: number,
    sic: number,
  },
  instrument: number,
  night: {
    tolTotal: number,
    instructionReceived: number,
    pic: number,
    sic: number,
    picTol: number,
    sicTol: number,
  },
  number: {
    flights: number,
    aeroTows: number,
    groundLaunches: number,
    poweredLaunches: number
  }
}

const generateEmpty8710Row = (): FAA8710Row => {
  return {
    total: 0,
    instructionReceived: 0,
    solo: 0,
    pic: 0,
    sic: 0,
    xc: {
      instructionReceived: 0,
      solo: 0,
      pic: 0,
      sic: 0,
    },
    instrument: 0,
    night: {
      instructionReceived: 0,
      tolTotal: 0,
      pic: 0,
      sic: 0,
      picTol: 0,
      sicTol: 0,
    },
    number: {
      flights: 0,
      aeroTows: 0,
      groundLaunches: 0,
      poweredLaunches: 0
    }
  }
}

type FAA8710RowSim = {
  total: number,
  instructionReceived: number,
  instrument: number,
  night: {
    instructionReceived: number,
    total: number,
    tol: number,
  },
  number: {
    flights: number,
    aeroTows: number,
    groundLaunches: number,
    poweredLaunches: number
  }
}

const generateEmpty8710RowSim = (): FAA8710RowSim => {
  return {
    total: 0,
    instructionReceived: 0,
    instrument: 0,
    night: {
      instructionReceived: 0,
      total: 0,
      tol: 0,
    },
    number: {
      flights: 0,
      aeroTows: 0,
      groundLaunches: 0,
      poweredLaunches: 0
    }
  }
}

const getSim = async (type: 'FFS' | 'FTD' | 'ATD') => {
  const row = generateEmpty8710RowSim();

  { // Other Times ----------------------------------------------------------
    const result = await prisma.leg.aggregate({
      where: {
        AND: [
          { aircraft: { simulator: true } },
          { aircraft: { simulatorType: type } },
          // { startTime_utc: { lt: 1705381200 } }
        ]
      },
      _sum: {
        totalTime: true,
        dualReceived: true,
        actualInstrument: true,
        simulatedInstrument: true,
        nightLandings: true,
        nightTakeOffs: true,
        night: true
      }
    });

    row.total += result._sum.totalTime ?? 0;
    row.instructionReceived += result._sum.dualReceived ?? 0;
    row.instrument += result._sum.actualInstrument ?? 0;
    row.instrument += result._sum.simulatedInstrument ?? 0;
    if (type === 'FFS' || type === 'FTD') {
      row.night.total += result._sum.night ?? 0;
      row.night.instructionReceived += Math.min(result._sum.dualReceived ?? 0, result._sum.night ?? 0);
    }

    if (type === 'FFS') {
      row.night.tol += Math.min(result._sum.nightLandings ?? 0, result._sum.nightTakeOffs ?? 0);
    }

  }

  return row;
}

const getCategoryClass = async (catClass: string[]): Promise<FAA8710Row> => {
  const row = generateEmpty8710Row();

  { // Night Flight ---------------------------------------------------------
    const nightLegs = await prisma.leg.findMany({
      where: {
        AND: [
          { night: { gt: 0 } },
          { aircraft: { type: { catClass: { in: catClass } } } },
          { aircraft: { simulator: false } },
          // { startTime_utc: { lt: 1705381200 } }
        ]
      },
      select: { totalTime: true, pic: true, sic: true, night: true, nightLandings: true, nightTakeOffs: true, dualReceived: true }
    });

    for (const cur of nightLegs) {
      row.night.pic += Math.min(cur.pic, cur.night);
      row.night.sic += Math.min(cur.sic, cur.night);
      row.night.tolTotal += cur.nightLandings;
      if (Math.min(cur.pic, cur.night) > 0) row.night.picTol += cur.nightLandings;
      else if (Math.min(cur.sic, cur.night) > 0) row.night.sicTol += cur.nightLandings;
      row.night.instructionReceived += Math.min(cur.dualReceived, cur.night);
    }
  }

  { // Instrument Flight ----------------------------------------------------
    const v = await prisma.leg.aggregate({
      where: { 
        AND: [
          { aircraft: { type: { catClass: { in: catClass } } } },
          { aircraft: { simulator: false } },
          // { startTime_utc: { lt: 1705381200 } }
        ],
      },
      _sum: { simulatedInstrument: true, actualInstrument: true },
    });
    row.instrument += (v._sum.actualInstrument ?? 0) + (v._sum.simulatedInstrument ?? 0);
  }

  { // Cross-Country Flight -------------------------------------------------
    (await prisma.leg.findMany({
      where: { 
        AND: [
          { aircraft: { type: { catClass: { in: catClass } } } },
          { aircraft: { simulator: false } },
          { xc: { gt: 0 } },
          // { startTime_utc: { lt: 1705381200 } }
        ]
      },
      select: { xc: true, pic: true, sic: true, solo: true, dualReceived: true }
    })).forEach((cur) => {
      row.xc.instructionReceived += Math.min(cur.xc, cur.dualReceived);
      row.xc.solo += Math.min(cur.xc, cur.solo);
      row.xc.pic += Math.min(cur.xc, cur.pic);
      row.xc.sic += Math.min(cur.xc, cur.sic);
    });
  }

  { // Other Times ----------------------------------------------------------
    (await prisma.leg.findMany({
      where: {
        AND: [
          { aircraft: { type: { catClass: { in: catClass } } } },
          { aircraft: { simulator: false } },
          // { startTime_utc: { lt: 1705381200 } }
        ]
      },
      select: {
        totalTime: true,
        pic: true,
        sic: true,
        dualReceived: true,
        solo: true,
        passengers: true
      }
    })).forEach((cur) => {
      row.pic += cur.pic;
      row.sic += cur.sic;
      row.total += cur.totalTime;
      row.instructionReceived += cur.dualReceived;
      row.solo += Math.min(cur.solo, cur.totalTime);
    });

  }


  return row;
}

const getClassHours = async () => {
  const hours =  {
    airplane: {
      sel: {
        pic: 0,
        sic: 0
      },
      ses: {
        pic: 0,
        sic: 0
      },
      mel: {
        pic: 0,
        sic: 0
      },
      mes: {
        pic: 0,
        sic: 0
      }
    },
    rc: {
      hel: 0,
      gyro: 0
    },
    lta: {
      balloon: 0,
      airship: 0,
    },
    sim: {
      ffs: {
        me: 0,
        se: 0,
        hel: 0
      },
      ftd: {
        me: 0,
        se: 0,
        hel: 0
      },
      atd: {
        me: 0,
        se: 0,
        hel: 0
      }
    }
  };

  { // ASEL
    const result = await prisma.leg.aggregate({
      where: {
        AND: [
          { aircraft: { type: { catClass: { in: ['ASEL'] } } } }
        ]
      },
      _sum: {
        pic: true,
        sic: true
      }
    });
    hours.airplane.sel.pic = result._sum.pic ?? 0;
    hours.airplane.sel.sic = result._sum.sic ?? 0;
  }

  { // AMEL
    const result = await prisma.leg.aggregate({
      where: {
        AND: [
          { aircraft: { type: { catClass: { in: ['AMEL'] } } } }
        ]
      },
      _sum: {
        pic: true,
        sic: true
      }
    });
    hours.airplane.mel.pic = result._sum.pic ?? 0;
    hours.airplane.mel.sic = result._sum.sic ?? 0;
  }

  { // ASES
    const result = await prisma.leg.aggregate({
      where: {
        AND: [
          { aircraft: { type: { catClass: { in: ['ASES'] } } } }
        ]
      },
      _sum: {
        pic: true,
        sic: true
      }
    });
    hours.airplane.ses.pic = result._sum.pic ?? 0;
    hours.airplane.ses.sic = result._sum.sic ?? 0;
  }

  { // AMES
    const result = await prisma.leg.aggregate({
      where: {
        AND: [
          { aircraft: { type: { catClass: { in: ['AMES'] } } } }
        ]
      },
      _sum: {
        pic: true,
        sic: true
      }
    });
    hours.airplane.mes.pic = result._sum.pic ?? 0;
    hours.airplane.mes.sic = result._sum.sic ?? 0;
  }

  { // RH
    const result = await prisma.leg.aggregate({
      where: {
        AND: [
          { aircraft: { type: { catClass: { in: ['RH'] } } } }
        ]
      },
      _sum: {
        pic: true,
        sic: true
      }
    });
    hours.rc.hel = (result._sum.pic ?? 0) + (result._sum.sic ?? 0);
  }

  { // RG
    const result = await prisma.leg.aggregate({
      where: {
        AND: [
          { aircraft: { type: { catClass: { in: ['RG'] } } } }
        ]
      },
      _sum: {
        pic: true,
        sic: true
      }
    });
    hours.rc.gyro = (result._sum.pic ?? 0) + (result._sum.sic ?? 0);
  }

  { // LA
    const result = await prisma.leg.aggregate({
      where: {
        AND: [
          { aircraft: { type: { catClass: { in: ['LA'] } } } }
        ]
      },
      _sum: {
        pic: true,
        sic: true
      }
    });
    hours.lta.airship = (result._sum.pic ?? 0) + (result._sum.sic ?? 0);
  }

  { // LB
    const result = await prisma.leg.aggregate({
      where: {
        AND: [
          { aircraft: { type: { catClass: { in: ['LB'] } } } }
        ]
      },
      _sum: {
        pic: true,
        sic: true
      }
    });
    hours.lta.balloon = (result._sum.pic ?? 0) + (result._sum.sic ?? 0);
  }

  { // FFS
    const result = await prisma.leg.findMany({
      where: {
        AND: [
          { aircraft: { simulator: true } },
          { aircraft: { simulatorType: 'FFS' } }
        ]
      },
      select: {
        aircraft: { select: { type: { select: { catClass: true } } } },
        totalTime: true
      }
    });

    for (const cur of result) {
      if (cur.aircraft.type.catClass === 'ASEL') hours.sim.ffs.se += cur.totalTime;
      else if (cur.aircraft.type.catClass === 'AMEL') hours.sim.ffs.me += cur.totalTime;
      else if (cur.aircraft.type.catClass === 'RH') hours.sim.ffs.hel += cur.totalTime;
    }
  }

  { // FTD
    const result = await prisma.leg.findMany({
      where: {
        AND: [
          { aircraft: { simulator: true } },
          { aircraft: { simulatorType: 'FTD' } }
        ]
      },
      select: {
        aircraft: { select: { type: { select: { catClass: true } } } },
        totalTime: true
      }
    });

    for (const cur of result) {
      if (cur.aircraft.type.catClass === 'ASEL') hours.sim.ftd.se += cur.totalTime;
      else if (cur.aircraft.type.catClass === 'AMEL') hours.sim.ftd.me += cur.totalTime;
      else if (cur.aircraft.type.catClass === 'RH') hours.sim.ftd.hel += cur.totalTime;
    }
  }

  { // ATD
    const result = await prisma.leg.findMany({
      where: {
        AND: [
          { aircraft: { simulator: true } },
          { aircraft: { simulatorType: 'ATD' } }
        ]
      },
      select: {
        aircraft: { select: { type: { select: { catClass: true } } } },
        totalTime: true
      }
    });

    for (const cur of result) {
      if (cur.aircraft.type.catClass === 'ASEL') hours.sim.atd.se += cur.totalTime;
      else if (cur.aircraft.type.catClass === 'AMEL') hours.sim.atd.me += cur.totalTime;
      else if (cur.aircraft.type.catClass === 'RH') hours.sim.atd.hel += cur.totalTime;
    }
  }


  return hours;

}

export const load = async ({ fetch, params, parent, url }) => {

  // TODO: Remove this auto-mod after it has been ran for the databases in the field
  const mx = await settings.get('entry.entryMXMode');
  if (mx) {
    const soloLegs = await prisma.leg.findMany({ where: { solo: { gt: 0 } }, select: { id: true, solo: true, totalTime: true } });
    for (const leg of soloLegs) {
      if (leg.solo > leg.totalTime) {
        await prisma.leg.update({ where: { id: leg.id }, data: { solo: leg.totalTime }});
      }
    }

    await prisma.aircraft.updateMany({
      where: {
        AND: [
          { simulator: true },
          { simulatorType: null }
        ]
      },
      data: {
        simulatorType: 'ATD'
      }
    });

  }


  return {
    airplane: await getCategoryClass(['ASEL', 'AMEL', 'ASES', 'AMES']),
    rc: await getCategoryClass(['RH', 'RG']),
    pl: await getCategoryClass(['PLIFT', 'PL', 'PS', 'WL', 'WS']),
    glider: await getCategoryClass(['GL']),
    lta: await getCategoryClass(['LA', 'LB']),
    ffs: await getSim('FFS'),
    ftd: await getSim('FTD'),
    atd: await getSim('ATD'),
    classHours: await getClassHours(),
    total: (await prisma.leg.aggregate({ where: { aircraft: { simulator: false } }, _sum: { totalTime: true } }))._sum.totalTime ?? 0,
    legs: await prisma.leg.count(),
    name: await settings.get('general.name')
  }

};