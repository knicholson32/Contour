import { buildSchedule, resolveSeams, groupTours, addDays, type ScheduleType } from '../src/lib/schedule/index.ts';
import { applyVacation } from '../src/lib/schedule/vacation.ts';
import { buildCalendar, renderTitle } from '../src/lib/schedule/ical.ts';

let pass = 0; const fails: string[] = [];
const check = (n: string, ok: boolean, d = '') => { if (ok) pass++; else fails.push(`${n}${d ? ': ' + d : ''}`); };

const initial = { line: 13, type: '7&7' as ScheduleType };
const transitions = [{ periodStart: new Date(2026, 9, 1), line: 1, type: '7&7' as ScheduleType }];
const seams = resolveSeams(initial, transitions);
const base = buildSchedule(initial, transitions, new Date(2026, 7, 1), new Date(2027, 9, 1));
const vac = [{ start: new Date(2026, 8, 28) }, { start: new Date(2026, 10, 9) }];
const { days } = applyVacation(base, vac, initial, seams);
const ics = buildCalendar(days, seams, { now: new Date(Date.UTC(2026, 8, 10, 2, 0, 0)) });

// --- format -----------------------------------------------------------------
const raw = ics.split('\r\n');
check('CRLF throughout', !ics.split('\r\n').join('').includes('\n'), 'stray LF found');
check('ends with CRLF', ics.endsWith('\r\n'));
check('starts VCALENDAR', raw[0] === 'BEGIN:VCALENDAR');
check('ends VCALENDAR', raw[raw.length - 2] === 'END:VCALENDAR');
for (const l of raw) {
	if (new TextEncoder().encode(l).length > 75) { check('line <= 75 octets', false, l.slice(0, 40)); break; }
}
check('line <= 75 octets', raw.every((l) => new TextEncoder().encode(l).length <= 75));
check('BEGIN/END VEVENT balanced',
	raw.filter((l) => l === 'BEGIN:VEVENT').length === raw.filter((l) => l === 'END:VEVENT').length);

// --- parse ------------------------------------------------------------------
interface Ev { uid: string; start: string; end: string; summary: string; transp: string }
const events: Ev[] = [];
let cur: Partial<Ev> | null = null;
for (const line of raw) {
	if (line === 'BEGIN:VEVENT') cur = {};
	else if (line === 'END:VEVENT') { events.push(cur as Ev); cur = null; }
	else if (cur !== null) {
		const [k, ...rest] = line.split(':');
		const v = rest.join(':');
		if (k === 'UID') cur.uid = v;
		if (k.startsWith('DTSTART')) cur.start = v;
		if (k.startsWith('DTEND')) cur.end = v;
		if (k === 'SUMMARY') cur.summary = v;
		if (k === 'TRANSP') cur.transp = v;
	}
}
check('events parsed', events.length > 0, `${events.length}`);
check('UIDs unique', new Set(events.map((e) => e.uid)).size === events.length);
check('all have DTSTAMP', raw.filter((l) => l.startsWith('DTSTAMP:')).length === events.length);

const toDate = (v: string) => new Date(+v.slice(0, 4), +v.slice(4, 6) - 1, +v.slice(6, 8));
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const expand = (e: Ev) => {
	const out: string[] = [];
	for (let d = toDate(e.start); d < toDate(e.end); d = addDays(d, 1)) out.push(key(d));
	return out;
};

// --- round-trip against the engine ------------------------------------------
const tourEvents = events.filter((e) => e.uid.startsWith('tour-'));
const vacEvents = events.filter((e) => e.uid.startsWith('vacation-'));
const seamEvents = events.filter((e) => e.uid.startsWith('seam-'));

const icsWork = tourEvents.flatMap(expand).sort();
const engWork = days.filter((d) => d.kind === 'work').map((d) => key(d.date)).sort();
check('tour events cover exactly the work days', JSON.stringify(icsWork) === JSON.stringify(engWork),
	`ics ${icsWork.length} vs engine ${engWork.length}`);
check('no day appears in two tour events', new Set(icsWork).size === icsWork.length);
check('one event per tour', tourEvents.length === groupTours(days).length,
	`${tourEvents.length} vs ${groupTours(days).length}`);

