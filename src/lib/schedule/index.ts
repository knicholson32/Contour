import {
	SEAM_TABLES,
	type SeamPattern,
	type SeamTableLetter,
	type TransitionKind
} from './seamTables';

export {
	SEAM_TABLES,
	type SeamPattern,
	type SeamTableLetter,
	type TransitionKind
} from './seamTables';

/**
 * The two fixed schedule types under 2024AA Section 19. Crew Choice is
 * deliberately out of scope: its duty days are assigned by the Company on a
 * monthly basis (19.1(C)(1)) and so cannot be derived.
 */
export type ScheduleType = '7&7' | '8&6';

/** Consecutive work days in one tour. 19.1(A) and 19.1(B). */
export const TOUR_LENGTH: Record<ScheduleType, number> = { '7&7': 7, '8&6': 8 };

/** Consecutive days off following a tour. 19.1(A) and 19.1(B). */
export const DAYS_OFF: Record<ScheduleType, number> = { '7&7': 7, '8&6': 6 };

/**
 * Every schedule line is a phase offset into a repeating 14 day cycle, so line
 * numbers run 1..14 and line N starts on the weekday `Friday + (N - 1) mod 7`.
 *
 * 8&6 lines are limited to Monday, Wednesday and Saturday starts by 19.2(E)(2),
 * which leaves exactly these six.
 */
export const LINES: Record<ScheduleType, readonly number[]> = {
	'7&7': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
	'8&6': [2, 4, 6, 9, 11, 13]
};

/**
 * Anchor for the 14 day line cycle.
 *
 * A line's tours begin on every date `d` where
 * `(d - PHASE_EPOCH) mod 14 === (line - 1)`. This was derived from, and then
 * verified against, every row of every published seam table: outside the seam
 * period the tables are exactly this arithmetic, so no lookup is needed.
 *
 * The same date also fixes which lettered seam table governs a bid period,
 * which is why one epoch serves both purposes.
 */
const PHASE_EPOCH = Date.UTC(2015, 0, 30); // Friday, 30 January 2015

/** Bid periods commence on 1 February, 1 June and 1 October. 19.2(B). */
export const BID_PERIOD_MONTHS = [2, 6, 10] as const;
export type BidPeriodMonth = (typeof BID_PERIOD_MONTHS)[number];

/** A line held for a bid period. */
export interface LineAssignment {
	line: number;
	type: ScheduleType;
}

/** A line change taking effect at the start of a bid period. */
export interface Transition extends LineAssignment {
	/** First day of the bid period the new line takes effect (1 Feb / 1 Jun / 1 Oct). */
	periodStart: Date;
}

/** What a day is before vacation is layered on. */
export type ScheduleDayKind = 'work' | 'off';

/** What a day is once vacation has been applied. */
export type DayKind = ScheduleDayKind | 'vacation';

export interface ScheduleDay {
	date: Date;
	kind: DayKind;
	/** True while inside one of the 14 day seam periods. */
	inSeam: boolean;
	/** The line whose pattern produced this day, or null inside a seam. */
	line: number | null;
}

/** A run of consecutive scheduled work days. */
export interface Tour {
	start: Date;
	end: Date;
	/** Number of work days. Seam tours are frequently shorter than TOUR_LENGTH. */
	length: number;
}

// ---------------------------------------------------------------------------
// Day arithmetic
//
// Schedules are whole calendar days, never instants, so all arithmetic runs on
// a UTC day index taken from the local calendar fields. This keeps the maths
// immune to DST and to the viewer's timezone.
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;

/** Days between PHASE_EPOCH and the calendar date of `d`. */
const dayIndex = (d: Date): number =>
	Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - PHASE_EPOCH) / MS_PER_DAY);

/** Calendar date `n` days after `d`, preserving local midnight. */
export const addDays = (d: Date, n: number): Date =>
	new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Whole calendar days from `a` to `b`. */
export const daysBetween = (a: Date, b: Date): number => dayIndex(b) - dayIndex(a);

/** Local midnight on the same calendar date. */
export const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// ---------------------------------------------------------------------------
// Lines
// ---------------------------------------------------------------------------

