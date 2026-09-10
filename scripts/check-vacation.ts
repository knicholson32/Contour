import {
	buildSchedule, resolveSeams, groupTours, addDays,
	type LineAssignment, type ScheduleType
} from '../src/lib/schedule/index.ts';
import { applyVacation } from '../src/lib/schedule/vacation.ts';

let pass = 0; const fails: string[] = [];
const check = (name: string, ok: boolean, detail = '') => {
	if (ok) pass++; else fails.push(`${name}${detail ? ': ' + detail : ''}`);
};
const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

/** Longest run of consecutive non-work days that contains `seed`. */
const dutyFree = (days: { date: Date; kind: string }[], seed: Date) => {
	const i = days.findIndex((d) => d.date.getTime() === seed.getTime());
	if (i < 0) return 0;
	let a = i, b = i;
	while (a > 0 && days[a - 1].kind !== 'work') a--;
	while (b < days.length - 1 && days[b + 1].kind !== 'work') b++;
	return b - a + 1;
};

// --- one week, no seam -------------------------------------------------------
// 19.4(H)(2)(a): 7 work days credited off, >= 21 day duty-free period.
// 19.4(H)(2)(c): 8&6 gets 8 days off and >= 20.
for (const [type, credit, minFree] of [['7&7', 7, 21], ['8&6', 8, 20]] as [ScheduleType, number, number][]) {
	const line = type === '7&7' ? 3 : 4;
	const initial: LineAssignment = { line, type };
	const from = new Date(2026, 0, 1), to = new Date(2026, 3, 30);
	const base = buildSchedule(initial, [], from, to);
	// place the vacation over a tour so exactly one tour overlaps
	const tour = groupTours(base)[3];
	const vac = { start: tour.start };
	const { days, notes } = applyVacation(base, [vac], initial, []);

	const removedWork = base.filter((d, i) => d.kind === 'work' && days[i].kind !== 'work').length;
	check(`${type} 1wk credits ${credit}`, removedWork === credit, `removed ${removedWork}`);
	check(`${type} 1wk duty-free >= ${minFree}`, dutyFree(days, vac.start) >= minFree,
		`${dutyFree(days, vac.start)}`);
	check(`${type} 1wk no warnings`, notes.length === 0, notes.map((n) => n.message).join('; '));
	check(`${type} 1wk marks 7 vacation days`,
		days.filter((d) => d.kind === 'vacation').length === 7);
}

// --- two consecutive weeks, no seam -----------------------------------------
// 19.4(H)(3)(a): 14 days off, >= 35 duty-free. (H)(3)(c): 16 off, >= 34.
for (const [type, credit, minFree] of [['7&7', 14, 35], ['8&6', 16, 34]] as [ScheduleType, number, number][]) {
	const line = type === '7&7' ? 3 : 4;
	const initial: LineAssignment = { line, type };
	const base = buildSchedule(initial, [], new Date(2026, 0, 1), new Date(2026, 4, 31));
	const tour = groupTours(base)[3];
	const wks = [{ start: tour.start }, { start: addDays(tour.start, 7) }];
	const { days, notes } = applyVacation(base, wks, initial, []);
	const removed = base.filter((d, i) => d.kind === 'work' && days[i].kind !== 'work').length;
	check(`${type} 2wk credits ${credit}`, removed === credit, `removed ${removed}`);
	check(`${type} 2wk duty-free >= ${minFree}`, dutyFree(days, tour.start) >= minFree,
		`${dutyFree(days, tour.start)}`);
	check(`${type} 2wk marks 14 vacation days`,
		days.filter((d) => d.kind === 'vacation').length === 14);
	check(`${type} 2wk no warnings`, notes.length === 0, notes.map((n) => n.message).join('; '));
}

// --- three consecutive weeks is not permitted -------------------------------
{
	const initial: LineAssignment = { line: 3, type: '7&7' };
	const base = buildSchedule(initial, [], new Date(2026, 0, 1), new Date(2026, 4, 31));
	const t = groupTours(base)[3];
	const wks = [0, 7, 14].map((n) => ({ start: addDays(t.start, n) }));
	const { notes } = applyVacation(base, wks, initial, []);
	check('3 consecutive weeks flagged',
		notes.some((n) => n.message.includes('19.4(H)(4)')));
}

// --- vacation overlapping a seam --------------------------------------------
// Uses the extended ladder per the heading of 19.4(H)(2)(a)(i).
{
	const initial: LineAssignment = { line: 13, type: '7&7' };
	const transitions = [{ periodStart: new Date(2020, 5, 1), line: 1, type: '7&7' as ScheduleType }];
	const seams = resolveSeams(initial, transitions);
	const base = buildSchedule(initial, transitions, new Date(2020, 3, 1), new Date(2020, 7, 31));
	// the seam period is 29 May - 11 Jun 2020
	const vac = { start: new Date(2020, 4, 29) };
	const { days, notes } = applyVacation(base, [vac], initial, seams);
	const removed = base.filter((d, i) => d.kind === 'work' && days[i].kind !== 'work').length;
	check('seam 1wk removes >= 7', removed >= 7, `removed ${removed}`);
	check('seam 1wk marks 7 vacation days',
		days.filter((d) => d.kind === 'vacation').length === 7);
	check('seam 1wk clears all work days in the week',
		days.filter((d) => d.date >= vac.start && d.date <= addDays(vac.start, 6) && d.kind === 'work').length === 0);
	console.log(`  seam vacation 5/29-6/4: removed ${removed} work days, ` +
		`duty-free ${dutyFree(days, vac.start)}, notes: ${notes.length}`);
	for (const n of notes) console.log(`    - [${n.severity}] ${fmt(n.start)} ${n.message}`);
}

// --- 8.4: schedule in force when taken governs -------------------------------
{
	const initial: LineAssignment = { line: 13, type: '7&7' };
	const transitions = [{ periodStart: new Date(2026, 5, 1), line: 4, type: '8&6' as ScheduleType }];
	const seams = resolveSeams(initial, transitions);
	const base = buildSchedule(initial, transitions, new Date(2026, 3, 1), new Date(2026, 8, 30));
	// well after the seam, so the incoming 8&6 line governs -> 8 days credited
	const after = groupTours(base).find((t) => t.start > new Date(2026, 6, 1))!;
	const { days } = applyVacation(base, [{ start: after.start }], initial, seams);
	const removed = base.filter((d, i) => d.kind === 'work' && days[i].kind !== 'work').length;
	check('8.4 post-seam vacation uses new 8&6 credit', removed === 8, `removed ${removed}`);
}

console.log(`passed: ${pass}   failed: ${fails.length}`);
for (const f of fails) console.log('  ! ' + f);
if (fails.length) process.exit(1);
