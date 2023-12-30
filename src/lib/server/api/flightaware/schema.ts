// flightaware schema as of 6/26/2023

export type IdentType = 'designator' | 'registration' | 'fa_flight_id';

export type Flight = {
    ident: string,                                  // Either the operator code followed by the flight number for the flight (for commercial flights) or the aircraft's registration (for general aviation).
    ident_icao?: string | null,                     // The ICAO operator code followed by the flight number for the flight (for commercial flights)
    ident_iata?: string | null,                     // The IATA operator code followed by the flight number for the flight (for commercial flights)
    fa_flight_id: string,                           // Unique identifier assigned by FlightAware for this specific flight. If the flight is diverted, the new leg of the flight will have a duplicate fa_flight_id.
    operator: string | null,                        // ICAO code, if exists, of the operator of the flight, otherwise the IATA code
    operator_icao?: string | null,                  // ICAO code of the operator of the flight.
    operator_iata: string | null,                   // IATA code of the operator of the flight.
    flight_number: string | null,                   // Bare flight number of the flight.
    registration: string | null,                    // Aircraft registration (tail number) of the aircraft, when known.
    atc_ident: string | null,                       // The ident of the flight for Air Traffic Control purposes, when known and different than ident.
    inbound_fa_flight_id: string | null,            // Unique identifier assigned by FlightAware for the previous flight of the aircraft serving this flight.
    codeshares: string[],                           // List of any ICAO codeshares operating on this flight.
    codeshares_iata?: string[],                     // List of any IATA codeshares operating on this flight.
    blocked: boolean,                               // Flag indicating whether this flight is blocked from public viewing.
    diverted: boolean,                              // Flag indicating whether this flight was diverted.
    cancelled: boolean,                             // Flag indicating that the flight is no longer being tracked by FlightAware. There are a number of reasons this could happen including cancellation by the airline, but that will not always be the case.
    position_only: boolean,                         // Flag indicating that this flight does not have a flight plan, schedule, or other indication of intent available.
    origin: {                                       // Information for this flight's origin airport.
        code: string | null,                        // ICAO/IATA/LID code or string indicating the location where tracking of the flight began/ended for position-only flights.
        code_icao?: string | null,                  // ICAO code
        code_iata?: string | null,                  // IATA code
        code_lid?: string | null,                   // LID code
        timezone?: string | null,                   // Applicable timezone for the airport, in the TZ database format
        name?: string | null,                       // Common name of airport
        city?: string | null,                       // Closest city to the airport
        airport_info_url: string | null             // The URL to more information about the airport. Will be null for position-only flights.
    },
    destination: {                                  // Information for this flight's destination airport.
        code: string | null,                        // ICAO/IATA/LID code or string indicating the location where tracking of the flight began/ended for position-only flights.
        code_icao?: string | null,                  // ICAO code
        code_iata?: string | null,                  // IATA code
        code_lid?: string | null,                   // LID code
        timezone?: string | null,                   // Applicable timezone for the airport, in the TZ database format
        name?: string | null,                       // Common name of airport
        city?: string | null,                       // Closest city to the airport
        airport_info_url: string | null,            // The URL to more information about the airport. Will be null for position-only flights.
    }
    departure_delay: number | null,                 // Arrival delay (in seconds) based on either actual or estimated gate arrival time. If gate time is unavailable then based on runway arrival time. A negative value indicates the flight is early.
    arrival_delay: number | null,                   // Departure delay (in seconds) based on either actual or estimated gate departure time. If gate time is unavailable then based on runway departure time. A negative value indicates the flight is early.
    filed_ete: number | null,                       // Runway-to-runway filed duration (seconds).
    progress_percent: number | null,                // The percent completion of a flight, based on runway departure/arrival. Null for en route position-only flights. Constraints: Min 0 | Max 100
    status: string                                  // Human-readable summary of flight status. (Scheduled, Arrived, etc.)
    aircraft_type: string | null,                   // Aircraft type will generally be ICAO code, but IATA code will be given when the ICAO code is not known.
    route_distance: number | null,                  // Planned flight distance (statute miles) based on the filed route. May vary from actual flown distance.
    filed_airspeed: number | null,                  // Filed IFR airspeed (knots).
    filed_altitude: number | null,                  // Filed IFR altitude (100s of feet).
    route: string | null,                           // The textual description of the flight's route.
    baggage_claim: string | null,                   // Baggage claim location at the destination airport.
    seats_cabin_business: number | null,            // Number of seats in the business class cabin.
    seats_cabin_coach: number | null,               // Number of seats in the coach cabin.
    seats_cabin_first: number | null,               // Number of seats in the first class cabin.
    gate_origin: string | null,                     // Departure gate at the origin airport.
    gate_destination: string | null,                // Arrival gate at the destination airport.
    terminal_origin: string | null,                 // Departure terminal at the origin airport.
    terminal_destination: string | null,            // Arrival terminal at the destination airport.
    type: 'General_Aviation' | 'Airline',           // Whether this is a commercial or general aviation flight.
    scheduled_out: string | null,                   // Scheduled gate departure time. String of ISO8601 date type.
    estimated_out: string | null,                   // Estimated gate departure time. String of ISO8601 date type.
    actual_out: string | null,                      // Actual gate departure time. String of ISO8601 date type.
    scheduled_off: string | null,                   // Scheduled runway departure time. String of ISO8601 date type.
    estimated_off: string | null,                   // Estimated runway departure time. String of ISO8601 date type.
    actual_off: string | null,                      // Actual runway departure time. String of ISO8601 date type.
    scheduled_on: string | null,                    // Scheduled runway arrival time. String of ISO8601 date type.
    estimated_on: string | null,                    // Estimated runway arrival time. String of ISO8601 date type.
    actual_on: string | null,                       // Actual runway arrival time. String of ISO8601 date type.
    scheduled_in: string | null,                    // Scheduled gate arrival time. String of ISO8601 date type.
    estimated_in: string | null,                    // Estimated gate arrival time. String of ISO8601 date type.
    actual_in: string | null,                       // Actual gate arrival time. String of ISO8601 date type.
    foresight_predictions_available: boolean,       // Indicates if Foresight predictions are available for AeroAPI /foresight endpoints.
}

