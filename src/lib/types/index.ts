import type { Prisma } from '@prisma/client';
import type * as validators from './prisma';

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



export enum ImageUploadState {
	NO_CHANGE = 'NO_CHANGE',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE'
}