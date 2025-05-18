import type { Prisma } from '@prisma/client';
import type * as types from './';
import type { ObjectType, SettingsSet, TypeName } from '$lib/server/settings';
import * as _responses from './responses';
import * as _form from './form';
import * as validators from './prisma';
import type { TimeZone } from '@vvo/tzdb';

/**
 * API Namespace that defines the contents of every API payload
 */
namespace API {
	// Export some tools that can be used to make Prisma requests if needed
	export namespace Tools {
		
	}

	// Export all types that the API can carry
	export namespace Types {
		export type Airport = Prisma.AirportGetPayload<{
			select: {
				id: true,
				timezone: true,
				name: true
			}
		}>

		export type ApproachOption = Prisma.ApproachOptionsGetPayload<{}>;

		export type Tour = Prisma.TourGetPayload<{}>;
		export type Aircraft = Prisma.AircraftGetPayload<{ include: { type: true } }>;
		export type Reg = Prisma.AircraftRegistrationLookupGetPayload<{}>;
	}

	// Export the basic response with all the available API responses
	export type Response =
		| Error
		| General
		| Boolean
		| Airports
		| Airport
		| Aircraft
		| Approach
		| TourList
		| FAAReg
		| HomeTimeZone

	// Create a basic API interface that all other APIs will extend
	interface API {
		status: number;
		ok: boolean;
	}

	// Export basic functions
	export const response = _responses;

	export namespace Form {
		export type Type = _form.Type;
		export const formFailure = _form.formFailure;
		export const formSuccess = _form.formSuccess;
	}

	// Export a basic Error API response
	export interface Error extends API {
		ok: false;
		message: string;
		code?: number;
	}

	// Create a basic Success API response. All other API responses will extend this response.
	interface Success extends API {
		ok: true;
		type: string;
	}

	export interface General extends Success {
		type: 'general';
	}

	export interface Boolean extends Success {
		type: 'boolean';
		value: boolean;
	}

	export interface Airports extends Success {
		type: 'airports';
		airports: Types.Airport[]
	}

	export interface Airport extends Success {
		type: 'airport';
		airport: Types.Airport
	}

	export interface Aircraft extends Success {
		type: 'aircraft';
		aircraft: Types.Aircraft
	}

	export interface FAAReg extends Success {
		type: 'faa';
		aircraft: Types.Reg
	}

	export interface Approach extends Success {
		type: 'approach';
		options: Types.ApproachOption[]
	}

	export interface HomeTimeZone extends Success {
		type: 'timezone-home';
		data: TimeZone;
		prefers_utc: boolean;
	}

	export interface TourList extends Success {
		type: 'tours';
		tours: Types.Tour[]
	}
}

// Export default
export default API;
