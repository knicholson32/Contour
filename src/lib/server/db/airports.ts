import prisma from '$lib/server/prisma';
import type * as Types from '@prisma/client';
import * as aero from '$lib/server/api/flightaware';
import { Prisma } from '@prisma/client';

// ------------------------------------------------------------------------------------------------
// Database Conversion
// ------------------------------------------------------------------------------------------------
/**
 * Get an airport based on the ICAO airport ID. Returns undefined if it doesn't exist
 * @param id the ICAO airport ID to get
 * @returns the airport
 */
export const getAirport = async (id: string): Promise<Types.Airport | undefined> => {
  try {
    return await prisma.airport.findUniqueOrThrow({ where: { id } });
  } catch (e) {
    return undefined;
  }
}

/**
 * Add an airport to the DB
 * @param airport_id the ICAO airport ID of the airport to add
 * @returns whether or not the airport could be added
 */
export const addAirport = async (airport_id: string, aeroAPIKey: string): Promise<boolean> => {
  try {
    airport_id = airport_id.trim().toLocaleUpperCase();
    // Get the airport from AeroAPI
    const aeroAirport = await aero.getAirport(airport_id, aeroAPIKey);
    // Make the DB compatible entry
    const airport: Types.Airport = {
      id: airport_id,
      timezone: aeroAirport.timezone,
      name: aeroAirport.name,
      city: aeroAirport.city,
      infoURL: aeroAirport.wiki_url,
      latitude: aeroAirport.latitude,
      longitude: aeroAirport.longitude,
      countryCode: aeroAirport.country_code
    };
    // Add the airport to the DB
    await prisma.airport.create({ data: airport });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

/**
 * Add an airport to the database if it doesn't exist. This makes an AeroAPI call
 * @param airport_id the ICAO airport ID of the airport to add
 */
export const addIfDoesNotExist = async (airport_id: string | null | undefined, aeroAPIKey: string): Promise<boolean> => {
  if (airport_id === null || airport_id === undefined) return false;
  airport_id = airport_id.trim().toLocaleUpperCase();
  // Check if the airport exists
  if (await getAirport(airport_id) === undefined) {
    // It does not. Add it.
    return await addAirport(airport_id, aeroAPIKey);
  }
  return true;
}

// /**
//  * Add an airport to the DB
//  * @param airport the airport object to add
//  * @returns whether or not the airport could be added
//  */
// export const tryAddAirport = async (airport: Types.Airport): Promise<boolean> => {
//   try {
//     // See if the airport exists already
//     const apt = getAirport(airport.id);
//     if (apt === undefined) {
//       // It doesn't. Add it
//       await prisma.airport.create({ data: apt });
//       return true;
//     }
//     return false;
//   } catch (e) {
//     console.log(e);
//     return false;
//   }
// }