import * as types from '$lib/types';
import prisma from '$lib/server/prisma';
import * as crypto from 'node:crypto';
import * as helpers from '$lib/server/helpers';
import type { Prisma } from '@prisma/client';

export const TypeNames = {
	// Entry ---------------------------------
	'entry.tour.current': -1,
	'entry.day.entry.state': types.DayNewEntryState.NOT_STARTED,
	'entry.day.entry.fa_id': '',
	'entry.day.entry.fa_link': '',
	'entry.flight_id.last': '',
	'entry.day.current': -1,
	'entry.defaultFlightID': 'EJA',
	'entry.entryMXMode': false,
	// Tour ----------------------------------
	'tour.defaultStartApt': 'KPDK',
	// System --------------------------------
	'system.debug': 0,
	'system.lastSeenCommit': '',
	// Data ----------------------------------
	'data.approaches.lastSync': -1,
	'data.approaches.source': '',
	'data.aircraftReg.lastSync': -1,
	'data.navData.lastSync': -1,
	'data.navData.validDate': -1,
	'data.navData.source': '',
	// General -------------------------------
	'general.encKey': 'UNSET',
	'general.aeroAPI': '',
	'general.email': '',
	'general.name': '',
	'general.gravatar.hash': '00000000000000000000000000000000',
	'general.timezone': process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone
};

export type TypeName = keyof typeof TypeNames;

export type ObjectType<T extends TypeName> = 
	T extends 'entry.tour.current' ? number : 		// Integer
	T extends 'entry.day.current' ? number : 			// Integer
	T extends 'entry.day.entry.state' ? types.DayNewEntryState : // DayNewEntryState
	T extends 'entry.day.entry.fa_id' ? string :  // String
	T extends 'entry.day.entry.fa_link' ? string :  // String
	T extends 'entry.flight_id.last' ? string :		// String
	T extends 'entry.defaultFlightID' ? string : 	// String
	T extends 'entry.defaultStartApt' ? string : 	// String
	T extends 'entry.entryMXMode' ? boolean : // Boolean
	T extends 'system.debug' ? number : 					// Integer
	T extends 'system.lastSeenCommit' ? string :  // String
	T extends 'data.approaches.lastSync' ? number :	// Integer
	T extends 'data.approaches.source' ? string :	// String
	T extends 'data.aircraftReg.lastSync' ? number : // Integer
	T extends 'data.navData.lastSync' ? number :  // Integer
	T extends 'data.navData.validDate' ? number :	// Integer
	T extends 'data.navData.source' ? string :	// String
	T extends 'general.encKey' ? string : 				// String
	T extends 'general.aeroAPI' ? string : 				// String
	T extends 'general.email' ? string : 				  // String
	T extends 'general.name' ? string : 				  // String
	T extends 'general.gravatar.hash' ? string : 	// String
	T extends 'general.timezone' ? string : 			// String
	string;

// -------------------------------------------------------------------------------------------------
// Settings
// -------------------------------------------------------------------------------------------------

export type SettingPayload = Prisma.SettingsGetPayload<{}>;

/**
 * Get a setting from the DB
 * @param setting the setting to get
 * @returns the setting
 */
export const get = async <T extends TypeName>(setting: T, settingVal?: SettingPayload | null): Promise<ObjectType<T>> => {
	// Make sure the setting can exist
	if (!(setting in TypeNames)) throw Error(`Unknown setting: ${setting}`);

	// TODO: Cache some of these settings? Maybe the frequent ones? That way we don't have to do a DB
	//       call every time. Would only make sense for some settings though. Makes even less sense
	//       now that we have `getMany`.

	// Pull the setting from the DB
	if (settingVal === undefined)
		settingVal = await prisma.settings.findUnique({ where: { setting } });

	// Check if it exists
	if (settingVal !== undefined && settingVal !== null) {
		// It does. Fetch, cast and return.
		switch (setting) {
			// Boolean Conversion ------------------------------------------------------------------------
			case 'entry.entryMXMode':
				return (settingVal.value === 'true' ? true : false) as ObjectType<T>;

			// Integer Conversion ------------------------------------------------------------------------
			case 'entry.tour.current':
			case 'entry.day.current':
			case 'system.debug':
			case 'data.approaches.lastSync':
			case 'data.aircraftReg.lastSync':
			case 'data.navData.lastSync':
			case 'data.navData.validDate':
				return parseInt(settingVal.value) as ObjectType<T>;

			// Float Conversion --------------------------------------------------------------------------
			// case '':
			// 	return parseFloat(settingVal.value) as ObjectType<T>;

			// String Conversion -------------------------------------------------------------------------
			case 'entry.defaultFlightID':
			case 'entry.day.entry.fa_id':
			case 'entry.day.entry.fa_link':
			case 'entry.flight_id.last':
			case 'tour.defaultStartApt':
			case 'data.approaches.source':
			case 'data.navData.source':
			case 'system.lastSeenCommit':
			case 'general.encKey':
			case 'general.email':
			case 'general.name':
			case 'general.gravatar.hash':
			case 'general.timezone':
				return settingVal.value as ObjectType<T>;

			// Encrypted Strings -------------------------------------------------------------------------
			case 'general.aeroAPI':
				return (await helpers.decrypt(settingVal.value)) as ObjectType<T>;

			// Enum Conversion ---------------------------------------------------------------------------
			case 'entry.day.entry.state':
				return settingVal.value as ObjectType<T>;

			// Unknown -----------------------------------------------------------------------------------
			default:
				throw Error(`Unknown setting: ${setting}`);
		}
	} else {
		// It does not. Assign the default to the DB and return the default value.

		// First, check if this is a setting that needs a special default
		if (setting === 'general.encKey') {
			// It is. Generate the default
			const defaultVal = crypto.randomBytes(32).toString('hex') as ObjectType<T>;
			console.log('def', setting, defaultVal);
			await prisma.settings.create({ data: { setting, value: defaultVal.toString() } });
			// Return the default value
			return defaultVal;
		}

		// It is not. Get the default setting
		const defaultVal = TypeNames[setting] as unknown as ObjectType<T>;

		// Write the default value to the DB
		await prisma.settings.create({ data: { setting, value: defaultVal.toString() } });

		// Return the default value
		return defaultVal;
	}
};