check('no vacation events', vacEvents.length === 0, `${vacEvents.length}`);
check('no seam events', seamEvents.length === 0, `${seamEvents.length}`);
check('only tour events emitted', tourEvents.length === events.length);
check('tours are OPAQUE', tourEvents.every((e) => e.transp === 'OPAQUE'));
// Vacation must still be visible as an absence of work.
const vacDays = new Set(days.filter((d) => d.kind === 'vacation').map((d) => key(d.date)));
check('no tour covers a vacation day', tourEvents.flatMap(expand).every((d) => !vacDays.has(d)));

// DTEND exclusivity: the last covered day must be the day before DTEND.
for (const e of tourEvents.slice(0, 5)) {
	const covered = expand(e);
	check(`DTEND exclusive (${e.uid.slice(0, 18)})`,
		covered[covered.length - 1] === key(addDays(toDate(e.end), -1)));
}
// --- configurable tour title ------------------------------------------------
check('default title', renderTitle('Tour', 7, 3) === 'Tour');
check('{days} substituted', renderTitle('Work {days}d', 7, 3) === 'Work 7d');
check('{line} substituted', renderTitle('Tour L{line}', 7, 3) === 'Tour L3');
check('{line} blank inside a seam', renderTitle('Tour {line}', 5, null) === 'Tour');
check('doubled spaces collapsed', renderTitle('NJ {line} Tour', 5, null) === 'NJ Tour');
const titled = buildCalendar(days, seams, { tourTitle: 'Flying {days}d', now: new Date(Date.UTC(2026, 8, 10)) });
check('custom title reaches SUMMARY', titled.includes('SUMMARY:Flying 7d'));
check('default title not present when overridden', !titled.includes('SUMMARY:Tour\r\n'));
// A title with reserved characters must still produce a parseable file.
const risky = buildCalendar(days, seams, { tourTitle: 'A; B, C\\ D', now: new Date(Date.UTC(2026, 8, 10)) });
check('reserved characters escaped', risky.includes('SUMMARY:A\\; B\\, C\\\\ D'));

// --- from: export starts at the seam, straddling tours kept whole -----------
{
	const seamStart = seams[0].seamStart;
	const scoped = buildCalendar(days, seams, { from: seamStart, now: new Date(Date.UTC(2026, 8, 10)) });
	const scopedEvents: Ev[] = [];
	let c: Partial<Ev> | null = null;
	for (const line of scoped.split('\r\n')) {
		if (line === 'BEGIN:VEVENT') c = {};
		else if (line === 'END:VEVENT') { scopedEvents.push(c as Ev); c = null; }
		else if (c !== null) {
			const [k, ...r] = line.split(':');
			if (k === 'UID') c.uid = r.join(':');
			if (k.startsWith('DTSTART')) c.start = r.join(':');
			if (k.startsWith('DTEND')) c.end = r.join(':');
		}
	}
	check('scoped export drops earlier events', scopedEvents.length < events.length,
		`${scopedEvents.length} vs ${events.length}`);
	check('nothing finishes before the seam',
		scopedEvents.every((e) => addDays(toDate(e.end), -1) >= seamStart));
	// The tour running across the seam boundary must survive intact, not clipped.
	const straddling = events.find(
		(e) => e.uid.startsWith('tour-') && toDate(e.start) < seamStart && addDays(toDate(e.end), -1) >= seamStart
	);
	if (straddling !== undefined) {
		const kept = scopedEvents.find((e) => e.uid === straddling.uid);
		check('straddling tour kept whole', kept !== undefined && kept.start === straddling.start,
			kept ? `${kept.start} vs ${straddling.start}` : 'dropped');
	}
	const scopedUids = new Set(scopedEvents.map((e) => e.uid));
	check('every later event retained',
		events.filter((e) => toDate(e.start) >= seamStart).every((e) => scopedUids.has(e.uid)));
}

// --- stability: same input, same output (so re-import updates, not duplicates)
const again = buildCalendar(days, seams, { now: new Date(Date.UTC(2026, 8, 10, 2, 0, 0)) });
check('output is deterministic', again === ics);

console.log(`events: ${events.length} (${tourEvents.length} tours, ${vacEvents.length} vacation, ${seamEvents.length} seam)`);
console.log(`passed: ${pass}   failed: ${fails.length}`);
for (const f of fails) console.log('  ! ' + f);
if (fails.length) process.exit(1);
