import { browser } from '$app/environment';
import * as https from 'https';
import * as dateFns from 'date-fns';
import icons from '$lib/components/icons';
import { getTimeZones, type TimeZone } from '@vvo/tzdb';
import type API from '$lib/types/api';

const timeZonesWithUtc = getTimeZones({ includeUtc: true });
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Get an airport from the ICAO identifier
 * @param icao the ICAO identifier
 * @param airports the list of airports (from the API)
 * @returns the airport, if it exists
 */
export const getAirportFromICAO = (icao: string | null, airports: API.Types.Airport[]): API.Types.Airport | null => {
	if (icao === null) return null;
	for (const airport of airports) if (airport.id === icao) return airport;
	return null;
}

export const timeToTimezoneToString = (unix: number, timezone: TimeZone | null) => {
	if (timezone === null) return null;
	const date = new Date((unix + timezone.rawOffsetInMinutes * 60) * 1000);
	return `${pad(date.getUTCHours(), 2)}:${pad(date.getUTCMinutes(), 2)} ${timezone.abbreviation}`;
}

export const duration = (start: number, end: number) => {
	const diff = end - start;
	const date = new Date(diff * 1000);
	return `${date.getUTCHours()}h ${date.getUTCMinutes()}m`
}

/**
 * Get a TimeZone object from the timezone string
 * @param timezone the timezone string
 * @returns the TimeZone object
 */
export const getTimezoneObjectFromTimezone = (timezone: string | null): TimeZone | null => {
	if (timezone === null) return null;
	const timeZones = getTimeZones({ includeUtc: true });
	const tzObj = timeZones.find((timeZone) => timezone === timeZone.name || timeZone.group.includes(timezone));
	if (tzObj === undefined) return null;
	return tzObj;
}

/**
 * Get a one-line short representation of a date string
 * @param unix the date
 * @returns the string
 */
