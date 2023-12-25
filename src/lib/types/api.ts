import type { Prisma } from '@prisma/client';
import type * as types from './';
import type { ObjectType, SettingsSet, TypeName } from '$lib/server/settings';
import * as _responses from './responses';
import * as validators from './prisma';

/**
 * API Namespace that defines the contents of every API payload
 */
namespace API {
	// Export some tools that can be used to make Prisma requests if needed
	export namespace Tools {
		
	}

	// Export all types that the API can carry
	export namespace Types {

	}

	// Export the basic response with all the available API responses
	export type Response =
		| Error
		| General
		| Boolean

	// Create a basic API interface that all other APIs will extend
	interface API {
		status: number;
		ok: boolean;
	}

	// Export basic functions
	export const response = _responses;

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
}

// Export default
export default API;
