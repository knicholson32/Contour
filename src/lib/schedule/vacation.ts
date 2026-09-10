import {
	addDays,
	assignmentOn,
	daysBetween,
	groupTours,
	startOfDay,
	type LineAssignment,
	type ResolvedSeam,
	type ScheduleDay,
	type ScheduleType
} from './index';

/**
 * Applies the vacation provisions of 2024AA subsection 19.4(H) on top of a
 * schedule already produced by `buildSchedule`.
 *
 * Vacation is bid and awarded in whole weeks (Section 8.5), so every block here
 * is seven days, or fourteen when two weeks are taken consecutively. Partial
 * weeks under 19.4(H)(1) are out of scope.
 */

/** An awarded week of vacation: seven days beginning at `start`. */
export interface VacationWeek {
	start: Date;
	label?: string;
}

export const VACATION_WEEK_DAYS = 7;

/**
 * Work days credited off the schedule per vacation week, and the minimum
 * duty-free period that must surround it.
 *
 * One week:  19.4(H)(2)(a) for 7&7, 19.4(H)(2)(c) for 8&6.
 * Two weeks: 19.4(H)(3)(a) for 7&7, 19.4(H)(3)(c) for 8&6.
 */
const CREDIT: Record<ScheduleType, { one: number; two: number }> = {
	'7&7': { one: 7, two: 14 },
	'8&6': { one: 8, two: 16 }
};
const DUTY_FREE_MIN: Record<ScheduleType, { one: number; two: number }> = {
	'7&7': { one: 21, two: 35 },
	'8&6': { one: 20, two: 34 }
};

export type NoteSeverity = 'info' | 'warning';

export interface VacationNote {
	severity: NoteSeverity;
	/** Start of the vacation block the note concerns. */
	start: Date;
	message: string;
}

export interface VacationResult {
	days: ScheduleDay[];
	notes: VacationNote[];
}

/** A run of one or two consecutive awarded weeks. */
interface VacationBlock {
	start: Date;
	end: Date;
	weeks: number;
}

/** Merge awarded weeks that run back-to-back into single blocks. */
const blocksFrom = (weeks: VacationWeek[]): VacationBlock[] => {
	const sorted = [...weeks]
		.map((w) => startOfDay(w.start))
		.sort((a, b) => a.getTime() - b.getTime());

	const blocks: VacationBlock[] = [];
	for (const start of sorted) {
		const prev = blocks[blocks.length - 1];
		if (prev !== undefined && daysBetween(prev.end, start) === 1) {
			prev.end = addDays(start, VACATION_WEEK_DAYS - 1);
			prev.weeks += 1;
		} else {
			blocks.push({ start, end: addDays(start, VACATION_WEEK_DAYS - 1), weeks: 1 });
		}
	}
	return blocks;
};

const within = (d: Date, start: Date, end: Date): boolean =>
	daysBetween(start, d) >= 0 && daysBetween(d, end) >= 0;

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean =>
	daysBetween(aStart, bEnd) >= 0 && daysBetween(bStart, aEnd) >= 0;

/**
 * Apply awarded vacation to a schedule.
 *
 * Order of operations matters: the seam tables run first (they are already
 * baked into `days`), and vacation elimination is applied to the result.
 */
