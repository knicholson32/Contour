import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildContext } from '$lib/server/seam';
import { buildCalendar } from '$lib/schedule/ical';
import * as settings from '$lib/server/settings';

/**
 * One-shot download of the schedule being transitioned into, including any
 * proposed bids carried in the `t` query parameters.
 *
 * The export starts at the first seam period rather than at the beginning of
 * the built range: the pilot already knows the line they are on, and what they
 * want in their calendar is what changes.
 */
export const GET: RequestHandler = async ({ url }) => {
	const ctx = await buildContext(url.searchParams.getAll('t'));

	if (ctx.current === null) error(409, 'Set a current schedule before exporting a calendar');
	if (ctx.buildError !== null) error(409, ctx.buildError);
	if (ctx.seams.length === 0) {
		error(409, 'No line change to export. Add a bid, or lock in an awarded line.');
	}

	const body = buildCalendar(ctx.days, ctx.seams, {
		name: 'Flight Schedule',
		tourTitle: await settings.get('schedule.ical.tourTitle'),
		// resolveSeams returns them in date order, so the first is the earliest.
		from: ctx.seams[0].seamStart
	});

	return new Response(body, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': 'attachment; filename="contour-schedule.ics"',
			'Cache-Control': 'no-store'
		}
	});
};
