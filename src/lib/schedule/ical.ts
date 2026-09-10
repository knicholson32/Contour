import { addDays, daysBetween, groupTours, type ResolvedSeam, type ScheduleDay } from './index';

/**
 * iCalendar (RFC 5545) generation for a built schedule.
 *
 * Everything here is an all-day event. The schedule is calendar days rather
 * than instants, so VALUE=DATE sidesteps timezones and DST entirely.
 */

const PRODID = '-//Contour//Seam Schedule//EN';

/** Used when the pilot has not chosen their own. */
export const DEFAULT_TOUR_TITLE = 'Tour';

/** Placeholders accepted in a tour title, for the settings UI to advertise. */
export const TITLE_PLACEHOLDERS = ['{days}', '{line}'] as const;

/**
 * Substitute placeholders in a tour title.
 *
 * `{line}` is empty inside a seam, since a seam tour belongs to neither the
 * outgoing nor the incoming line. Any doubled spaces that leaves are collapsed
 * so a title does not end up looking broken.
 */
export const renderTitle = (template: string, days: number, line: number | null): string =>
	template
		.replace(/\{days\}/g, String(days))
		.replace(/\{line\}/g, line === null ? '' : String(line))
		.replace(/\s{2,}/g, ' ')
		.trim();

/** Escape a TEXT value per RFC 5545 section 3.3.11. */
const esc = (s: string): string =>
	s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** `YYYYMMDD` in local calendar terms, for VALUE=DATE. */
const dateVal = (d: Date): string =>
	`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

/** UTC timestamp form for DTSTAMP. */
const stamp = (d: Date): string => `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

/**
 * Fold to 75 octets per RFC 5545 section 3.1.
 *
 * The limit is octets, not characters, so multi-byte content is measured after
 * UTF-8 encoding and never split mid-character.
 */
const fold = (line: string): string => {
	const bytes = new TextEncoder().encode(line);
	if (bytes.length <= 75) return line;
	const out: string[] = [];
	let cur = '';
	let curLen = 0;
	let limit = 75;
	for (const ch of line) {
		const n = new TextEncoder().encode(ch).length;
		if (curLen + n > limit) {
			out.push(cur);
			cur = ch;
			curLen = n;
			limit = 74; // continuation lines carry a leading space
		} else {
			cur += ch;
			curLen += n;
		}
	}
	out.push(cur);
	return out.join('\r\n ');
};

export interface CalendarOptions {
	/** Shown as the calendar name in Google and Apple Calendar. */
	name?: string;
	/**
	 * Title for each tour. `{days}` and `{line}` are substituted; `{line}` is
	 * blank inside a seam, where no single line owns the tour.
	 */
	tourTitle?: string;
	/** Overridden in tests so output is deterministic. */
	now?: Date;
	/** Distinguishes UIDs between instances. */
	domain?: string;
	/**
	 * Drop anything finishing before this date.
	 *
	 * Callers use the start of the seam period, so an export carries only the
	 * schedule the pilot is transitioning into. A tour straddling that boundary
	 * is kept whole rather than clipped, because a truncated tour would
	 * misstate when the pilot actually reports.
	 */
	from?: Date;
}

interface Event {
	uid: string;
	start: Date;
	/** Exclusive: the day AFTER the last day of the event. */
	end: Date;
	summary: string;
	description?: string;
}

/**
 * Turn a built schedule into an iCalendar document.
 *
 * One event per tour rather than per work day: a seven day tour is a single
 * all-day block, which keeps a month view readable.
 */
export const buildCalendar = (
	days: ScheduleDay[],
	seams: ResolvedSeam[],
	opts: CalendarOptions = {}
): string => {
	const {
		name = 'Flight Schedule',
		tourTitle = DEFAULT_TOUR_TITLE,
		now = new Date(),
		domain = 'contour.local',
		from
	} = opts;
	const dtstamp = stamp(now);
	const events: Event[] = [];

	for (const tour of groupTours(days)) {
		const inSeam = seams.some(
			(s) => daysBetween(s.seamStart, tour.end) >= 0 && daysBetween(tour.start, s.seamEnd) >= 0
		);
		const line = days.find((d) => daysBetween(d.date, tour.start) === 0)?.line ?? null;
		const detail = [
			`${tour.length} work day${tour.length === 1 ? '' : 's'}`,
			line === null ? null : `Line ${line}`,
			inSeam ? 'Within a seam period (2024AA 19.9)' : null
		].filter((x) => x !== null);

		events.push({
			uid: `tour-${dateVal(tour.start)}@${domain}`,
			start: tour.start,
			// DTEND is exclusive, so a tour ending on the 1st runs to the 2nd.
			end: addDays(tour.end, 1),
			summary: renderTitle(tourTitle, tour.length, line),
			description: detail.join('\n')
		});
	}

	const included =
		from === undefined
			? events
			: // e.end is exclusive, so the last day of the event is e.end - 1.
				events.filter((e) => daysBetween(from, addDays(e.end, -1)) >= 0);

	included.sort((a, b) => a.start.getTime() - b.start.getTime() || a.uid.localeCompare(b.uid));

	const lines: string[] = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:${PRODID}`,
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${esc(name)}`,
		'X-PUBLISHED-TTL:PT12H'
	];

	for (const e of included) {
		lines.push('BEGIN:VEVENT');
		lines.push(`UID:${e.uid}`);
		lines.push(`DTSTAMP:${dtstamp}`);
		lines.push(`DTSTART;VALUE=DATE:${dateVal(e.start)}`);
		lines.push(`DTEND;VALUE=DATE:${dateVal(e.end)}`);
		lines.push(`SUMMARY:${esc(e.summary)}`);
		if (e.description !== undefined) lines.push(`DESCRIPTION:${esc(e.description)}`);
		lines.push('TRANSP:OPAQUE');
		lines.push('END:VEVENT');
	}

	lines.push('END:VCALENDAR');

	// RFC 5545 requires CRLF line endings.
	return lines.map(fold).join('\r\n') + '\r\n';
};