// Generate two helpers types that will allow us to select based on the settings
export type SettingsSet<T extends TypeName, Prefix extends string> = T extends `${Prefix}.${infer Rest}` ? T : never;
type SettingsPrefix<T extends TypeName, Prefix extends string> = T extends `${Prefix}.${infer Rest}` ? Prefix : never;

/**
 * Get a set of settings, as long as they match a certain prefix
 * @param prefix the prefix to match
 * @returns an object with the settings
 */
export const getSet = async <Prefix extends string>(prefix: SettingsPrefix<TypeName, Prefix>): Promise<{ [K in SettingsSet<TypeName, Prefix>]: ObjectType<K> }> => {
	// Get the possible settings keys based on the prefix
	const keys = (Object.keys(TypeNames) as TypeName[]).filter((key) => key.startsWith(prefix)) as SettingsSet<TypeName, Prefix>[];
	// Initialize a resulting settings object, typed to only include the settings we will return
	const settings = {} as { [K in (typeof keys)[number]]: ObjectType<K> };

	// Get the settings from the DB
	const manySettings = await prisma.settings.findMany({where: { setting: { startsWith: prefix } } });

	// Loop through the possible settings
	for (const key of keys) {
		// If the setting does not exist, error. Since we generated the keys array right above this, we should never get this error.
		if (!(key in TypeNames)) throw Error(`Unknown setting: ${key}`);
		// Find the setting from the DB, if it is in there
		const keyIdx = manySettings.findIndex((s) => s.setting === key);
		// If it is, pass it to the basic `get` function so it can be properly cast
		if (keyIdx !== -1) settings[key] = (await get(key, manySettings[keyIdx])) as never;
		// If not, return a default value
		else settings[key] = TypeNames[key] as never;
	}

	// Return the settings
	return settings;
};

// Generate a helper type that will allow us to select based on settings
type FilterSettingsMany<T extends TypeName, Search extends string> = T extends `${Search}` ? T : never;

/**
 * Get many fully-qualified settings
 * @param settings the settings to get
 * @returns an object with the settings
 */
export const getMany = async <T extends TypeName>(...settings: T[]): Promise<{ [K in FilterSettingsMany<TypeName, T>]: ObjectType<K> }> => {
	// Get the possible settings keys based on the inputs. This protects against uncaught typescript errors
	const keys: TypeName[] = [];
	for (const setting of settings) if (setting in TypeNames) keys.push(setting);
	// Initialize a resulting settings object, typed to only include the settings we will return
	const results = {} as { [K in (typeof keys)[number]]: ObjectType<K> };

	// Get the settings from the DB
	const manySettings = await prisma.settings.findMany({ where: { setting: { in: settings } } });

	// Loop through the requested settings
	for (const key of keys) {
		// If the setting does not exist, error.
		if (!(key in TypeNames)) throw Error(`Unknown setting: ${key}`);
		// Find the setting from the DB, if it is in there
		const keyIdx = manySettings.findIndex((s) => s.setting === key);
		// If it is, pass it to the basic `get` function so it can be properly cast
		if (keyIdx !== -1) results[key] = (await get(key, manySettings[keyIdx])) as never;
		// If not, return a default value
		else results[key] = TypeNames[key] as never;
	}

	// Return the settings
	return results;
};

/**
 * Set a setting in the database
 * @param setting the setting to modify
 * @param value the value to set it to
 */
export const set = async <T extends TypeName>(setting: T, value: ObjectType<T>) => {
	// Make sure the setting can exist
	if (!(setting in TypeNames)) throw Error(`Unknown setting: ${setting}`);

	if (setting === 'general.aeroAPI') {
		value = (await helpers.encrypt(value as string)) as ObjectType<T>;
	}

	// Create or modify the value
	await prisma.settings.upsert({
		create: {
			setting,
			value: value.toString()
		},
		update: {
			value: value.toString()
		},
		where: { setting }
	});
};
