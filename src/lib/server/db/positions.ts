import type * as aero from '$lib/server/api/flightaware';
import prisma from '$lib/server/prisma';
import type * as Types from '@prisma/client';
import crypto from 'node:crypto';
import { DB } from '$lib/types';

// ------------------------------------------------------------------------------------------------
// DB Tools
// ------------------------------------------------------------------------------------------------

/**
 * Convert from the AeroAPI format to the format saved to the database
 * @param position the AeroAPI Position object
 * @param legID the leg ID
 * @returns the DB format of the data
 */
export const aeroToDB = (position: aero.schema.Position, legID: string): Types.Position => {

    // Convert the aero API altitude change options to a format the DB will use
    let altitudeChange;
    switch(position.altitude_change) {
        case "C":
            altitudeChange = DB.AltitudeChange.CLIMBING
            break;
        case "D":
            altitudeChange = DB.AltitudeChange.DESCENDING
            break;
        case "-":
            altitudeChange = DB.AltitudeChange.LEVEL
            break;
        default:
            altitudeChange = DB.AltitudeChange.UNKNOWN
            break;
    }

    // Convert the aero API update type options to a format the DB will use
    let updateType;
    switch(position.update_type) {
        case 'P': // P = projected
            updateType = DB.UpdateType.PROJECTED;
            break;
        case 'O': // O = oceanic
            updateType = DB.UpdateType.OCEANIC;
            break;
        case 'Z': // Z = radar
            updateType = DB.UpdateType.RADAR;
            break;
        case 'A': // A = ADS-B
            updateType = DB.UpdateType.ADSB;
            break;
        case 'M': // M = multilateration
            updateType = DB.UpdateType.MULTILATERATION;
            break;
        case 'D': // D = datalink
            updateType = DB.UpdateType.DATALINK;
            break;
        case 'X': // X = surface and near surface(ADS - B and ASDE - X)
            updateType = DB.UpdateType.ADSB_ASDEX;
            break;
        case 'S': // S = space - based
            updateType = DB.UpdateType.SPACE;
            break;
        default:
            updateType = DB.UpdateType.UNKNOWN;
    }

    const pos: Types.Position = {
        legId: legID,
        altitude: Math.round(position.altitude),
        altitudeChange: altitudeChange,
        groundspeed: Math.round(position.groundspeed),
        heading: Math.round(position.heading),
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: Math.round(new Date(position.timestamp).getTime() / 1000),
        updateType: updateType
    };
    return pos;
};


// ------------------------------------------------------------------------------------------------
// Commands
// ------------------------------------------------------------------------------------------------

/**
 * Store an array of AeroAPI positions
 * @param positions the array of AeroAPI positions to store
 * @param legID the flight ID to associate this positions with
 */
export const storePositions = async (positions: aero.schema.Position[], legID: string): Promise<void> => {

    // Delete any positions that might already be associated with this flight
    await deletePositions(legID);

    // Create some arrays to hold the inserts and hashes created in the loop
    const inserts: Types.Prisma.PrismaPromise<any>[] = [];
    const pointHashes: string[] = [];

    // Loop through each position
    for (const pos of positions) {
        // Create a hash of the leg ID, timestamp, and lat/long. These together must be unique, so make a hash so we can ensure there isn't a collision
        const hash = crypto.createHash('md5').update(`${legID}.${pos.timestamp}.${pos.latitude.toFixed(4)}.${pos.longitude.toFixed(4)}`).digest('hex');
        // If this point already exists, skip it
        if (pointHashes.includes(hash)) continue;
        // Create a promise to inser it
        inserts.push(prisma.position.create({ data: aeroToDB(pos, legID) }));
        // Record the point hash
        pointHashes.push(hash)
    }

    try {
        // Execute the prisma transaction that will add all the points
        await prisma.$transaction(inserts)
    } catch (e) {
        console.log('Unable to add positions!', e);
    }
}

/**
 * Store an array of AeroAPI positions
 * @param positions the array of AeroAPI positions to check
 */
export type FlightTime = { start_time: number, end_time: number };
export const getFlightTimings = (positions: aero.schema.Position[]) : FlightTime | undefined => {
    // Initialize variables to hold the start and end times of this flight
    let start_time = Infinity;
    let end_time = -Infinity;
    // Loop through the positions
    for (const position of positions) {
        // Convert the AeroAPI position to a format that can go in the DB
        const timestamp = Math.round(new Date(position.timestamp).getTime() / 1000);
        // Check if this timestamp is before the current start_time or after the current end_time
        if (timestamp < start_time) start_time = timestamp;
        if (timestamp > end_time) end_time = timestamp;
    }
    // Return the timing data if it is valid
    if (start_time !== Infinity && end_time !== -Infinity && end_time >= start_time) return {start_time, end_time};
    else return undefined;
}

/**
 * Delete positions associated with a flight
 * @param legID the flight who's positions should be deleted
 */
export const deletePositions = async (legID: string) : Promise<void> => {
    await prisma.position.deleteMany({ where: { legId: legID } });
}

/**
 * Get all positions associated with a particular flight
 * @param legID the flight
 * @returns an array of DB format positions
 */
export const getPositions = async (legID: string): Promise<Types.Position[]> => {
    return await prisma.position.findMany({ where: { legId: legID }});
}
