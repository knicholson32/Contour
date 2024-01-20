import prisma from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import type * as Types from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as aero from '$lib/server/api/flightaware';
import chalk from 'chalk';

const FORTY_EIGHT_HOURS = 48 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const EIGHT_HOURS = 8 * 60 * 60;

// ------------------------------------------------------------------------------------------------
// Commands
// ------------------------------------------------------------------------------------------------

/**
 * Create a cache-format flight from an AeroAPI flight
 */
export const aeroFlightToOption = (tourID: number, flight: aero.schema.Flight): Types.Option => {
    // Calculate times
    const scheduled_out = Math.round(Date.parse(flight.scheduled_out??'NaN') / 1000);
    const estimated_out = Math.round(Date.parse(flight.estimated_out??'NaN') / 1000);
    const actual_out = Math.round(Date.parse(flight.actual_out??'NaN') / 1000);
    const scheduled_off = Math.round(Date.parse(flight.scheduled_off??'NaN') / 1000);
    const estimated_off = Math.round(Date.parse(flight.estimated_off??'NaN') / 1000);
    const actual_off = Math.round(Date.parse(flight.actual_off??'NaN') / 1000);
    const scheduled_on = Math.round(Date.parse(flight.scheduled_on??'NaN') / 1000);
    const estimated_on = Math.round(Date.parse(flight.estimated_on??'NaN') / 1000);
    const actual_on = Math.round(Date.parse(flight.actual_on??'NaN') / 1000);
    const scheduled_in = Math.round(Date.parse(flight.scheduled_in??'NaN') / 1000);
    const estimated_in = Math.round(Date.parse(flight.estimated_in??'NaN') / 1000);
    const actual_in = Math.round(Date.parse(flight.actual_in??'NaN') / 1000);

    // 1. actual out/in
    // 2. actual off/on
    // 3. estimated out/in
    // 4. estimated off/on
    let start_time = 0;
    let inaccurate_timing = false;
    if (!isNaN(actual_out)) start_time = actual_out;
    else if (!isNaN(actual_off)) start_time = actual_off;
    else if (!isNaN(estimated_out)) {
        start_time = estimated_out;
        inaccurate_timing = true;
    } else if (!isNaN(estimated_off)) {
        start_time = estimated_off;
        inaccurate_timing = true;
    } else if (!isNaN(scheduled_out)) {
        start_time = scheduled_out;
        inaccurate_timing = true;
    } else if (!isNaN(scheduled_off)) {
        start_time = scheduled_off;
        inaccurate_timing = true;
    }
    let end_time = 0;
    if (!isNaN(actual_in)) end_time = actual_in;
    else if (!isNaN(actual_on)) end_time = actual_on;
    else if (!isNaN(estimated_in)) {
        end_time = estimated_in;
        inaccurate_timing = true;
    } else if (!isNaN(estimated_on)) {
        end_time = estimated_on;
        inaccurate_timing = true;
    } else if (!isNaN(scheduled_in)) {
        end_time = scheduled_in;
        inaccurate_timing = true;
    } else if (!isNaN(scheduled_on)) {
        end_time = scheduled_on;
        inaccurate_timing = true;
    }



    // Create a flight
    const optionDB: Types.Option = {
        id: 'flt-' + uuidv4(),
        tourId: tourID,
        inaccurateTiming: inaccurate_timing,
        ident: flight.ident,
        faFlightId: flight.fa_flight_id,
        operator: flight.operator,
        flightNumber: flight.flight_number,
        registration: flight.registration,
        inboundFaFlightId: flight.inbound_fa_flight_id,
        blocked: flight.blocked,
        diverted: flight.diverted,
        cancelled: flight.cancelled,
        positionOnly: flight.position_only,
        originAirportId: flight.origin.code,
        destinationAirportId: flight.destination?.code ?? null,
        diversionAirportId: null,
        departureDelay: flight.departure_delay,
        arrivalDelay: flight.arrival_delay,
        filedEte: flight.filed_ete,
        progressPercent: flight.progress_percent,
        status: flight.status,
        aircraftType: flight.aircraft_type,
        routeDistance: flight.route_distance,
        filedAirspeed: flight.filed_airspeed,
        filedAltitude: flight.filed_altitude,
        filedRoute: flight.route,
        seatsCabinBusiness: flight.seats_cabin_business,
        seatsCabinCoach: flight.seats_cabin_coach,
        seatsCabinFirst: flight.seats_cabin_first,
        gateOrigin: flight.gate_origin,
        gateDestination: flight.gate_destination,
        terminalOrigin: flight.terminal_origin,
        terminalDestination: flight.terminal_destination,
        type: flight.type,
        scheduledOut: (isNaN(scheduled_out) ? null : scheduled_out),
        actualOut: (isNaN(actual_out) ? null : actual_out),
        scheduledOff: (isNaN(scheduled_off) ? null : scheduled_off),
        actualOff: (isNaN(actual_off) ? null : actual_off),
        scheduledOn: (isNaN(scheduled_on) ? null : scheduled_on),
        actualOn: (isNaN(actual_on) ? null : actual_on),
        scheduledIn: (isNaN(scheduled_in) ? null : scheduled_in),
        actualIn: (isNaN(actual_in) ? null : actual_in),

        startTime: start_time,
        endTime: end_time
    };

    return optionDB;
}

