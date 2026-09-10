/**
 * Designated holidays.
 *
 * These are the days that attract holiday pay; 2024AA subsection 19.10(C)
 * Rule 6 points at subsection 27.2(D) for how that pay is calculated. The list
 * itself is fixed, but four of the ten move each year and two are tied to
 * Easter, so they are computed rather than tabulated.
 */

export interface Holiday {
	date: Date;
	name: string;
}

/**
 * Gregorian Easter Sunday, by the Meeus/Jones/Butcher algorithm.
 *
 * Easter anchors Good Friday as well, which is why it is worth computing
 * rather than hard-coding a few years of dates.
 */
export const easterSunday = (year: number): Date => {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
	const day = ((h + l - 7 * m + 114) % 31) + 1;
	return new Date(year, month - 1, day);
};

/** The nth occurrence of a weekday in a month, e.g. the 3rd Monday. */
const nthWeekday = (year: number, month: number, weekday: number, n: number): Date => {
	const first = new Date(year, month, 1);
	const offset = (weekday - first.getDay() + 7) % 7;
	return new Date(year, month, 1 + offset + (n - 1) * 7);
};

/** The last occurrence of a weekday in a month, e.g. the last Monday in May. */
const lastWeekday = (year: number, month: number, weekday: number): Date => {
	const last = new Date(year, month + 1, 0);
	const back = (last.getDay() - weekday + 7) % 7;
	return new Date(year, month, last.getDate() - back);
};

/** Every designated holiday falling in a calendar year, in date order. */
export const holidaysFor = (year: number): Holiday[] => {
	const easter = easterSunday(year);
	const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2);

	return [
		{ date: new Date(year, 0, 1), name: "New Year's Day" },
		{ date: nthWeekday(year, 0, 1, 3), name: 'Martin Luther King Day' },
		{ date: nthWeekday(year, 1, 1, 3), name: "Presidents' Day" },
		{ date: goodFriday, name: 'Good Friday' },
		{ date: easter, name: 'Easter Sunday' },
		{ date: lastWeekday(year, 4, 1), name: 'Memorial Day' },
		{ date: new Date(year, 6, 4), name: 'Independence Day' },
		{ date: nthWeekday(year, 8, 1, 1), name: 'Labor Day' },
		{ date: nthWeekday(year, 10, 4, 4), name: 'Thanksgiving Day' },
		{ date: new Date(year, 11, 25), name: 'Christmas Day' }
	].sort((a, b) => a.date.getTime() - b.date.getTime());
};

const iso = (d: Date): string =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Holidays between two dates inclusive, keyed by `YYYY-MM-DD`. */
export const holidayMap = (from: Date, to: Date): Record<string, string> => {
	const out: Record<string, string> = {};
	for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
		for (const h of holidaysFor(y)) {
			if (h.date < from || h.date > to) continue;
			out[iso(h.date)] = h.name;
		}
	}
	return out;
};
