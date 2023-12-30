import type * as aero from '$lib/server/api/flightaware';
import prisma from '$lib/server/prisma';
import * as Types from '@prisma/client';

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
            altitudeChange = Types.AltitudeChange.CLIMBING
            break;
        case "D":
            altitudeChange = Types.AltitudeChange.DESCENDING
            break;
        case "-":
            altitudeChange = Types.AltitudeChange.LEVEL
            break;
        default:
            altitudeChange = Types.AltitudeChange.UNKNOWN
            break;
    }

    // Convert the aero API update type options to a format the DB will use
    let updateType;
    switch(position.update_type) {
        case 'P': // P = projected
            updateType = Types.UpdateType.PROJECTED;
            break;
        case 'O': // O = oceanic
            updateType = Types.UpdateType.OCEANIC;
            break;
        case 'Z': // Z = radar
            updateType = Types.UpdateType.RADAR;
            break;
        case 'A': // A = ADS-B
            updateType = Types.UpdateType.ADSB;
            break;
        case 'M': // M = multilateration
            updateType = Types.UpdateType.MULTILATERATION;
            break;
        case 'D': // D = datalink
            updateType = Types.UpdateType.DATALINK;
            break;
        case 'X': // X = surface and near surface(ADS - B and ASDE - X)
            updateType = Types.UpdateType.ADSB_ASDEX;
            break;
        case 'S': // S = space - based
            updateType = Types.UpdateType.SPACE;
            break;
        default:
            updateType = Types.UpdateType.UNKNOWN;
    }

    const pos: Types.Position = {
        legId: legID,
        altitude: Math.round(position.altitude),
        altitudeChange: altitudeChange,
        groundspeed: Math.round(position.groundspeed),
        heading: Math.round(position.heading),
        latitude: new Types.Prisma.Decimal(position.latitude),
        longitude: new Types.Prisma.Decimal(position.longitude),
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

    // Format the aero schema positions into the DB format
    const positionsDB = [];
    for (const pos of positions) positionsDB.push(aeroToDB(pos, legID));

    // Run the db transaction function
    await prisma.position.createMany({
        data: positionsDB,
        skipDuplicates: true
    })
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