/**
 * Cache a flight option
 * @param option the flight option to cache
 */
export const cache = async (option: Types.Option): Promise<void> => {
    await prisma.option.create({ data: option });
}

/**
 * Cache many fights
 * @param flights the flights to cache
 */
export const cacheMany = async (flights: Types.Option[]): Promise<void> => {

    const currentIDs = (await prisma.option.findMany({ select: { faFlightId: true } })).map((v) => v.faFlightId);

    const inserts: Types.Prisma.PrismaPromise<any>[] = [];
    // Loop through each position
    for (const flight of flights) {
        if (currentIDs.includes(flight.faFlightId)) {
            console.log('updating', flight.faFlightId);
            inserts.push(prisma.option.update({ where: { faFlightId: flight.faFlightId }, data: flight }));
        } else {
            console.log('cache', flight.faFlightId);
            inserts.push(prisma.option.create({ data: flight }));
        }
    }

    try {
        // Execute the prisma transaction that will add all the points
        await prisma.$transaction(inserts)
    } catch (e) {
        console.log('Unable to add options!', e);
    }

    // await prisma.option.createMany({ data: flights, skipDuplicates: true });
}

/**
 * Clear the options list that has to do with a specific tour
 * @param tourID the tour to clear based
 */
export const clear = async (tourID?: number): Promise<void> => {
    if (tourID === undefined) {
        try {
            console.log('Clearing all flight cache');
            await prisma.option.deleteMany({});
        } catch (e) {
            console.error(e);
            return;
        }
    } else {
        try {
            console.log('Clearing options for ' + tourID);
            await prisma.option.deleteMany({
                where: {
                    tourId: tourID
                }
            });
        } catch(e) {
            console.error(e);
            return;
        }
    }
}

/**
 * Count the number of cached flights associated with a tour
 * @param tourID 
 */
export const count = async (tourID: number): Promise<number> => {
    try {
        const val = await prisma.option.count({
            where: {
                tourId: tourID
            }
        });
        console.log('count', val);
        return val;
    } catch (e) {
        return 0;
    }
}


const minimalsSelection: Types.Prisma.OptionSelect = {
    id: true,
    faFlightId: true,
    startTime: true,
    endTime: true,
    originAirportId: true,
    destinationAirportId: true,
    cancelled: true,
    diverted: true
};

// Function that exists only to let Prisma see what type it returns
const _minimalsTypeSynthesis = async () => await prisma.option.findUnique({ where: { id: '' }, select: minimalsSelection });

/**
 * Get all flights that are for a specific tour
 * @param tourID the tour to match for
 * @returns an array of cached flights
 */
export type Minimals = NonNullable<Types.Prisma.PromiseReturnType<typeof _minimalsTypeSynthesis>>;
export const getMinimals = async (tourID: number): Promise<Minimals[]> => {
    return await prisma.option.findMany({
        where: {
            tourId: tourID
        },
        select: minimalsSelection
    });
}


/**
 * Get a flight based on the flight ID
 * @param id the flight to get
 * @returns the flight or undefined
 */
export const getFlightOption = async (id?: string): Promise<Types.Option | undefined> => {
    if (id === undefined) return undefined;
    try {
        return await prisma.option.findUniqueOrThrow({ where: { id: id } });
    } catch (e) {
        return undefined;
    }
}

/**
 * Get a flight based on the flightaware flight ID
 * @param id the flightaware flight to get
 * @returns the flight or undefined
 */
export const getFlightOptionFaFlightID = async (fa_flight_id?: string): Promise<Types.Option | undefined> => {
    if (fa_flight_id === undefined) return undefined;
    try {
        return await prisma.option.findUniqueOrThrow({ where: { faFlightId: fa_flight_id } });
    } catch (e) {
        return undefined;
    }
}


// ------------------------------------------------------------------------------------------------
// External Tools
// ------------------------------------------------------------------------------------------------


/**
 * Go through all the searches, make all API requests to gather the data, and add the data to cache
 * @param aeroAPIKey the AeroAPI key to use for this transaction
 * @param flightIDs a list of the unique flightIDs to cache. The larger this list is the more efficient the API usage
 * @param clearCache whether or not to erase the associated cache and redo it. False by default.
 */
