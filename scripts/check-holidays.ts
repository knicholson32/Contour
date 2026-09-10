import { holidaysFor, easterSunday, holidayMap } from '../src/lib/schedule/holidays.ts';

let pass = 0; const fails: string[] = [];
const check = (n: string, ok: boolean, d = '') => { if (ok) pass++; else fails.push(`${n}${d ? ': ' + d : ''}`); };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Easter is the anchor for Good Friday too, so verify it against known dates.
const KNOWN_EASTER: Record<number, string> = {
	2024: '2024-03-31', 2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28',
	2028: '2028-04-16', 2029: '2029-04-01', 2030: '2030-04-21', 2031: '2031-04-13',
	2032: '2032-03-28', 2033: '2033-04-17', 2035: '2035-03-25', 2038: '2038-04-25'
};
for (const [y, want] of Object.entries(KNOWN_EASTER)) {
	check(`Easter ${y}`, iso(easterSunday(+y)) === want, `${iso(easterSunday(+y))} vs ${want}`);
}

// Fixed and floating holidays for a year checked by hand.
const EXPECT_2026: Record<string, string> = {
	"New Year's Day": '2026-01-01',
	'Martin Luther King Day': '2026-01-19',
	"Presidents' Day": '2026-02-16',
	'Good Friday': '2026-04-03',
	'Easter Sunday': '2026-04-05',
	'Memorial Day': '2026-05-25',
	'Independence Day': '2026-07-04',
	'Labor Day': '2026-09-07',
	'Thanksgiving Day': '2026-11-26',
	'Christmas Day': '2026-12-25'
};
const got = holidaysFor(2026);
check('ten holidays', got.length === 10, String(got.length));
for (const h of got) {
	check(`2026 ${h.name}`, iso(h.date) === EXPECT_2026[h.name], `${iso(h.date)} vs ${EXPECT_2026[h.name]}`);
}
check('sorted by date', got.every((h, i) => i === 0 || got[i - 1].date <= h.date));

// Structural rules that must hold in any year.
for (let y = 2024; y <= 2040; y++) {
	const hs = holidaysFor(y);
	const by = Object.fromEntries(hs.map((h) => [h.name, h.date]));
	check(`${y} MLK is a Monday`, by['Martin Luther King Day'].getDay() === 1);
	check(`${y} Presidents' is a Monday`, by["Presidents' Day"].getDay() === 1);
	check(`${y} Memorial is a Monday`, by['Memorial Day'].getDay() === 1);
	check(`${y} Memorial is in May`, by['Memorial Day'].getMonth() === 4);
	// Last Monday in May: a week later must fall in June.
	const wk = new Date(by['Memorial Day']); wk.setDate(wk.getDate() + 7);
	check(`${y} Memorial is the LAST Monday`, wk.getMonth() === 5);
	check(`${y} Labor is a Monday`, by['Labor Day'].getDay() === 1);
	check(`${y} Thanksgiving is a Thursday`, by['Thanksgiving Day'].getDay() === 4);
	check(`${y} Easter is a Sunday`, by['Easter Sunday'].getDay() === 0);
	check(`${y} Good Friday is a Friday`, by['Good Friday'].getDay() === 5);
	const diff = (by['Easter Sunday'].getTime() - by['Good Friday'].getTime()) / 86400000;
	check(`${y} Good Friday is 2 days before Easter`, Math.round(diff) === 2);
	check(`${y} ten holidays`, hs.length === 10);
}

// Range map
const m = holidayMap(new Date(2026, 10, 1), new Date(2027, 0, 31));
check('range map spans the year boundary',
	m['2026-11-26'] === 'Thanksgiving Day' && m['2026-12-25'] === 'Christmas Day' &&
	m['2027-01-01'] === "New Year's Day" && m['2027-01-18'] === 'Martin Luther King Day',
	JSON.stringify(m));
check('range map excludes outside dates', m['2026-07-04'] === undefined && m['2027-02-15'] === undefined);

console.log(`passed: ${pass}   failed: ${fails.length}`);
for (const f of fails.slice(0, 10)) console.log('  ! ' + f);
if (fails.length) process.exit(1);
