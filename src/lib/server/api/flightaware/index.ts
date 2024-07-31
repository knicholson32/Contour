import * as c from 'chalk';
import { sleep } from '$lib/helpers';
import type * as schema from './schema'

const chalk = new c.Chalk();

// const X_AEROAPIKEY = process.env.X_AEROAPIKEY;
const DEPTH_LIMIT = 100;
const MAX_BULK_SEARCH_TIME_SPAN_S = 1*60*60*72; // 72 hours

// Export schema
export * as schema from './schema';

/**
 * AeroAPIError class. Accepts an AeroAPIError response and produces an error to be thrown
 */
export class AeroAPIError extends Error {
    apiErr: schema.AeroAPIError;

    constructor(err: schema.AeroAPIError) {
        super(`AeroAPIError: ${err.status}: ${err.title}: ${err.reason}: ${err.detail}`);
        Object.setPrototypeOf(this, AeroAPIError.prototype);
        this.apiErr = err
    }
}

/**
 * Call the AeroAPI API
 * @param uri the relative uri to call IE. /flights/KAP49?data=123
 * @returns the response from AeroAPI of type <ResponseType>
 */
const callAPI = async <ResponseType>(uri: string, aeroAPIKey: string, depth?: number): Promise<ResponseType> => {
    // Assign depth if it is not assigned
    if (depth === undefined) depth = 0;
    // Log this AeroAPI request
    console.log(chalk.red('AeroAPI: ') + chalk.grey('Depth ' + depth) + ' ' + chalk.blue(uri));
    // Make request to FlightAware API
    const response = await fetch(`https://aeroapi.flightaware.com/aeroapi${uri}`, { headers: { 'x-apikey': aeroAPIKey } });
    // Parse the response
    const obj = await response.json() as schema.AeroAPIError;
    // See if this is an error
    if (obj.status !== undefined) {
        // Check if we are rate limited
        if (obj.status === 429) {
            // We are. Check the recursion depth and throw an error if too deep
            if (depth > DEPTH_LIMIT) throw new Error('RATE LIMIT DEPTH EXCEEDED');
            // Log that we're waiting for rate limit reasons
            console.log(`RATE LIMITED [${uri}]: Try ${depth}`);
            // Increase the recursion depth
            depth = depth + 1;
            // Wait some time (increases the longer we have been waiting)
            await sleep(1000 * (depth / 5));
            // Re-call function
            return await callAPI<ResponseType>(uri, aeroAPIKey, depth);
        } else {
            // Unforeseen error
            throw new AeroAPIError(obj);
        }
    }
    // Return the result
    return (obj as unknown) as ResponseType
};

/**
 * Get all flights matching a given callsign between certain times
 * GET /flights/{ident}
 * @param callsign string of the callsign to search for (IE. KAP49)
 * @param aeroAPIKey the AeroAPI key to use for this transaction
 * @param startTime time in unix format
 * @param endTime time in unix format
 * @returns The flight in schema.Flights format
 */
export type GetFlightOptions = { startTime?: number, endTime?: number, ident_type?: schema.IdentType }
export const getFlights = async (callsign: string, aeroAPIKey: string, options: GetFlightOptions): Promise<schema.Flights> => {
    // Resolve the ident_type
    if (options.ident_type === undefined) options.ident_type = 'designator';
    // Make request to FlightAware API
    if (options.startTime !== undefined && options.endTime !== undefined) {
        // Both start and end time are specified
        return callAPI<schema.Flights>(`/flights/${callsign}?ident_type=${options.ident_type}&start=${encodeURIComponent(new Date(options.startTime * 1000).toISOString())}&end=${encodeURIComponent(new Date(options.endTime * 1000).toISOString())}`, aeroAPIKey);
    } else if (options.startTime !== undefined && options.endTime === undefined) {
        // Start time is specified, but not end time
        return callAPI<schema.Flights>(`/flights/${callsign}?ident_type=${options.ident_type}&start=${encodeURIComponent(new Date(options.startTime * 1000).toISOString())}`, aeroAPIKey);
    } else if (options.startTime === undefined && options.endTime !== undefined) {
        // End time is specified, but not start time
        return callAPI<schema.Flights>(`/flights/${callsign}?ident_type=${options.ident_type}&end=${encodeURIComponent(new Date(options.endTime * 1000).toISOString())}`, aeroAPIKey);
    } else {
        // Neither start nor end time is specified
        return callAPI<schema.Flights>(`/flights/${callsign}?ident_type=${options.ident_type}`, aeroAPIKey);
    }
}

