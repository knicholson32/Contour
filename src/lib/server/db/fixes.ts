import type * as aero from '$lib/server/api/flightaware';
import prisma from '$lib/server/prisma';
import * as Types from '@prisma/client';

/**
 * Convert from the AeroAPI format to the format saved to the database
 * @param position the AeroAPI Position object
 * @param legID the flight ID
 * @returns the DB format of the data
 */
export const aeroToDB = (fix: aero.schema.Fix, legID: string): Types.Prisma.FixUncheckedCreateInput => {
    const f: Types.Prisma.FixUncheckedCreateInput = {
        legId: legID,
        name: fix.name,
        latitude: (fix.latitude === null) ? null : new Types.Prisma.Decimal(fix.latitude),
        longitude: (fix.longitude === null) ? null : new Types.Prisma.Decimal(fix.longitude),
        distanceFromOrigin: (fix.distance_from_origin == null) ? null : new Types.Prisma.Decimal(fix.distance_from_origin),
        distanceThisLeg: (fix.distance_this_leg == null) ? null : new Types.Prisma.Decimal(fix.distance_this_leg),
        distanceToDestination: (fix.distance_to_destination == null) ? null : new Types.Prisma.Decimal(fix.distance_to_destination),
        outboundCourse: fix.outbound_course,
        type: fix.type,
    };
    return f;
};


// ------------------------------------------------------------------------------------------------
// Commands
// ------------------------------------------------------------------------------------------------

/**
 * Store an array of AeroAPI positions
 * @param positions the array of AeroAPI positions to store
 * @param legID the flight ID to associate this positions with
 */
export const storeFixes = async (fixes: aero.schema.Fix[], legID: string): Promise<void> => {
    // Delete any positions that might already be associated with this flight
    await deleteFixes(legID);

    // Format the aero schema positions into the DB format
    const fixesDB = [];
    for (const fix of fixes) fixesDB.push(aeroToDB(fix, legID));

    // Run the db transaction function
    await prisma.fix.createMany({
        data: fixesDB,
        skipDuplicates: false
    });
}

/**
 * Delete route fixes associated with a flight
 * @param legID the flight who's route fixes should be deleted
 */
export const deleteFixes = async (legID: string) : Promise<void> => {
    await prisma.fix.deleteMany({ where: { legId: legID } });
}

/**
 * Get all positions associated with a particular flight
 * @param legID the flight
 * @returns an array of DB format positions
 */
export const getFixes = async (legID: string): Promise<Types.Fix[]> => {
    return await prisma.fix.findMany({ where: { legId: legID } });
}