export const getOptionsAndCache = async (aeroAPIKey: string, tour: number, flightIDs: string[], clearCache = false, forceExpansiveSearch = false): Promise<void> => {
    // If required, clear the cache so we can get latest info
    if (clearCache) {
        console.log('CLEAR CACHE');
        // Clear the cache so we can be sure we won't have a cache collision
        await clear(tour);
    } else {
        // console.log('FLIGHT IDs BEFORE')
        // console.log(JSON.stringify(flightIDs));
        // const newFlightIDs: string[] = [];
        // // // We aren't clearing the cache. Skip any searches that already have cached results
        // // for (const id of flightIDs) if (await prisma.option.findUnique({ where: { faFlightId: id }}) === null) newFlightIDs.push(id);
        // // Re-assign the searches
        // flightIDs = newFlightIDs;
        // console.log('FLIGHT IDs AFTER')
        // console.log(JSON.stringify(flightIDs));
    }

    // Go through each consolidated search and process it
    for (const flightID of flightIDs) {
        // Execute the search which will get all possible flights for this group
        // With time support: { times: { startTime: Math.floor(Date.now() / 1000) - TWENTY_FOUR_HOURS, endTime: Math.floor(Date.now() / 1000) + EIGHT_HOURS} }
        let flights: aero.schema.Flight[];
        if (forceExpansiveSearch) {
            console.log(chalk.yellow('Expansive Search'));
            flights = await aero.getFlightsBulk(flightID, aeroAPIKey, { });
        }
        else flights = await aero.getFlightsBulk(flightID, aeroAPIKey, { times: { startTime: Math.floor(Date.now() / 1000) - TWENTY_FOUR_HOURS, endTime: Math.floor(Date.now() / 1000) + EIGHT_HOURS } });

        // Convert the flights to a cache format and collect diversion information
        const cacheFlights: Types.Option[] = [];
        // Make an array to hold info about flights that were diverted
        type DiversionDetails = { faFlightId: string, diversion: string };
        const diversionModifications: DiversionDetails[] = [];
        for (const flight of flights) {
            // Check if the flight was diverted. If it was, add details about the diversion
            if (flight.diverted === true && (flight.destination?.code ?? null) !== null) diversionModifications.push({ faFlightId: flight.fa_flight_id, diversion: (flight.destination?.code ?? '') });
            // If no, add the flight to the cache
            else cacheFlights.push(aeroFlightToOption(tour, flight));
        }

        // Consolidate diverted flights
        for (const diversionDetail of diversionModifications) {
            console.log('DIVERSION: ', diversionDetail);
            // Search for the diverted flight and assign the diversion destination. First, search by matching FA flight IDs (simplest solution)
            let matchingDiversionFound = false;
            for (const search_flt of cacheFlights) {
                // Check if we have found the other flight
                if (search_flt.faFlightId === diversionDetail.faFlightId) {
                    // If so, assign the diversion and stop looking
                    const dest = search_flt.destinationAirportId;
                    search_flt.destinationAirportId = diversionDetail.diversion;
                    search_flt.diversionAirportId = dest;
                    console.log('DIVERSION FOUND: ', search_flt);
                    matchingDiversionFound = true;
                    break;
                }
            }
            // If the diversion was still not found, do a more complex search
            if (!matchingDiversionFound) {
                // Try and find a flight that has the same origin and inbound_fa_flight_id that was
                console.log(chalk.red('DIVERSION NOT FOUND: ' + chalk.gray('Searching direct for: ') + chalk.blue(diversionDetail.faFlightId)));
                // Make a request for the specific FA Flight ID
                const flights = await aero.getFlightsBulk(diversionDetail.faFlightId, aeroAPIKey, {});
                for (const search_flt of flights) {
                    const flight = aeroFlightToOption(tour, search_flt);
                    // Check if we have found the other flight
                    if (flight.faFlightId === diversionDetail.faFlightId && flight.diverted === false) {
                        // If so, assign the diversion and stop looking
                        const dest = flight.destinationAirportId;
                        flight.destinationAirportId = diversionDetail.diversion;
                        flight.diversionAirportId = dest;
                        cacheFlights.push(flight);
                        console.log('DIVERSION FOUND: ', flight);
                        break;
                    }
                }
            }
        }

        // Add the cached flights
        // Make an array to hold the cached flights for this search specially
        const specificCacheFlights: Types.Option[] = [];
        // Loop through all the cached flights so we can refine
        for (const cacheFlight of cacheFlights) {
            // Re-assign the search_id to point to the correct search
            cacheFlight.tourId = tour;
            // Create a new flight_id for this cache entry (since the same cache source will be assigned to multiple searches)
            cacheFlight.id = 'flt-' + uuidv4();
            // Add the flight to the cache list
            specificCacheFlights.push(cacheFlight);
        }
        await cacheMany(specificCacheFlights);
    }
}