export const getInlineDateUTC = (unix: number) => {
	const now = new Date(unix * 1000);
	return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1, 2)}-${pad(now.getUTCDate(), 2)}`;
}

/**
 * Get a one-line short representation of a date string
 * @param unix the date
 * @returns the string
 */
export const getInlineDateUTCFA = (unix: number) => {
	const now = new Date(unix * 1000);
	return `${pad(now.getUTCDate(), 2)}-${months[now.getUTCMonth()]}-${now.getUTCFullYear()}`;
}

export const getWeekdayUTC = (unix: number) => {
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const now = new Date(unix * 1000);
	return days[now.getUTCDay()];
}

/**
 * Get a one-line short representation of a date string in March 1st format
 * @param unix the date
 * @returns the string
 */
export const getInlineDateUTCPretty = (unix: number) => {
	const now = new Date(unix * 1000);
	return `${monthsFull[now.getUTCMonth()]} ${ordinalSuffix(now.getUTCDate())}`;
}

export const ordinalSuffix = (i: number) => {
	let j = i % 10,
			k = i % 100;
	if (j === 1 && k !== 11) {
			return i + "st";
	}
	if (j === 2 && k !== 12) {
			return i + "nd";
	}
	if (j === 3 && k !== 13) {
			return i + "rd";
	}
	return i + "th";
}

/**
 * Get HH:MM Z from a date object
 * @param date the date object
 * @returns the string
 */
export const getHoursMinutesUTC = (date: Date, includeZ = true) => `${pad(date.getUTCHours(), 2)}:${pad(date.getMinutes(), 2)}${includeZ ? 'Z' : ''}`;

/**
 * Convert a time string from the TimePicker Entry component to a UTC unix timestamp to store in the DB
 * @param time the time string
 * @param timezone the timezone
 * @returns the unix timestamp
 */
export const timeStrAndTimeZoneToUTC = (time: string | null, timezone: string): {value: number, raw: TimeZone} | null => {
	if (time === null || time === undefined) return null;
	const timeZones = getTimeZones({ includeUtc: true });
	const showTimeTZValue = timeZones.find((timeZone) => timezone === timeZone.name || timeZone.group.includes(timezone));
	if (showTimeTZValue === undefined) return null;
	return {
		value: Math.floor(new Date(time + '+00:00').getTime() / 1000) - (showTimeTZValue.rawOffsetInMinutes * 60),
		raw: showTimeTZValue
	}
}

/**
 * Convert a date object into a date string that the TimePicker Entry component can accept
 * @param now the date object
 * @param dateOnly whether this is date-only (no time)
 * @returns the date string
 */
export const dateToDateStringForm = (unixTime: number, dateOnly: boolean, timezone: string) => {

	const timeZones = getTimeZones({ includeUtc: true });
	const tzValue = timeZones.find((timeZone) => {
		return timezone === timeZone.name || timeZone.group.includes(timezone);
	});

	const now = new Date((unixTime + (tzValue?.rawOffsetInMinutes ?? 0) * 60) * 1000);

	if (dateOnly) {
		return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1, 2)}-${pad(now.getUTCDate(), 2)}`;
	} else {
		return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1, 2)}-${pad(now.getUTCDate(), 2)}T${pad(now.getUTCHours(), 2)}:${pad(now.getUTCMinutes(), 2)}`;
	}
}

/**
 * Convert a date object into a date and time string in UTC: 03/12/24 17:22Z
 * @param now the date object
 * @returns the date string
 */
export const dateToTimeStringForm = (unixTime: number) => {
	const now = new Date(unixTime * 1000);
	return `${pad(now.getUTCMonth() + 1, 2)}/${pad(now.getUTCDate(), 2)}/${now.getUTCFullYear()} ${pad(now.getUTCHours(), 2)}:${pad(now.getUTCMinutes(), 2)}Z`;
}

/**
 * Convert a date object into a date and time string in local timezone: 03/12 or 03/12/25
 * @param now the date object
 * @returns the date string
 */
export const dateToDateStringFormSimple = (unixTime: number, year: boolean = false) => {
	const now = new Date(unixTime * 1000);
	if (year) return `${pad(now.getUTCMonth() + 1, 2)}/${pad(now.getUTCDate(), 2)}/${now.getUTCFullYear() - 2000}`;
	else return `${pad(now.getUTCMonth() + 1, 2)}/${pad(now.getUTCDate(), 2)}`;
}

/**
 * Get the ordinal for a number (up to 31)
 * @see https://stackoverflow.com/questions/15397372/javascript-new-date-ordinal-st-nd-rd-th
 * @param d the number
 * @returns the ordinal
 */
export const nth = (d: number) => {
	if (d > 3 && d < 21) return 'th';
	switch (d % 10) {
		case 1: return "st";
		case 2: return "nd";
		case 3: return "rd";
		default: return "th";
	}
};

/**
 * Convert a date object into a date and time string in local timezone: March 12, 2024
 * @param now the date object
 * @returns the date string
 */
export const dateToDateStringFormMonthDayYear = (unixTime: number) => {
	const now = new Date(unixTime * 1000);
	const day = now.getUTCDate();
	return `${months[now.getUTCMonth()]} ${day}, ${now.getUTCFullYear()}`;
}

/**
 * Convert a date object into a date and time string in local timezone: 19:19Z
 * @param now the date object
 * @returns the date string
 */
export const dateToTimeStringZulu = (unixTime: number) => {
	const now = new Date(unixTime * 1000);
	return `${pad(now.getUTCHours(), 2)}:${pad(now.getUTCMinutes(), 2)}Z`;
}

/**
 * Validate a URL
 * @see https://www.makeuseof.com/regular-expressions-validate-url/
 * @param url the URL to validate
 * @returns Whether or not it was valid
 */
export const validateURL = (url: string) => {
	return /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g.test(
		url
	);
};

/**
 * Delay for a number of ms
 * @param ms the number of ms to delay for
 * @returns the promise
 */
export const delay = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
export const sleep = delay;

/**
 * Fetch data from a URL
 * @param url the URL to fetch from
 * @returns the data
 */
export const fetchString = async (url: string): Promise<string> => {
	return new Promise((resolve) => {
		let data = '';
		https.get(url, (res) => {
			res.on('data', (chunk) => (data += chunk));
			res.on('end', () => resolve(data));
		});
	});
};

export { fetchString as fetch };

/**
 * Fetch (and therefore cache) the new latest legs segment data for the overview map
 */
export const preloadLegOverview = async () => {
	const v = await ((await fetch('/api/legs/version')).json()) as { ok: boolean, version: number };
	if (v.ok === true) await fetch(`/api/legs?v=${v.version}`);
}

/**
 * Deletes queries from the URL without affecting the search history
 *
 * @see https://dev.to/mohamadharith/mutating-query-params-in-sveltekit-without-page-reloads-or-navigations-2i2b
 *
 * @param params a string array of the params to delete
 */
export const deleteQueries = (params: string[]) => {
	// This can only run in the browser
	if (!browser) return;
	const url = new URL(window.location.toString());
	for (const param of params) url.searchParams.delete(param);
	history.replaceState({}, '', url);
};


export const weekDays = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
]

export const weekDaysShort = [
	'Sun',
	'Mon',
	'Tues',
	'Wed',
	'Thu',
	'Fri',
	'Sat',
]

export const weekDays2Char = [
	'Su',
	'Mo',
	'Tu',
	'We',
	'Th',
	'Fr',
	'Sa',
]

/**
 * Take a URL and modify the active param while keeping other params intact
 * @param url the URL
 * @param active what to set active to
 * @returns the search params as a string, without the '?'
 */
export const setActive = (url: URL, active: 'form' | 'menu') => {
	url.searchParams.delete('active');
	url.searchParams.append('active', active);
	return url.searchParams.toString();
}

// https://gist.github.com/jonleighton/958841
export const base64ArrayBuffer = (arrayBuffer: ArrayBuffer): string => {
	var base64 = '';
	var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	var bytes = new Uint8Array(arrayBuffer);
	var byteLength = bytes.byteLength;
	var byteRemainder = byteLength % 3;
	var mainLength = byteLength - byteRemainder;

	var a, b, c, d;
	var chunk;

	// Main loop deals with bytes in chunks of 3
	for (var i = 0; i < mainLength; i = i + 3) {
		// Combine the three bytes into a single integer
		chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

		// Use bitmasks to extract 6-bit segments from the triplet
		a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
		b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
		c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
		d = chunk & 63; // 63       = 2^6 - 1

		// Convert the raw binary segments to the appropriate ASCII encoding
		base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
	}

	// Deal with the remaining bytes and padding
	if (byteRemainder == 1) {
		chunk = bytes[mainLength];

		a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

		// Set the 4 least significant bits to zero
		b = (chunk & 3) << 4; // 3   = 2^2 - 1

		base64 += encodings[a] + encodings[b] + '==';
	} else if (byteRemainder == 2) {
		chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

		a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
		b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

		// Set the 2 least significant bits to zero
		c = (chunk & 15) << 2; // 15    = 2^4 - 1

		base64 += encodings[a] + encodings[b] + encodings[c] + '=';
	}

	return base64;
};

// https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
export const toBuffer = (arrayBuffer: ArrayBuffer): Buffer => {
	const buffer = Buffer.alloc(arrayBuffer.byteLength);
	const view = new Uint8Array(arrayBuffer);
	for (let i = 0; i < buffer.length; ++i) {
		buffer[i] = view[i];
	}
	return buffer;
};

export class RunTime {
	_value_s: number;
	constructor(options: { min?: number; s?: number }) {
		if (options.s !== undefined) {
			this._value_s = options.s;
		} else if (options.min !== undefined) {
			this._value_s = dateFns.minutesToSeconds(options.min);
		} else {
			throw new Error(
				`Must set a value of either seconds or minutes for RunTime. See options in constructor.`
			);
		}
	}

	public compareDuration(r: RunTime): number {
		const res = this._value_s / r._value_s;
		if (isNaN(res)) return 0;
		else return res;
	}

	public get hours(): number {
		return Math.ceil(this._value_s / 60 / 60);
	}

	public get minutes(): number {
		return Math.ceil(this._value_s / 60);
	}

	public get hoursMinutes(): { h: number; m: number } {
		const h = this._value_s / 60 / 60;
		return {
			h: Math.floor(h),
			m: Math.round((h % 1) * 60)
		};
	}

	public get hoursMinutesSeconds(): { h: number; m: number; s: number } {
		// 68580 => 19.05 hr
		const h = this._value_s / 60 / 60;
		const m = (h % 1) * 60;
		const s = Math.round((m % 1) * 60);
		return {
			h: Math.floor(h),
			m: Math.floor(m) + (s === 60 ? 1 : 0),
			s: s === 60 ? 0 : s
		};
	}

	public get h(): number {
		return this.hours;
	}

	public get m(): number {
		return this.minutes;
	}

	public get hm(): { h: number; m: number } {
		return this.hoursMinutes;
	}

	public get hms(): { h: number; m: number; s: number } {
		return this.hoursMinutesSeconds;
	}

	toFormat(): string {
		return dateFns.formatDistance(this._value_s * 1000, 0, { includeSeconds: true });
	}

	toDirectFormat(): string {
		const hm = this.hoursMinutes;
		return hm.h.toString().padStart(2, '0') + ':' + hm.m.toString().padStart(2, '0');
	}

	toDirectFormatFull(): string {
		const hms = this.hoursMinutesSeconds;
		return (
			hms.h.toString().padStart(2, '0') +
			':' +
			hms.m.toString().padStart(2, '0') +
			':' +
			hms.s.toString().padStart(2, '0')
		);
	}
}

/**
 * Round a number to a certain precision
 * @param n the number
 * @param p the precision. Defaults to 2.
 * @returns the rounded number
 */
export const round = (n: number, p = 2) => ((e) => Math.round(n * e) / e)(Math.pow(10, p));

/**
 * Get the ISO string for the local timezone
 * @param date_ms the date in ms
 * @param tz the TZ
 * @returns the ISO string for the local timezone
 */
export const toISOStringTZ = (date_ms: number, tz: string) => {
	const match = timeZonesWithUtc.find((v) => v.name === tz);
	if (match === undefined) return new Date(date_ms).toISOString();
	var tzoffset = -match.rawOffsetInMinutes * 60000; //offset in milliseconds
	return new Date(date_ms - tzoffset).toISOString().slice(0, -1) + match.abbreviation;
};

/**
 * Capitalize the first letter of a string
 * @param string the string
 * @returns the string with the first letter capitalized
 */
export const capitalizeFirstLetter = (string: string): string => {
	return string.charAt(0).toUpperCase() + string.slice(1);
};

export const truncateString = (str: string, num: number) => {
	// If the length of str is less than or equal to num
	// just return str--don't truncate it.
	if (str.length <= num) {
		return str;
	}
	// Return str truncated with '...' concatenated to the end of str.
	return str.slice(0, num) + '...';
};

/**
 * Array join, but only a certain number of elements. After that, add the post text instead
 * @param arr the array to join
 * @param limit max number of elements allowed
 * @param join the join string
 * @param postText the text to add at the end
 * @returns the joined array with a limited number of elements
 */
export const joinWithLimit = (
	arr: string[],
	limit: number,
	join: string = ', ',
	postText = 'and others'
): string => {
	if (arr.length <= limit) return arr.join(join);
	const reduced = arr.slice(0, limit);
	return reduced.join(join) + ' ' + postText;
};

/**
 * Basic plural string generation
 * @param base the base word, like 'Book' or 'Lens'
 * @param num the number of that item being represented
 * @returns the base with the proper plural ending
 */
export const basicPlural = (base: string, num: number) => {
	if (num === 1 || num === -1) {
		return base;
	} else {
		if (base.endsWith('s')) {
			return base + 'es';
		} else {
			return base + 's';
		}
	}
};

/**
 * Serialize an object to URL Search params
 * @param obj the object to serialize
 * @returns the URL encoded search string
 */
export const serialize = (obj: { [key: string]: string }): string => {
	const str = [];
	for (const p in obj) {
		if (obj.hasOwnProperty(p)) {
			if (obj[p] === undefined) continue;
			str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
		}
	}
	return str.join('&');
};

export const deepCopy = <T>(obj: T): T => {
	return JSON.parse(
		JSON.stringify(obj, (key, value) => {
			if (typeof value === 'bigint') return value.toString();
			else return value;
		})
	);
};

/**
 * Format a number into a string, and return empty if the number is 0
 * @param val the value
 * @param dec the number of decimals
 * @returns the string
 */
export const formatNumberOmitZero = (val: number, dec = 1): string => {
	if (val === 0) return '';
	return val.toFixed(dec);
}

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
export const clamp = (val: number, min: number, max: number): number => {
	return Math.min(Math.max(val, min), max);
};

/**
 * Pad a string with leading zeros
 * @param num the number to pad
 * @param size the number of digits required
 * @returns the string
 */
export const pad = (num: number, size: number) => {
	let numStr = num.toString();
	while (numStr.length < size) numStr = "0" + numStr;
	return numStr;
}

/**
 * Convert a unix timestamp to a readable string
 * @param UNIX_timestamp the timestamp
 * @returns the string
 */
export const timeConverter = (UNIX_timestamp: number, options?: { dateOnly?: boolean, shortYear?: boolean}) => {
	const a = new Date(UNIX_timestamp * 1000);
	const year = (options !== undefined && options.dateOnly === true) ? a.getFullYear().toFixed(0).substring(2) : a.getFullYear();
	if (options !== undefined && options.dateOnly === true) {
		return `${pad(a.getMonth() + 1, 2)}/${pad(a.getDate(), 2)}/${year}`;
	} else {
		const min = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes();
		const sec = a.getSeconds() < 10 ? '0' + a.getSeconds() : a.getSeconds();
		return a.getDate() + ' ' + months[a.getMonth()] + ' ' + year + ' ' + a.getHours() + ':' + min + ':' + sec;
	}
}

/**
 * Make sure a URL is valid
 * @param url the URL
 * @returns whether or not it is valid
 */
export const validateUrl = (url: string) => {
	return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url);
}

/**
 * Get an icon for an extension
 * @param ext the extension
 * @returns the icon
 */
export const extensionLogo = (ext: string): string => {
	let extension = ext;
	if (ext.charAt(0) === '.') extension = ext.substring(1);

	switch (extension) {
		case 'jpg':
		case 'png':
		case 'gif':
			return icons.image;
		case 'aaxc':
		case 'm4b':
			return icons.book;
		default:
			return icons.doc;
	}
};

/**
 * Convert a number of bytes to a more readable format
 * @param bytes the bytes to convert to string
 * @returns the string
 */
export const numBytesToString = (bytes: bigint | number): string => {
	if (typeof bytes === 'bigint') bytes = Number(bytes);
	const sizeKB = bytes / 1024;
	const sizeMB = sizeKB / 1024;
	const sizeGB = sizeMB / 1024;
	if (sizeGB < 0.5) {
		if (sizeMB < 0.5) {
			if (sizeKB < 0.5) {
				return bytes.toPrecision(3) + ' B';
			} else {
				return sizeKB.toPrecision(3) + ' KB';
			}
		} else {
			return sizeMB.toPrecision(3) + ' MB';
		}
	} else {
		return sizeGB.toPrecision(3) + ' GB';
	}
};


/**
 * Measure distance between positions
 * @see https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
 * @param lat1 
 * @param lon1 
 * @param lat2 
 * @param lon2 
 * @returns 
 */
export const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2 - lat1);  // deg2rad below
	var dLon = deg2rad(lon2 - lon1);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2)
		;
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c; // Distance in km
	return d;
}

/**
 * Calculate the initial true heading from point A to B.
 * @see https://www.movable-type.co.uk/scripts/latlong.html
 * @param lat1 starting latitude in decimal degrees
 * @param lon1 starting longitude in decimal degrees
 * @param lat2 destination latitude in decimal degrees
 * @param lon2 destination longitude in decimal degrees
 * @returns heading in degrees relative to true north (0-360)
 */
export const getTrueHeadingBetweenPoints = (lat1: number, lon1: number, lat2: number, lon2: number) => {
	const φ1 = deg2rad(lat1);
	const φ2 = deg2rad(lat2);
	const Δλ = deg2rad(lon2 - lon1);

	const y = Math.sin(Δλ) * Math.cos(φ2);
	const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

	if (x === 0 && y === 0) return 0; // Points overlap; heading undefined, default to 0.

	const θ = Math.atan2(y, x);
	return (θ * (180 / Math.PI) + 360) % 360;
}




/**
 * Convert degrees to radians
 * @param deg the degrees
 * @returns radians
 */
export const deg2rad = (deg: number) => {
	return deg * (Math.PI / 180)
}


export const hexToRgb = (hex: string): [number, number, number] => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
	] : [0, 0, 0];
}

export const componentToHex = (c: number) => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export const rgbToHex = (color: [number, number, number], includeHash = true) => {
	if (includeHash) return "#" + componentToHex(color[0]) + componentToHex(color[1]) + componentToHex(color[2]);
	else return componentToHex(color[0]) + componentToHex(color[1]) + componentToHex(color[2]);
}

export const numToColor = (num: number): [number, number, number] => {
	const arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
	const view = new DataView(arr);
	view.setUint32(0, num, true); // byteOffset = 0; litteEndian = true
	return [view.getUint8(0), view.getUint8(1), view.getUint8(2)];
}

// Easing functions @see https://easings.net/
export function easeInOutSine(x: number): number {
	return -(Math.cos(Math.PI * x) - 1) / 2;
}


export function easeInOutCubic(x: number): number {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}


export function easeOutCubic(x: number): number {
	return 1 - Math.pow(1 - x, 3);
}

export function easeInOutQuad(x: number): number {
	return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}