/**
 * Get all flights matching a given callsign between certain times, with multi-page support
 * GET /flights/{ident}
 * @param callsign string of the callsign to search for (IE. KAP49)
 * @param aeroAPIKey the AeroAPI key to use for this transaction
 * @param startTime time in unix format
 * @param endTime time in unix format
 * @returns The flight in schema.Flights format
 */
export type GetFlightBulkOptions = { ident_type?: schema.IdentType, times?: { startTime?: number, endTime?: number } }
export const getFlightsBulk = async (callsign: string, aeroAPIKey: string, options: GetFlightBulkOptions): Promise<schema.Flight[]> => {
    // Log the bulk request
    console.log(chalk.red('AeroAPI: ') + chalk.grey(`getFlightsBulk(${callsign}, ####, ${JSON.stringify(options)})`) + ' -> Requested');
    // Resolve the ident_type
    if (options.ident_type === undefined) options.ident_type = 'registration';
    // Declare the request
    let request: string;
    // See if we are using times
    if (options.times !== undefined) {
        // Check that the times are't too far apart and ara valid
        if (options.times.endTime !== undefined && options.times.startTime !== undefined) {
            if (options.times.endTime < options.times.startTime) throw new Error(`Invalid times for a bulk search`, { cause: 'TIME_OUT_OF_ORDER' });
            if (Math.abs(options.times.endTime - options.times.startTime) > MAX_BULK_SEARCH_TIME_SPAN_S) throw new Error(`Invalid times for a bulk search`, {cause: 'TIME_SPAN_TOO_LONG'});
            request = `/flights/${callsign}?ident_type=${options.ident_type}&start=${encodeURIComponent(new Date(options.times.startTime * 1000).toISOString())}&end=${encodeURIComponent(new Date(options.times.endTime * 1000).toISOString())}`;
        } else {
            if (options.times.endTime === undefined && options.times.startTime === undefined) {
                request = `/flights/${callsign}?ident_type=${options.ident_type}`;
            } else {
                if (options.times.startTime !== undefined) {
                    request = `/flights/${callsign}?ident_type=${options.ident_type}&start=${encodeURIComponent(new Date(options.times.startTime * 1000).toISOString())}`;
                } else if (options.times.endTime !== undefined) {
                    request = `/flights/${callsign}?ident_type=${options.ident_type}&end=${encodeURIComponent(new Date(options.times.endTime * 1000).toISOString())}`;
                } else {
                    throw new Error(`Invalid times for a bulk search`, { cause: 'MISSING TIME VARIABLES' });
                }
            }
        }
    } else {
        request = `/flights/${callsign}?ident_type=${options.ident_type}`;
    }
    // Set up some variables
    let flights: schema.Flight[] = []
    let searching = true;
    let pages = 0;
    // Loop until we don't have any more pages or we get to 5 pages
    while(searching && pages < 5) {
        // Call the API with the request
        const flt = await callAPI<schema.Flights>(request, aeroAPIKey);
        // Concat the flights to the export array
        flights = flights.concat(flt.flights);
        // If there is another page, set it as the request
        if (flt.links !== null && flt.links !== undefined && flt.links.next != null && flt.links.next != undefined) request = flt.links.next;
        // Otherwise we are done searching
        else searching = false;
        // Increment the page number
        pages = pages + 1;
    }

    // Log the results
    console.log(chalk.red('AeroAPI: ') + chalk.grey(`getFlightsBulk(${callsign}, ####, ${JSON.stringify(options)})`));
    console.log(chalk.blue(JSON.stringify(flights)));

    return flights;
}