/** Weekday a line's tours begin on, as `Date#getDay()` (0 = Sunday). */
export const lineStartWeekday = (line: number): number => (5 + (line - 1)) % 7; // 5 = Friday

/** True if `line` is a valid line number for `type`. */
export const isValidLine = (line: number, type: ScheduleType): boolean =>
	LINES[type].includes(line);

/**
 * Whether a line is working on a given date, ignoring seams, vacation and
 * training. This is the steady state pattern described on PHASE_EPOCH.
 */
export const isSteadyWorkDay = (date: Date, line: number, type: ScheduleType): boolean => {
	const offset = (((dayIndex(date) - (line - 1)) % 14) + 14) % 14;
	return offset < TOUR_LENGTH[type];
};

// ---------------------------------------------------------------------------
// Bid periods and seams
// ---------------------------------------------------------------------------

/** First day of a bid period. */
export const bidPeriodStart = (year: number, month: BidPeriodMonth): Date =>
	new Date(year, month - 1, 1);

/**
 * A seam period begins on the Friday prior to the first day of a schedule
 * period. 19.5(C) and 19.5(D).
 *
 * "Prior" is strict: when the 1st is itself a Friday the seam starts a full
 * week earlier. The published 19.9 table assignments only reproduce if read
 * this way, and four bid periods between 2015 and 2028 exercise the case.
 */
export const seamStartFor = (periodStart: Date): Date => {
	const back = (periodStart.getDay() - 5 + 7) % 7; // 5 = Friday
	return addDays(periodStart, -(back === 0 ? 7 : back));
};

/** The 14 day seam period runs from the seam start inclusive. */
export const SEAM_LENGTH = 14;

/**
 * Which lettered seam table governs a bid period.
 *
 * 19.9 publishes this as a lookup limited to 2015-2028, but the assignment is
 * simply the parity of the seam start in 14 day steps. The formula reproduces
 * all 42 published rows and extends to any future period.
 */
export const seamTableLetterFor = (seamStart: Date): SeamTableLetter =>
	Math.abs(Math.round(dayIndex(seamStart) / 7)) % 2 === 0 ? 'A' : 'B';

/** Which of the four published matrices covers a type change. */
export const transitionKind = (from: ScheduleType, to: ScheduleType): TransitionKind => {
	if (from === '7&7') return to === '7&7' ? '7to7' : '7to8';
	return to === '8&6' ? '8to8' : '8to7';
};

/**
 * The published 28 day mask for a transition, or null if 19.9 has no such row.
 *
 * Index 0 is seven days before the seam start; indices 7..20 are the seam.
 */
export const seamPatternFor = (
	letter: SeamTableLetter,
	from: LineAssignment,
	to: LineAssignment
): SeamPattern | null => {
	const kind = transitionKind(from.type, to.type);
	return SEAM_TABLES[letter]?.[kind]?.[from.line]?.[to.line] ?? null;
};

/**
 * The next open bid period strictly after `d`. Open bids commence 1 October
 * (19.2(B)(1)), and a schedule is only predictable up to that point because
 * every line is rebid.
 *
 * Strictly after, so that awarding a line for an October period yields the
 * following October rather than collapsing to the same day.
 */
export const nextOpenBidPeriod = (d: Date): Date => {
	const oct = new Date(d.getFullYear(), 9, 1);
	return daysBetween(d, oct) > 0 ? oct : new Date(d.getFullYear() + 1, 9, 1);
};

// ---------------------------------------------------------------------------
// Schedule construction
// ---------------------------------------------------------------------------

/** A seam period produced by one line change, with the row that governs it. */
export interface ResolvedSeam {
	seamStart: Date;
	/** Last day of the 14 day seam period, inclusive. */
	seamEnd: Date;
	pattern: SeamPattern;
	from: LineAssignment;
	to: LineAssignment;
}

export class SeamLookupError extends Error {}

/**
 * Work out which line changes actually produce a seam, and look up the row
 * that governs each.
 *
 * Transitions that keep the same line and type are skipped: every same-line row
 * in 19.9 is identical to the steady state, so they perturb nothing.
 */
