import type * as aero from '$lib/server/api/flightaware';
import prisma from '$lib/server/prisma';
import type * as Types from '@prisma/client';
import crypto from 'node:crypto';

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
        latitude: (fix.latitude === null) ? null : fix.latitude,
        longitude: (fix.longitude === null) ? null : fix.longitude,
        distanceFromOrigin: (fix.distance_from_origin == null) ? null : fix.distance_from_origin,
        distanceThisLeg: (fix.distance_this_leg == null) ? null : fix.distance_this_leg,
        distanceToDestination: (fix.distance_to_destination == null) ? null : fix.distance_to_destination,
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

    const inserts: Types.Prisma.PrismaPromise<any>[] = [];
    // Loop through each position
    for (const pos of fixes) inserts.push(prisma.fix.create({ data: aeroToDB(pos, legID) }));

    try {
        // Execute the prisma transaction that will add all the points
        await prisma.$transaction(inserts)
    } catch (e) {
        console.log('Unable to add fixes!', e);
    }
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
