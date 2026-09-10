import type { PageServerLoad } from './$types';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import {
	BID_PERIOD_MONTHS,
	LINES,
	bidPeriodStart,
	daysBetween,
	isValidLine,
	seamStartFor,
	seamTableLetterFor
} from '$lib/schedule';
import { VACATION_WEEK_DAYS } from '$lib/schedule/vacation';
import { DEFAULT_TOUR_TITLE } from '$lib/schedule/ical';
import { holidayMap } from '$lib/schedule/holidays';
import { buildContext, fmtDate, isScheduleType, parseDate } from '$lib/server/seam';

export const load: PageServerLoad = async ({ url }) => {
	const ctx = await buildContext(url.searchParams.getAll('t'));

	// Bid periods the pilot could still bid into, up to the next open bid.
	const today = new Date();
	const options: { value: string; label: string; seam: string }[] = [];
	for (let y = today.getFullYear(); y <= today.getFullYear() + 1; y++) {
		for (const m of BID_PERIOD_MONTHS) {
			const start = bidPeriodStart(y, m);
			if (start <= today) continue;
			options.push({
				value: `${y}-${String(m).padStart(2, '0')}`,
				label: start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
				seam: fmtDate(seamStartFor(start))
			});
		}
	}

	const tourTitle = await settings.get('schedule.ical.tourTitle');

	return {
		current: ctx.current,
		tourTitle,
		vacations: ctx.vacations.map((v) => ({ ...v, start: fmtDate(v.start) })),
		transitions: ctx.transitions.map((t) => ({
			period: `${t.periodStart.getFullYear()}-${String(t.periodStart.getMonth() + 1).padStart(2, '0')}`,
			line: t.line,
			type: t.type
		})),
		days: ctx.days.map((d) => ({
			date: fmtDate(d.date),
			kind: d.kind,
			inSeam: d.inSeam,
			line: d.line
		})),
		notes: ctx.notes.map((n) => ({
			severity: n.severity,
			start: fmtDate(n.start),
			message: n.message
		})),
		seamPeriods: ctx.seams.map((s) => ({
			start: fmtDate(s.seamStart),
			end: fmtDate(s.seamEnd),
			letter: seamTableLetterFor(s.seamStart),
			label: `${s.from.type} line ${s.from.line} to ${s.to.type} line ${s.to.line}`
		})),
		errors: ctx.errors,
		buildError: ctx.buildError,
		// Resolved server-side so the highlight cannot disagree between the SSR
		// pass and hydration, and so it follows the container's configured TZ.
		today: fmtDate(new Date()),
		holidays: holidayMap(ctx.range.from, ctx.range.to),
		bidPeriodOptions: options,
		lines: LINES
	};
};

export const actions = {
	setCurrent: async ({ request }) => {
		const data = await request.formData();
		const line = Number(data.get('line'));
		const type = String(data.get('type') ?? '');

		if (!isScheduleType(type)) return fail(400, { message: 'Pick a schedule type' });
		if (!isValidLine(line, type)) {
			return fail(400, { message: `Line ${line} is not a valid ${type} line` });
		}

		await settings.set('schedule.current.line', line);
		await settings.set('schedule.current.type', type);
	},

	addVacation: async ({ request }) => {
		const data = await request.formData();
		const startRaw = String(data.get('startDate') ?? '');
		const label = String(data.get('label') ?? '').trim().toUpperCase();

		const start = parseDate(startRaw);
		if (start === null) return fail(400, { message: 'Pick a start date' });
		if (label !== '' && !/^[A-D]$/.test(label)) {
			return fail(400, { message: 'Bid label is A, B, C or D (subsection 8.5)' });
		}

		// Awarded weeks are distinct seven day blocks, so they may sit back to
		// back (that is a two week vacation under 19.4(H)(3)) but must never
		// overlap. The unique constraint only catches an identical start date.
		const existing = await prisma.vacationWeek.findMany();
		if (existing.some((row) => row.startDate === startRaw)) {
			return fail(400, { message: 'A vacation week already starts on that date' });
		}
		const clash = existing.find((row) => {
			const other = parseDate(row.startDate);
			return other !== null && Math.abs(daysBetween(other, start)) < VACATION_WEEK_DAYS;
		});
		if (clash !== undefined) {
			return fail(400, {
				message: `That week overlaps the one starting ${clash.startDate}. Awarded weeks can be back to back, but not overlapping.`
			});
		}

		await prisma.vacationWeek.create({ data: { startDate: startRaw, label } });
	},

	setTourTitle: async ({ request }) => {
		const data = await request.formData();
		const title = String(data.get('tourTitle') ?? '').trim();
		// An empty title would produce nameless calendar entries, so fall back.
		await settings.set('schedule.ical.tourTitle', title === '' ? DEFAULT_TOUR_TITLE : title);
	},

	removeVacation: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!Number.isInteger(id)) return fail(400, { message: 'Bad id' });
		await prisma.vacationWeek.delete({ where: { id } });
	}
};
