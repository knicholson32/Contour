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
	sim: true,
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

// ------------------------------------------------------------------------------------------------
// Nav Data Types
// ------------------------------------------------------------------------------------------------

export type NavNav = {
	EFF_DATE: string,
	NAV_ID: string,
	NAV_TYPE: string,
	STATE_CODE: string,
	CITY: string,
	COUNTRY_CODE: string,
	NAV_STATUS: string,
	NAME: string,
	STATE_NAME: string,
	REGION_CODE: string,
	COUNTRY_NAME: string,
	FAN_MARKER: string,
	OWNER: string,
	OPERATOR: string,
	NAS_USE_FLAG: string,
	PUBLIC_USE_FLAG: string,
	NDB_CLASS_CODE: string,
	OPER_HOURS: string,
	HIGH_ALT_ARTCC_ID: string,
	HIGH_ARTCC_NAME: string,
	LOW_ALT_ARTCC_ID: string,
	LOW_ARTCC_NAME: string,
	LAT_DEG: string,
	LAT_MIN: string,
	LAT_SEC: string,
	LAT_HEMIS: string,
	LAT_DECIMAL: string,
	LONG_DEG: string,
	LONG_MIN: string,
	LONG_SEC: string,
	LONG_HEMIS: string,
	LONG_DECIMAL: string,
	SURVEY_ACCURACY_CODE: string,
	TACAN_DME_STATUS: string,
	TACAN_DME_LAT_DEG: string,
	TACAN_DME_LAT_MIN: string,
	TACAN_DME_LAT_SEC: string,
	TACAN_DME_LAT_HEMIS: string,
	TACAN_DME_LAT_DECIMAL: string,
	TACAN_DME_LONG_DEG: string,
	TACAN_DME_LONG_MIN: string,
	TACAN_DME_LONG_SEC: string,
	TACAN_DME_LONG_HEMIS: string,
	TACAN_DME_LONG_DECIMAL: string,
	ELEV: string,
	MAG_VARN: string,
	MAG_VARN_HEMIS: string,
	MAG_VARN_YEAR: string,
	SIMUL_VOICE_FLAG: string,
	PWR_OUTPUT: string,
	AUTO_VOICE_ID_FLAG: string,
	MNT_CAT_CODE: string,
	VOICE_CALL: string,
	CHAN: string,
	FREQ: string,
	MKR_IDENT: string,
	MKR_SHAPE: string,
	MKR_BRG: string,
	ALT_CODE: string,
	DME_SSV: string,
	LOW_NAV_ON_HIGH_CHART_FLAG: string,
	Z_MKR_FLAG: string,
	FSS_ID: string,
	FSS_NAME: string,
	FSS_HOURS: string,
	NOTAM_ID: string,
	QUAD_IDENT: string,
	PITCH_FLAG: string,
	CATCH_FLAG: string,
	SUA_ATCAA_FLAG: string,
	RESTRICTION_FLAG: string,
	HIWAS_FLAG: string,
}

export type NavFix = {
	EFF_DATE: string,
	FIX_ID: string,
	ICAO_REGION_CODE: string,
	STATE_CODE: string,
	COUNTRY_CODE: string,
	LAT_DEG: string,
	LAT_MIN: string,
	LAT_SEC: string,
	LAT_HEMIS: string,
	LAT_DECIMAL: string,
	LONG_DEG: string,
	LONG_MIN: string,
	LONG_SEC: string,
	LONG_HEMIS: string,
	LONG_DECIMAL: string,
	FIX_ID_OLD: string,
	CHARTING_REMARK: string,
	FIX_USE_CODE: string,
	ARTCC_ID_HIGH: string,
	ARTCC_ID_LOW: string,
	PITCH_FLAG: string,
	CATCH_FLAG: string,
	SUA_ATCAA_FLAG: string,
	MIN_RECEP_ALT: string,
	COMPULSORY: string,
	CHARTS: string,
}

export type NavAirway = {
	EFF_DATE: string,
	REGULATORY: string,
	AWY_DESIGNATION: string,
	AWY_LOCATION: string,
	AWY_ID: string,
	UPDATE_DATE: string,
	REMARK: string,
	AIRWAY_STRING: string,
}

export type NavDPRoute = {
	EFF_DATE: string,
	DP_NAME: string,
	ARTCC: string,
	DP_COMPUTER_CODE: string,
	ROUTE_PORTION_TYPE: string,
	ROUTE_NAME: string,
	BODY_SEQ: string,
	TRANSITION_COMPUTER_CODE: string,
	POINT_SEQ: string,
	POINT: string,
	ICAO_REGION_CODE: string,
	POINT_TYPE: string,
	NEXT_POINT: string,
	ARPT_RWY_ASSOC: string
}

export type NavSTARRoute = {
	EFF_DATE: string,
	STAR_COMPUTER_CODE: string,
	ARTCC: string,
	ROUTE_PORTION_TYPE: string,
	ROUTE_NAME: string,
	BODY_SEQ: string,
	TRANSITION_COMPUTER_CODE: string,
	POINT_SEQ: string,
	POINT: string,
	ICAO_REGION_CODE: string,
	POINT_TYPE: string,
	NEXT_POINT: string,
	ARPT_RWY_ASSOC: string
}