/**
 * Get the track that a flight actually took
 * GET /flights/{id}/track
 * @param fa_flight_id the flight ID to get the track log of. FlightAware specific ID.
 * @param aeroAPIKey the AeroAPI key to use for this transaction
 * @returns The track log in schema.FlightTrack format
 */ 
export const getFlightTrack = async (fa_flight_id: string, aeroAPIKey: string): Promise<schema.FlightTrack> => {
    // Make request to FlightAware API
    return callAPI<schema.FlightTrack>(`/flights/${fa_flight_id}/track`, aeroAPIKey);
}

/**
 * Get the route that a flight actually took
 * GET /flights/{id}/route
 * @param fa_flight_id the flight ID to get the route log of. FlightAware specific ID.
 * @param aeroAPIKey the AeroAPI key to use for this transaction
 * @returns The route log in schema.FlightRoute format
 */
export const getFlightRoute = async (fa_flight_id: string, aeroAPIKey: string): Promise<schema.FlightRoute> => {
    // Make request to FlightAware API
    return callAPI<schema.FlightRoute>(`/flights/${fa_flight_id}/route`, aeroAPIKey);
}

/**
 * Get airports near a position
 * GET /airports/nearby
 * @param aeroAPIKey the AeroAPI key to use for this transaction
 * @param lat the latitude of the position to search near
 * @param lon the longitude of the position to search near
 * @param radius the integer radius of the search in statue miles
 * @param only_iap optional. Whether or not to only search for airports with IAPs. Default = true.
 * @returns The airport list in schema.AirportsNearby format
 */
export const getAirportsNearby = async (aeroAPIKey: string, lat: number, lon: number, radius: number, only_iap?: boolean): Promise<schema.AirportsNearby> => {
    // Resolve only_iap
    if (only_iap === undefined) only_iap = true;
    // Make request to FlightAware API
    return callAPI<schema.AirportsNearby>(`/airports/nearby?latitude=${lat}&longitude=${lon}&radius=${radius}&only_iap=${only_iap}`, aeroAPIKey);
}


/**
 * Get information about an airport based on the ICAO ID
 * @param icao the ICAO airport ID
 * @param aeroAPIKey the AeroAPI key to use for this transaction
 * @returns the airport information
 */
export const getAirport = async (icao: string, aeroAPIKey: string): Promise<schema.Airport> => {
    // Make request to FlightAware API
    return callAPI<schema.Airport>(`/airports/${icao}`, aeroAPIKey);
}


/**
 * Get a flightaware flight ID from a flightaware URL
 * @param url the url
 * @returns the flight ID
 */
export const getFlightIDFromURL = async (url: string): Promise<string | null> => {
    if (!url.startsWith('https://www.flightaware.com/')) {
        console.log('ERR: getFlightIDFromURL: Invalid URL', url);
        return null
    }
    try {
        const text = await (await fetch(url)).text();
        const lines = text.split('\n');
        for (const l of lines) {
            if (l.indexOf('trackpollBootstrap') !== -1) {
                const start = l.indexOf('{');
                const end = l.lastIndexOf(';');
                const line = l.substring(start, end);
                const entry = JSON.parse(line);
                const flightIDs = Object.keys(entry.flights);
                if (flightIDs.length === 0) {
                    console.log('ERR: getFlightIDFromURL: No flight IDs', line);
                    return null
                } else if (flightIDs.length > 1) {
                    console.log('ERR: getFlightIDFromURL: Too many flight IDs', line);
                    return null
                }
                const flightID = (flightIDs[0]).split(':')[0];
                if (flightID.length === 0) {
                    console.log('ERR: getFlightIDFromURL: Invalid flight ID', line);
                    return null
                }
                return flightID
            }
        }
        console.log('ERR: getFlightIDFromURL: No trackpollBootstrap found.');
        console.log(text);
        return null;
    } catch(e) {
        console.log('ERR: getFlightIDFromURL: General: ', e);
        return null;
    }

}