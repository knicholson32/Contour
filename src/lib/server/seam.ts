import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import {
	BID_PERIOD_MONTHS,
	bidPeriodStart,
	buildSchedule,
	isValidLine,
	nextOpenBidPeriod,
	resolveSeams,
	type BidPeriodMonth,
	type LineAssignment,
	type ResolvedSeam,
	type ScheduleDay,
	type ScheduleType,
	type Transition
} from '$lib/schedule';
import { applyVacation, type VacationNote, type VacationWeek } from '$lib/schedule/vacation';

export const isScheduleType = (v: string): v is ScheduleType => v === '7&7' || v === '8&6';

/** `YYYY-MM-DD` -> local Date, avoiding the UTC parse that `new Date(str)` does. */
export const parseDate = (s: string): Date | null => {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	if (m === null) return null;
	const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
	return Number.isNaN(d.getTime()) ? null : d;
};

export const fmtDate = (d: Date): string =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Proposed line changes travel in the query string rather than the database, so
 * a pilot can explore "what if I bid line 4" without saving anything, and can
 * share or bookmark the result.
 *
 * Format: `?t=2026-06:4:8%266` -> one `t` per transition, `YYYY-MM:line:type`.
 */
export const parseTransitions = (raw: string[]): { ok: Transition[]; errors: string[] } => {
	const ok: Transition[] = [];
	const errors: string[] = [];
	for (const entry of raw) {
		const parts = entry.split(':');
		if (parts.length !== 3) {
			errors.push(`Malformed transition "${entry}"`);
			continue;
		}
		const [period, lineRaw, type] = parts;
		const pm = /^(\d{4})-(\d{2})$/.exec(period);
		const line = Number(lineRaw);
		if (pm === null || !Number.isInteger(line) || !isScheduleType(type)) {
			errors.push(`Malformed transition "${entry}"`);
			continue;
		}
		const month = Number(pm[2]) as BidPeriodMonth;
		if (!BID_PERIOD_MONTHS.includes(month)) {
			errors.push(`${period} is not a bid period (they begin in February, June and October)`);
			continue;
		}
		if (!isValidLine(line, type)) {
			errors.push(`Line ${line} is not a valid ${type} line`);
			continue;
		}
		ok.push({ periodStart: bidPeriodStart(Number(pm[1]), month), line, type });
	}
	ok.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
	return { ok, errors };
};

export interface SeamContext {
	current: LineAssignment | null;
	vacations: { id: number; start: Date; label: string; notes: string }[];
	/** Bids from the query string. Whatever is here is what gets exported. */
	transitions: Transition[];
	errors: string[];
	days: ScheduleDay[];
	seams: ResolvedSeam[];
	notes: VacationNote[];
	buildError: string | null;
	range: { from: Date; to: Date };
}

/**
 * Assemble everything needed to render or export a schedule.
 *
 * Shared by the page loader and the calendar endpoints so the two can never
 * disagree about what the schedule actually is.
 */
export const buildContext = async (transitionParams: string[]): Promise<SeamContext> => {
	const stored = await settings.getSet('schedule');
	const storedLine = stored['schedule.current.line'];
	const storedType = stored['schedule.current.type'];

	const current: LineAssignment | null =
		storedLine > 0 && isScheduleType(storedType) ? { line: storedLine, type: storedType } : null;

	const vacationRows = await prisma.vacationWeek.findMany({ orderBy: { startDate: 'asc' } });
	const vacations = vacationRows.flatMap((v) => {
		const start = parseDate(v.startDate);
		return start === null ? [] : [{ id: v.id, start, label: v.label, notes: v.notes }];
	});

	const { ok: transitions, errors } = parseTransitions(transitionParams);

	// The schedule is only knowable up to the next open bid, when every line is
	// rebid (19.2(B)(1)). Start a month back so the current tour has context.
	const today = new Date();
	const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
	const lastPeriod =
		transitions.length > 0 ? transitions[transitions.length - 1].periodStart : today;
	const to = nextOpenBidPeriod(lastPeriod > today ? lastPeriod : today);

	let days: ScheduleDay[] = [];
	let seams: ResolvedSeam[] = [];
	let notes: VacationNote[] = [];
	let buildError: string | null = null;

	if (current !== null) {
		try {
			seams = resolveSeams(current, transitions);
			const base = buildSchedule(current, transitions, from, to);
			const weeks: VacationWeek[] = vacations.map((v) => ({ start: v.start, label: v.label }));
			const applied = applyVacation(base, weeks, current, seams);
			days = applied.days;
			notes = applied.notes;
		} catch (e) {
			seams = [];
			buildError = e instanceof Error ? e.message : String(e);
		}
	}

	return {
		current,
		vacations,
		transitions,
		errors,
		days,
		seams,
		notes,
		buildError,
		range: { from, to }
	};
};