/**
 * GET /flights/{ident} Response
 */
export type Flights = {
    links: { next: string } | null,                     // A link to the next set of records in a collection.
    status?: number,                                    // If present, this is actually an AeroAPIError. Will be 429 when rate-limited.
    num_pages: number,                                  // Constraints: Min 1
    flights: Flight[]                                   // An array of objects, one for each flight that matches the parameters presented
}

/**
 * GET /flights/{ident} Response
 */
export const FlightsSchema = {
    type: 'object',
    required: ['links', 'num_pages', 'flights'],
    properties: {
        links: {oneOf: [
            {
                type: 'object',
                properties: {
                    next: { type: 'string' }
                }
            },
            { type: 'null' }
        ]},
        status: { type: 'number' },
        num_pages: {oneOf: [
            { type: 'number' },
            { type: 'null' }
        ]},
        flights: {
            type: 'array',
            items: {
                type: 'object',
                required: ['ident', 'fa_flight_id', 'operator'],
                properties: {
                    ident: { type: 'string' },
                    ident_icao: { oneOf: [
                        { type: 'string' },
                        { type: 'null' }
                    ]},
                    ident_iata: { oneOf: [
                        { type: 'string' },
                        { type: 'null' }
                    ]},
                    fa_flight_id: { type: 'string' },
                    operator:{ oneOf: [
                        // { type: 'string' },
                        { type: 'null' }
                    ]}
                }
            }
        }
    }
}

/**
 * GET /flights/{id}/track Response
 */
export type FlightTrack = {
    status?: number,                                    // If present, this is actually an AeroAPIError. Will be 429 when rate-limited.
    positions: Position[]
}

// Generic position definition
export type Position = {
    fa_flight_id: string | null,                       // Unique identifier assigned by FlightAware to the flight with this position.This field is only populated by the / flights / search / positions(in other cases, the user will have already specified the fa_flight_id).
    altitude: number,                               // Aircraft altitude in hundreds of feet
    altitude_change: 'C' | 'D' | '-',               // C when the aircraft is climbing, D when descending, and - when the altitude is being maintained.
    groundspeed: number,                            // Most recent groundspeed(knots)
    heading: number,                                // Aircraft heading in degrees(0 - 360). Constraints: Min 0 | Max 360
    latitude: number,                               // Most recent latitude position
    longitude: number,                              // Most recent longitude position
    timestamp: string,                              // Time that position was received. String of ISO8601 date type.
    update_type: 'P' | 'O' | 'Z' | 'A' | 'M' | 'D' | 'X' | 'S' | null, // P  = projected, O = oceanic, Z = radar, A = ADS-B, M = multilateration, D = datalink, X = surface and near surface(ADS - B and ASDE - X), S = space - based
}

/**
 * GET /flights/{id}/route Response
 */
export type FlightRoute = {
    status?: number,                                    // If present, this is actually an AeroAPIError. Will be 429 when rate-limited.
    route_distance: string | null,                      // A text representation of about how long the route it. IE. '200 sm'
    fixes: Fix[]
}

