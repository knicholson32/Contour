import { pad, timeConverter } from '$lib/helpers';
import prisma from '$lib/server/prisma';
import { API, DB } from '$lib/types';
import type { Prisma } from '@prisma/client';
import * as fs from 'node:fs';
import tmp from 'tmp';
tmp.setGracefulCleanup();

// ------------------------------------------------------------------------------------------
// Endpoints
// ------------------------------------------------------------------------------------------

const endLogger = async (logger: fs.WriteStream) => {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => {
      reject('timeout');
    }, 500);
    try {
      logger.end(() => {
        clearTimeout(t);
        resolve();
      });
    } catch (e) {
      clearTimeout(t);
      reject(e);
    }
  })
}

const MAX_COL = 54;
const padTo = (str: string, num = MAX_COL) => {
  const numCols = str.split(',').length;
  console.log('nc',numCols);
  if (num - numCols < 0) return str;
  return str + ','.repeat(num - numCols);
}

export const GET = async ({ setHeaders }) => {

  try {
    const tmpobj = tmp.fileSync();
    console.log('File: ', tmpobj.name);
    console.log('Filedescriptor: ', tmpobj.fd);

    const logger = fs.createWriteStream(tmpobj.name, { flags: 'a' });

    try {

      

      // Write the header rows
      logger.write(padTo('ForeFlight Logbook Import') + '\n' + padTo('') + '\n');

      // Aircraft Table
      logger.write(padTo('Aircraft Table') + '\n');
      logger.write(padTo('Text,Text,Text,YYYY,Text,Text,Text,Text,Text,Text,Boolean,Boolean,Boolean,Boolean') + '\n');
      logger.write(padTo('AircraftID,EquipmentType,TypeCode,Year,Make,Model,Category,Class,GearType,EngineType,Complex,HighPerformance,Pressurized,TAA') + '\n');

      // ------- Get aircraft

      // Init variables to keep track of where we are in the AC list
      let typeCount = await prisma.aircraftType.count();
      let lastId: string | null = null;
      while (typeCount > 0) {
        // Get the next batch of types
        let types: Prisma.AircraftTypeGetPayload<{}>[] = [];
        if (lastId === null) types = await prisma.aircraftType.findMany({ take: 100, orderBy: { id: 'asc' } });
        else types = await prisma.aircraftType.findMany({ take: 100, cursor: { id: lastId }, orderBy: { id: 'asc' } });

        // If there are no types, we are done
        if (types.length === 0) break;

        // Loop through the types
        for (const t of types) {
          // Init variables to keep track of where we are in the AC list
          let acCount = await prisma.aircraft.count();
          let lastACId: string | null = null;

          // Loop as long as there are aircraft to fetch
          while (acCount > 0) {
            // Get the next batch of aircraft
            let aircraft: Prisma.AircraftGetPayload<{}>[] = [];
            if (lastACId === null) aircraft = await prisma.aircraft.findMany({ take: 100, orderBy: { id: 'asc' } });
            else aircraft = await prisma.aircraft.findMany({ take: 100, cursor: { id: lastACId }, orderBy: { id: 'asc' } });

            // If there are no aircraft, we are done
            if (aircraft.length === 0) break;

            // Loop through the aircraft
            for (const a of aircraft) {
              // Record the aircraft entry
              const catClass = DB.categoryClassToExport(t.catClass as DB.CategoryClass);
              logger.write(`${a.registration},aircraft,${t.typeCode},${a.year ?? ''},${t.make},${t.model},${catClass?.category ?? ''},${catClass?.class ?? ''},${DB.gearTypeToExport(t.gear as DB.GearType) ?? ''},${DB.engineTypeToString(t.engine as DB.EngineType)},${t.complex ? 'TRUE' : 'FALSE'},${t.highPerformance ? 'TRUE' : 'FALSE'},${t.pressurized ? 'TRUE' : 'FALSE'},${t.taa ? 'TRUE' : 'FALSE'},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n`);
            }

            // Update the tracking variables
            lastACId = aircraft[aircraft.length - 1].id;
            acCount -= aircraft.length;
          }
        }

        // Update the tracking variables
        lastId = types[types.length - 1].id;
        typeCount -= types.length;
      }


      logger.write(padTo('') + '\n' + padTo('Flights Table') + '\n');
      logger.write(padTo('Date,Text,Text,Text,Text,hhmm,hhmm,hhmm,hhmm,hhmm,hhmm,Decimal,Decimal,Decimal,Decimal,Decimal,Decimal,Decimal,Number,Number,Number,Number,Number,Decimal,Decimal,Decimal,Decimal,Decimal,Decimal,Number,Packed Detail,Packed Detail,Packed Detail,Packed Detail,Packed Detail,Packed Detail,Decimal,Decimal,Decimal,Decimal,Text,Text,Packed Detail,Packed Detail,Packed Detail,Packed Detail,Packed Detail,Packed Detail,Boolean,Boolean,Boolean,Boolean,Boolean,Text') + '\n');
      logger.write(padTo('Date,AircraftID,From,To,Route,TimeOut,TimeOff,TimeOn,TimeIn,OnDuty,OffDuty,TotalTime,PIC,SIC,Night,Solo,CrossCountry,Distance,DayTakeoffs,DayLandingsFullStop,NightTakeoffs,NightLandingsFullStop,AllLandings,ActualInstrument,SimulatedInstrument,HobbsStart,HobbsEnd,TachStart,TachEnd,Holds,Approach1,Approach2,Approach3,Approach4,Approach5,Approach6,DualGiven,DualReceived,SimulatedFlight,GroundTraining,InstructorName,InstructorComments,Person1,Person2,Person3,Person4,Person5,Person6,FlightReview,Checkride,IPC,NVGProficiency,FAA6158,PilotComments') + '\n');


      // ------- Get entries

      // Init variables to keep track of where we are in the AC list
      let legCount = await prisma.leg.count();
      let lastLegId: string | null = null;
      const TAKE_LEG = 50;
      while (legCount > 0) {
        // Get the next batch of types
        let legs: Prisma.LegGetPayload<{ include: { approaches: true, aircraft: { select: { registration: true, simulator: true }}}}>[] = [];
        if (lastLegId === null) legs = await prisma.leg.findMany({ include: { approaches: true, aircraft: { select: { registration: true, simulator: true } } }, take: TAKE_LEG, orderBy: { id: 'asc' } });
        else legs = await prisma.leg.findMany({ include: { approaches: true, aircraft: { select: { registration: true, simulator: true } } }, take: TAKE_LEG, cursor: { id: lastLegId }, orderBy: { id: 'asc' } });

        // If there are no types, we are done
        if (legs.length === 0) break;

        // Loop through the types
        for (const l of legs) {
      
          const data: string[] = [];

          // Date
          data.push(l.startTime_utc === null ? '' : timeConverter(l.startTime_utc, { dateOnly: true, shortYear: true }));
          // AircraftID
          data.push(l.aircraft.registration);
          // From
          data.push(l.originAirportId);
          // To
          if (l.diversionAirportId === null) data.push(l.destinationAirportId);
          else data.push(l.diversionAirportId);
          // Route
          data.push('');
          // TimeOut
          data.push('');
          // TimeOff
          data.push('');
          // TimeOn
          data.push('');
          // TimeIn
          data.push('');
          // OnDuty
          data.push('');
          // OffDuty
          data.push('');
          // TotalTime
          data.push(l.totalTime.toFixed(1));
          // PIC
          data.push(l.pic.toFixed(1));
          // SIC
          data.push(l.sic.toFixed(1));
          // Night
          data.push(l.night.toFixed(1));
          // Solo
          data.push(l.solo.toFixed(1));
          // CrossCountry
          data.push(l.xc.toFixed(1));
          // Distance // TODO: Calculate this from positions if they exist
          data.push('0');
          // DayTakeoffs
          data.push(l.dayTakeOffs.toFixed(0));
          // DayLandingsFullStop
          data.push(l.dayLandings.toFixed(0));
          // NightTakeoffs
          data.push(l.nightTakeOffs.toFixed(0));
          // NightLandingsFullStop
          data.push(l.nightLandings.toFixed(0));
          // AllLandings
          data.push((l.dayLandings + l.nightLandings).toFixed(0));
          // ActualInstrument
          data.push(l.actualInstrument.toFixed(1));
          // SimulatedInstrument
          data.push(l.simulatedInstrument.toFixed(1));
          // HobbsStart
          data.push('');
          // HobbsEnd
          data.push('');
          // TachStart
          data.push('');
          // TachEnd
          data.push('');
          // Holds
          data.push(l.holds.toFixed(0));
          // Approaches
          for (let i = 0; i < l.approaches.length && i < 6; i++) {
            const approach = l.approaches[i];
            data.push(`1;${approach.type};${approach.runway};${approach.airportId};${approach.notes ?? ''}`);
          }
          for (let i = 0; i < 6 - l.approaches.length; i++) data.push('');
          // DualGiven
          data.push(l.dualGiven.toFixed(1));
          // DualReceived
          data.push(l.dualReceived.toFixed(1));
          // SimulatedFlight
          if (l.aircraft.simulator === true) data.push(l.totalTime.toFixed(1));
          else data.push('0.0');
          // GroundTraining
          data.push('0.0');
          // InstructorName
          data.push('');
          // InstructorComments
          data.push('');
          // Person
          for (let i = 0; i < 6; i++) data.push('');
          // FlightReview
          data.push(l.flightReview ? 'TRUE' : 'FALSE');
          // Checkride
          data.push(l.checkride ? 'TRUE' : 'FALSE');
          // IPC
          data.push(l.ipc ? 'TRUE' : 'FALSE');
          // NVGProficiency
          data.push('FALSE');
          // FAA6158
          data.push(l.faa6158 ? 'TRUE' : 'FALSE');
          // PilotComments
          data.push(l.notes);

          console.log(data.length);

          logger.write(padTo(data.join(',')) + '\n');

        }

        // Update the tracking variables
        lastLegId = legs[legs.length - 1].id;
        legCount -= legs.length;
      }

      // Close the CSV
      await endLogger(logger);

      // Stream the CSV
      try {
        const stat = fs.statSync(tmpobj.name);
        const readStream = fs.createReadStream(tmpobj.name);

        const now = new Date();
        const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}-${pad(now.getHours(), 2)}_${pad(now.getMinutes(), 2)}_${pad(now.getSeconds(), 2)}`;

        setHeaders({
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment;filename=logbook_${nowStr}.csv`,
          'Cache-Control': 'max-age=60',
          'Content-Length': stat.size.toString()
        });

        // NOTE: This is NOT a correct typecast. This works, but typescript doesn't agree.
        // https://kit.svelte.dev/docs/routing#server
        return new Response(readStream as unknown as string);

      } catch (e) {
        await endLogger(logger);
        return API.response._404();
      }

    } catch (e) {
      await endLogger(logger);
      return API.response.serverError(e);
    }
  } catch (e) {
    return API.response.serverError(e);
  }




  // try {
  //   setHeaders({
  //     'Content-Type': (format === 'avif' ? 'image/avif' : 'image/jpeg'),
  //     'Content-Length': exp.length.toString(),
  //     'Cache-Control': 'max-age=60'
  //   });
  //   return new Response(exp);
  // } catch (e) {
  //   return API.response.serverError(e);
  // }

  return new Response('ok');
};