export const resolveSeams = (
	initial: LineAssignment,
	transitions: Transition[]
): ResolvedSeam[] => {
	const ordered = [...transitions].sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
	const seams: ResolvedSeam[] = [];
	let held: LineAssignment = initial;

	for (const t of ordered) {
		if (t.line === held.line && t.type === held.type) continue;
		if (!isValidLine(t.line, t.type)) {
			throw new SeamLookupError(`Line ${t.line} is not a valid ${t.type} line`);
		}
		const seamStart = seamStartFor(t.periodStart);
		const letter = seamTableLetterFor(seamStart);
		const to: LineAssignment = { line: t.line, type: t.type };
		const pattern = seamPatternFor(letter, held, to);
		if (pattern === null) {
			throw new SeamLookupError(
				`No seam table ${letter} row for ${held.type} line ${held.line} to ${to.type} line ${to.line}`
			);
		}
		seams.push({
			seamStart,
			seamEnd: addDays(seamStart, SEAM_LENGTH - 1),
			pattern,
			from: held,
			to
		});
		held = to;
	}

	return seams;
};

/**
 * Expand a starting line plus any number of subsequent bid awards into a
 * day-by-day schedule over `[from, to]`.
 *
 * Outside a seam period the line's steady state applies. Inside one, the 19.9
 * table supplies the days. Transitions that keep the same line and type are
 * skipped: every same-line row in 19.9 is identical to the steady state, so
 * they perturb nothing.
 *
 * Vacation is applied separately, on top of the result.
 */
export const buildSchedule = (
	initial: LineAssignment,
	transitions: Transition[],
	from: Date,
	to: Date
): ScheduleDay[] => {
	const seams = resolveSeams(initial, transitions);
	const days: ScheduleDay[] = [];
	const span = daysBetween(from, to);
	for (let i = 0; i <= span; i++) {
		const date = addDays(startOfDay(from), i);

		// The applicable seam is the latest one that has already begun.
		let seam: ResolvedSeam | null = null;
		let active: LineAssignment = initial;
		for (const s of seams) {
			if (daysBetween(s.seamStart, date) < 0) break;
			seam = s;
			active = s.to;
		}

		if (seam !== null) {
			const offset = daysBetween(seam.seamStart, date);
			if (offset < SEAM_LENGTH) {
				days.push({
					date,
					kind: seam.pattern[7 + offset] === 'X' ? 'work' : 'off',
					inSeam: true,
					line: null
				});
				continue;
			}
		}

		days.push({
			date,
			kind: isSteadyWorkDay(date, active.line, active.type) ? 'work' : 'off',
			inSeam: false,
			line: active.line
		});
	}

	return days;
};

/**
 * Which line is in force on a date.
 *
 * A seam is treated as belonging to the incoming line, since the award has
 * taken effect by then. This is what subsection 8.4 turns on: vacation is
 * governed by "the schedule the crewmember is on at the time the vacation is
 * taken", not the schedule they held when it was awarded.
 */
export const assignmentOn = (
	date: Date,
	initial: LineAssignment,
	seams: ResolvedSeam[]
): LineAssignment => {
	let active = initial;
	for (const s of seams) {
		if (daysBetween(s.seamStart, date) < 0) break;
		active = s.to;
	}
	return active;
};

/** Collapse a day list into its runs of consecutive work days. */
export const groupTours = (days: ScheduleDay[]): Tour[] => {
	const tours: Tour[] = [];
	let start: ScheduleDay | null = null;
	for (let i = 0; i < days.length; i++) {
		const d = days[i];
		if (d.kind === 'work' && start === null) start = d;
		if (d.kind !== 'work' && start !== null) {
			tours.push({ start: start.date, end: days[i - 1].date, length: daysBetween(start.date, days[i - 1].date) + 1 });
			start = null;
		}
	}
	if (start !== null) {
		const last = days[days.length - 1];
		tours.push({ start: start.date, end: last.date, length: daysBetween(start.date, last.date) + 1 });
	}
	return tours;
};
