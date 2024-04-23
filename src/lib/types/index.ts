import type { Prisma } from '@prisma/client';

export { DB } from './prisma';

// -------------------------------------------------------------------------------------------------
// Country Codes
// -------------------------------------------------------------------------------------------------

export type CountryCode = 'us' | 'ca' | 'uk' | 'au' | 'fr' | 'de' | 'jp' | 'it' | 'in';
export const countryCodes = [
	{ code: 'us' satisfies CountryCode, name: 'United States' },
	{ code: 'ca' satisfies CountryCode, name: 'Canada' },
	{ code: 'uk' satisfies CountryCode, name: 'United Kingdom' },
	{ code: 'au' satisfies CountryCode, name: 'Australia' },
	{ code: 'fr' satisfies CountryCode, name: 'France' },
	{ code: 'de' satisfies CountryCode, name: 'Germany' },
	{ code: 'jp' satisfies CountryCode, name: 'Japan' },
	{ code: 'it' satisfies CountryCode, name: 'Italy' },
	{ code: 'in' satisfies CountryCode, name: 'India' }
];

export { default as API } from './api';


// ------------------------------------------------------------------------------------------------
// Application Enums
// ------------------------------------------------------------------------------------------------


export enum ImageUploadState {
	NO_CHANGE = 'NO_CHANGE',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE'
}

export enum DayNewEntryState {
	NOT_STARTED = 'NOT_STARTED',
	LINK_ENTERED = 'LINK_ENTERED',
	LINK_CONFIRMED = 'LINK_CONFIRMED',
}


// ------------------------------------------------------------------------------------------------
// ForeFlight KML
// ------------------------------------------------------------------------------------------------

export type GXTrack = {
	name: string,
	styleURL: string,
	'gx:Track': {
		altitudeMode: string[],
		extrude: number,
		'gx:interpolate': number,
		'gx:coord': string[],
		when: string[]
	}
}

export type Point = {
	name: string,
	Point: {
		coordinates: string
	}
}

export type KML = {
	'?xml': string,
	kml: {
		Document: {
			ExtendedData: {
				Data: {
					displayName?: string,
					value: string,
					'@_name': string
				}[],
				SchemaData: {
					'gx:SimpleArrayData': {
						'gx:value': number[],
						'@_name': string
					}[]
				}
			},
			Placemark: (GXTrack | Point)[],
			style: {
				LineStyle?: { color: string, width: number, '@_id': string },
				PolyStyle?: { color: string, '@_id': string },
				IconStyle?: { Icon: { href: string }, '@_id': string},
			}[],
			open: number,
			visibility: number
		}
	}
}

// ------------------------------------------------------------------------------------------------
// Leg Types
// ------------------------------------------------------------------------------------------------

export const legSelector = {
	id: true,
	dayId: true,
	day: {
		select: {
			startTime_utc: true
		}
	},
	originAirportId: true,
	destinationAirportId: true,
	diversionAirportId: true,
	startTime_utc: true,
	endTime_utc: true,
	totalTime: true,
	aircraft: {
		select: {
			registration: true,
			id: true,
			type: {
				select: {
					typeCode: true
				}
			}
		}
	},
	_count: {
		select: {
			approaches: true,
			positions: true
		}
	}
} satisfies Prisma.LegSelect;

export type Entry = Prisma.LegGetPayload<{ select: typeof legSelector }>;