// Generic fix definition
export type Fix = {
    name: string,                                   // Name of the route fix
    latitude: number | null,                        // Longitude of the fix in decimal degrees
    longitude: number | null,                       // Longitude of the fix in decimal degrees
    distance_from_origin: number | null,            // Distance from origin airport stated in statue miles, nautical miles or kilometers depending on FlightAware Account Display Options
    distance_this_leg: number | null,               // Distance from the last point on Route stated in statue miles, nautical miles or kilometers depending on FlightAware Account Display Options
    distance_to_destination: number | null,         // Distance to destination airport stated in statue miles, nautical miles or kilometers depending on FlightAware Account Display Options
    outbound_course: number | null,                 // Course in integer degrees from the current point to the next relative to true north
    type: string,                                   // Type of the fix(ie WAYPOINT / Reporting Point / Origin Airport / Destination Airport)
}

/**
 * GET /airports/nearby Response
 */
export type AirportsNearby = {
    status?: number,                                    // If present, this is actually an AeroAPIError. Will be 429 when rate-limited.
    links: {                                            // Object containing links to related resources.
        next: string,                                   // A link to the next set of records in a collection.
    },
    num_pages: number,                                  // Number of pages returned. Constraints: Min 1
    airports: {
        airport_code: string,                           // Default airport identifier, generally ICAO but may be IATA or LID if the airport lacks an ICAO code
        code_icao?: string | null,                      // ICAO identifier for the airport if known
        code_iata?: string | null,                      // IATA identifier for the airport if known
        code_lid?: string | null,                       // LID identifier for the airport if known
        alternate_ident: string | null,                 // IATA or LID identifier for the airport. (Deprecated, use code_iata for the IATA identifier or code_lid for the LID identifier instead.)
        name: string,                                   // Common name for the airport
        type?: 'Airport' | 'Heliport' | 'Seaplane Base' | 'Ultralight' | 'Stolport' | 'Gliderport' | 'Balloonport' | null, // Type of airport
        elevation: number,                              // Height above Mean Sea Level (MSL)
        city: string,                                   // Closest city to the airport
        state: string,                                  // State/province where the airport resides if applicable. For US states this will be their 2-letter code; for provinces or other entities, it will be the full name.
        longitude: number,                              // Airport's longitude, generally the center point of the airport
        latitude: number,                               // Airport's latitude, generally the center point of the airport
        timezone: string,                               // Applicable timezone for the airport, in the TZ database format
        country_code: string,                           // 2-letter code of country where the airport resides (ISO 3166-1 alpha-2)
        wiki_url: string | null,                        // Link to the wikipedia page for the airport
        airport_flights_url: string,                    // The URL to flights for this airport
        distance: number,                               // Distance of airport from the specified location (statute miles)
        heading: number,                                // Direction from specified location to airport (degrees). Constraints: Min 1|Max 360
        direction: 'N' | 'E' | 'S' | 'W' | 'NE' | 'SE' | 'SW' | 'NW' // Cardinal direction from specified location to airport
    }[]
}

/**
 * GET /airports/{ID} Response
 */
export type Airport = {
    status?: number,                                    // If present, this is actually an AeroAPIError. Will be 429 when rate-limited, or 400 if the airport does not exist
    airport_code: string,                               // Default airport identifier, generally ICAO but may be IATA or LID if the airport lacks an ICAO code
    code_icao?: string | null,                          // ICAO identifier for the airport if known
    code_iata?: string | null,                          // IATA identifier for the airport if known
    code_lid?: string | null,                           // LID identifier for the airport if known
    name: string                                        // Common name for the airport
    type?: 'Airport'|'Heliport'|'Seaplane Base'|'Ultralight'|'Stolport'|'Gliderport'|'Balloonport'|null // Type of airport
    elevation: number,                                  // Height above Mean Sea Level (MSL)
    city: string,                                       // Closest city to the airport
    state: string,                                      // State/province where the airport resides if applicable. For US states this will be their 2-letter code; for provinces or other entities, it will be the full name.
    longitude: number,                                  // Airport's longitude, generally the center point of the airport
    latitude: number,                                   // Airport's latitude, generally the center point of the airport
    timezone: string,                                   // Applicable timezone for the airport, in the TZ database format
    country_code: string,                               // 2-letter code of country where the airport resides (ISO 3166-1 alpha-2)
    wiki_url: string | null,                            // Link to the wikipedia page for the airport
    airport_flights_url: string,                        // The URL to flights for this airport
}

/**
 * AeroAPI Error response type. Check if 'status' exists on other response types to see if it is actually this response type.
 */
export type AeroAPIError = {
    title: string,          // Short summary of the type of error encountered.
    reason: string,         // Error type name directly from the backend.
    detail: string,         // More detailed description of the error, possibly including information about specific invalid fields or remediation steps.
    status: number          // The HTTP response code returned as part of the error. Will be 429 when rate-limited.
}