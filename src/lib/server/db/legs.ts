
import * as Airports from '$lib/server/db/airports';
import * as Positions from '$lib/server/db/positions';
import * as Fixes from '$lib/server/db/fixes';
import prisma from '$lib/server/prisma';
import type * as Types from '@prisma/client';
import * as aero from '$lib/server/api/flightaware';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_START_OFFSET = 10 * 24 * 60 * 60 * 1; // 10 days

// ------------------------------------------------------------------------------------------------
// Commands
// ------------------------------------------------------------------------------------------------

/**
 * Create a flight
 * @returns the flight if it was added
 */
// export const finalizeFlight = async (dayId: number, aeroAPIKey: string, option: Types.Option): Promise<Types.Leg> => {
//     console.log('finalize flight', option);
//     // Resolve airports
//     await Airports.addIfDoesNotExist(option.originAirportId, aeroAPIKey);
//     await Airports.addIfDoesNotExist(option.destinationAirportId, aeroAPIKey);
//     if (option.diverted && option.diversionAirportId !== null && option.diversionAirportId !== undefined) await Airports.addIfDoesNotExist(option.diversionAirportId, aeroAPIKey);

//     // Check if this flight exists in the DB already
//     const search = await prisma.leg.findUnique({ where: { faFlightId: option.faFlightId }});
//     if (search !== null) {
//         console.log('DUPLICATE ENTRY: Flight', option.faFlightId, 'already exists in DB');
//         return search;
//     }


//     // Create a flight
//     const leg: Types.Leg = {
//         id: uuidv4(),
//         dayId: dayId,
//         faFlightId: option.faFlightId,
//         ident: option.ident,
//         operator: option.operator,
//         flightNumber: option.flightNumber,
//         registration: option.registration,
//         inboundFaFlightId: option.inboundFaFlightId,
//         blocked: option.blocked,
//         cancelled: option.cancelled,
//         diverted: option.diverted,
//         positionOnly: option.positionOnly,
//         originAirportId: option.originAirportId,
//         destinationAirportId: option.destinationAirportId,
//         diversionAirportId: option.diversionAirportId,
//         departureDelay: option.departureDelay,
//         arrivalDelay: option.arrivalDelay,
//         filedEte: option.filedEte,
//         progressPercent: option.progressPercent,
//         status: option.status,
//         aircraftType: option.aircraftType,
//         routeDistance: option.routeDistance,
//         filedAirspeed: option.filedAirspeed,
//         filedAltitude: option.filedAltitude,
//         filedRoute: option.filedRoute,
//         seatsCabinBusiness: option.seatsCabinBusiness,
//         seatsCabinCoach: option.seatsCabinCoach,
//         seatsCabinFirst: option.seatsCabinFirst,
//         gateOrigin: option.gateOrigin,
//         gateDestination: option.gateDestination,
//         terminalOrigin: option.terminalOrigin,
//         terminalDestination: option.terminalDestination,
//         type: option.type,
//         scheduledOut: option.scheduledOut,
//         scheduledOff: option.scheduledOff,
//         actualOut: option.actualOut,
//         actualOff: option.actualOff,
//         scheduledIn: option.scheduledIn,
//         scheduledOn: option.scheduledOn,
//         actualIn: option.actualIn,
//         actualOn: option.actualOn,

//         startTime: option.startTime,
//         endTime: option.endTime
//     };

//     // Capture positions
//     // If this flight didn't have good timing info, use the timing info from the positions
//     if (option.inaccurateTiming) {
//         // Get the track and route data from AeroAPI
//         const track = await aero.getFlightTrack(leg.faFlightId, aeroAPIKey);
//         const route = await aero.getFlightRoute(leg.faFlightId, aeroAPIKey);
//         // Get the timing info from the positions
//         const flightTiming = Positions.getFlightTimings(track.positions);
//         if (flightTiming !== undefined) {
//             // Assign the new times
//             leg.startTime = flightTiming.start_time;
//             leg.endTime = flightTiming.end_time;
//         }
//         // Insert the flight
//         await prisma.leg.create({ data: leg });
//         // Store the positions
//         await Positions.storePositions(track.positions, leg.id);
//         // Store the route fixes
//         await Fixes.storeFixes(route.fixes, leg.id);
//     } else {
//         // Insert the flight
//         await prisma.leg.create({ data: leg });
//         // Get the track and route data from AeroAPI
//         // Store the positions
//         const track = await aero.getFlightTrack(leg.faFlightId, aeroAPIKey);
//         await Positions.storePositions(track.positions, leg.id);
//         // Store the route fixes
//         const route = await aero.getFlightRoute(leg.faFlightId, aeroAPIKey);
//         await Fixes.storeFixes(route.fixes, leg.id);

//     }
//     // Return the leg
//     return leg;
// }

/**
 * Get a flight based on the flight ID
 * @param id the flight to get
 * @returns the flight or undefined
 */
export const getFlight = async (id: string): Promise<Types.Leg | undefined> => {
    try {
        return await prisma.leg.findUniqueOrThrow({ where: { id } });
    } catch (e) {
        return undefined;
    }
}

/**
 * Get flights associated with an account
 * @param confirmed if included, only get flights with the confirmed status (true or false)
 * @returns an array of the flights
 */
export type GetFlightsOptions = { start_time?: number, end_time?: number };
export const getFlights = async (options: GetFlightsOptions): Promise<Types.Leg[]> => {
    // Calculate start and end times
    if (options.start_time === undefined) options.start_time = Math.floor(Date.now() / 1000) - DEFAULT_START_OFFSET;
    if (options.end_time === undefined) options.end_time = Math.floor(Date.now() / 1000);

    return await prisma.leg.findMany({
        where: {
            AND: [
                { startTime_utc: { gte: options.start_time } },
                { endTime_utc: { lte: options.end_time } }
            ]
        }
    });
}