export const applyVacation = (
	days: ScheduleDay[],
	weeks: VacationWeek[],
	initial: LineAssignment,
	seams: ResolvedSeam[]
): VacationResult => {
	const out: ScheduleDay[] = days.map((d) => ({ ...d }));
	const notes: VacationNote[] = [];
	if (out.length === 0) return { days: out, notes };

	const index = new Map<number, number>();
	out.forEach((d, i) => index.set(startOfDay(d.date).getTime(), i));
	const at = (d: Date): ScheduleDay | undefined => {
		const i = index.get(startOfDay(d).getTime());
		return i === undefined ? undefined : out[i];
	};

	for (const block of blocksFrom(weeks)) {
		// 19.4(H)(4): three or more consecutive weeks may not be bid or assigned.
		if (block.weeks >= 3) {
			notes.push({
				severity: 'warning',
				start: block.start,
				message: `${block.weeks} consecutive vacation weeks. Subsection 19.4(H)(4) does not permit three or more consecutively.`
			});
		}

		// 8.4: the schedule in force when the vacation is taken governs.
		const type = assignmentOn(block.start, initial, seams).type;
		const target = block.weeks >= 2 ? CREDIT[type].two : CREDIT[type].one;

		// A block that touches a seam period uses the extended ladder. The
		// heading of 19.4(H)(2)(a)(i) reads "Overlaps or Occurs Entirely Within"
		// while its body says "occurs entirely within"; we follow the heading,
		// so a partial overlap also gets the extended treatment.
		const inSeam = seams.some((s) =>
			overlaps(block.start, block.end, s.seamStart, s.seamEnd)
		);

		const tours = groupTours(out);
		const overlapping = tours.filter((t) =>
			overlaps(t.start, t.end, block.start, block.end)
		);

		const daysInBlock = (t: { start: Date; end: Date }): number => {
			let n = 0;
			for (let d = t.start; daysBetween(d, t.end) >= 0; d = addDays(d, 1)) {
				if (within(d, block.start, block.end)) n++;
			}
			return n;
		};

		/** Turn a tour's work days into days off; returns how many were removed. */
		const eliminate = (t: { start: Date; end: Date }): number => {
			let n = 0;
			for (let d = t.start; daysBetween(d, t.end) >= 0; d = addDays(d, 1)) {
				const day = at(d);
				if (day !== undefined && day.kind === 'work') {
					day.kind = 'off';
					n++;
				}
			}
			return n;
		};

		let removed = 0;

		if (block.weeks >= 2) {
			// 19.4(H)(3) Rule 1: eliminate every duty tour overlapping the block.
			// Applied literally, which inside a seam can remove more than the
			// credited number of days; that is flagged rather than clawed back.
			for (const t of overlapping) removed += eliminate(t);
		} else if (overlapping.length > 0) {
			// 19.4(H)(2) Rules 1 and 2: eliminate the single tour with the most
			// work days inside the vacation week. Rule 3 breaks ties in favour of
			// the first chronological tour, which `reduce` preserves by using a
			// strict greater-than.
			const chosen = overlapping.reduce((best, t) =>
				daysInBlock(t) > daysInBlock(best) ? t : best
			);
			removed += eliminate(chosen);

			// 19.4(H)(2)(a)(i) Rule 3: inside a seam, also clear any remaining
			// work days that overlap the vacation week.
			if (inSeam) {
				for (const t of overlapping) {
					if (t === chosen) continue;
					for (let d = t.start; daysBetween(d, t.end) >= 0; d = addDays(d, 1)) {
						if (!within(d, block.start, block.end)) continue;
						const day = at(d);
						if (day !== undefined && day.kind === 'work') {
							day.kind = 'off';
							removed++;
						}
					}
				}
			}
		}

		// Top-up. 19.4(H)(3) Rule 2 for two weeks; 19.4(H)(2)(a)(i) Rule 4 inside
		// a seam. Days come off the tour nearest the vacation, taken from the end
		// closest to it so the duty-free period stays contiguous.
		if (removed < target && (inSeam || block.weeks >= 2)) {
			const gap = (t: { start: Date; end: Date }): number =>
				daysBetween(t.end, block.start) > 0
					? daysBetween(t.end, block.start)
					: daysBetween(block.end, t.start);

			const candidates = groupTours(out)
				.filter((t) => !overlaps(t.start, t.end, block.start, block.end))
				.sort((a, b) => gap(a) - gap(b) || a.start.getTime() - b.start.getTime());

			for (const t of candidates) {
				if (removed >= target) break;
				const before = daysBetween(t.end, block.start) > 0;
				for (let k = 0; k < t.length && removed < target; k++) {
					const d = before ? addDays(t.end, -k) : addDays(t.start, k);
					const day = at(d);
					if (day !== undefined && day.kind === 'work') {
						day.kind = 'off';
						removed++;
					}
				}
			}
		}

		// Mark the awarded days themselves.
		for (let d = block.start; daysBetween(d, block.end) >= 0; d = addDays(d, 1)) {
			const day = at(d);
			if (day !== undefined) day.kind = 'vacation';
		}

		// Report anything the agreement leaves ambiguous rather than guessing.
		if (removed > target) {
			notes.push({
				severity: 'warning',
				start: block.start,
				message: `${removed} work days come off the schedule against ${target} credited. Rule 1 eliminates whole overlapping tours, and seam tours are short, so this can over-deliver. Worth confirming with Scheduling.`
			});
		} else if (removed < target) {
			notes.push({
				severity: 'warning',
				start: block.start,
				message: `Only ${removed} of ${target} credited work days could be removed. Verify with Scheduling.`
			});
		}

		// The duty-free minimums in 19.4(H)(2)(a), (2)(c), (3)(a) and (3)(c) each
		// carry the same carve-out: they apply "unless their awarded vacation
		// week overlaps shifted days per subsection 19.5(C)" (19.5(D) for 8&6).
		// Those are the seam subsections, so a block touching a seam is exempt
		// and a short duty-free period there is expected, not a defect.
		if (!inSeam) {
			const minDutyFree = block.weeks >= 2 ? DUTY_FREE_MIN[type].two : DUTY_FREE_MIN[type].one;
			const actual = dutyFreeAround(out, block.start, at);
			if (actual < minDutyFree) {
				notes.push({
					severity: 'warning',
					start: block.start,
					message: `Duty-free period is ${actual} days against the ${minDutyFree} day minimum for ${type}. Verify with Scheduling.`
				});
			}
		} else {
			notes.push({
				severity: 'info',
				start: block.start,
				message: `Vacation overlaps a seam period, so the ${DUTY_FREE_MIN[type][block.weeks >= 2 ? 'two' : 'one']} day duty-free minimum does not apply (19.4(H)(2)(a) / (3)(a) exception for days shifted under 19.5(C)).`
			});
		}
	}

	return { days: out, notes };
};

/** Length of the unbroken non-working run containing `seed`. */
const dutyFreeAround = (
	days: ScheduleDay[],
	seed: Date,
	at: (d: Date) => ScheduleDay | undefined
): number => {
	if (at(seed) === undefined) return 0;
	let n = 1;
	for (let d = addDays(seed, -1); ; d = addDays(d, -1)) {
		const day = at(d);
		if (day === undefined || day.kind === 'work') break;
		n++;
	}
	for (let d = addDays(seed, 1); ; d = addDays(d, 1)) {
		const day = at(d);
		if (day === undefined || day.kind === 'work') break;
		n++;
	}
	return n;
};
