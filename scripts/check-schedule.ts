import {
	SEAM_TABLES, buildSchedule, seamStartFor, seamTableLetterFor, bidPeriodStart,
	addDays, isSteadyWorkDay, LINES, groupTours,
	type ScheduleType, type SeamTableLetter, type TransitionKind
} from '../src/lib/schedule/index.ts';

let pass = 0; const fails: string[] = [];
const check = (name: string, ok: boolean, detail = '') => {
	if (ok) pass++; else fails.push(`${name}${detail ? ': ' + detail : ''}`);
};

// --- 1. the 19.9 published A/B lookup, verbatim ------------------------------
const PUBLISHED = `2015 2 A|2015 6 B|2015 10 A|2016 2 A|2016 6 B|2016 10 B|2017 2 A|2017 6 B|2017 10 B|
2018 2 A|2018 6 B|2018 10 B|2019 2 A|2019 6 A|2019 10 B|2020 2 B|2020 6 A|2020 10 B|
2021 2 B|2021 6 A|2021 10 B|2022 2 B|2022 6 A|2022 10 A|2023 2 B|2023 6 A|2023 10 A|
2024 2 B|2024 6 B|2024 10 A|2025 2 A|2025 6 B|2025 10 A|2026 2 A|2026 6 B|2026 10 A|
2027 2 A|2027 6 B|2027 10 A|2028 2 A|2028 6 B|2028 10 B`.replace(/\n/g, '').split('|');
for (const row of PUBLISHED) {
	const [y, m, want] = row.trim().split(/\s+/);
	const got = seamTableLetterFor(seamStartFor(bidPeriodStart(+y, +m as 2 | 6 | 10)));
	check(`19.9 letter ${y}-${m}`, got === want, `got ${got}, want ${want}`);
}

// --- 2. NJASAP worked example: line 13 -> line 1, June 2020 ------------------
const days = buildSchedule(
	{ line: 13, type: '7&7' },
	[{ periodStart: new Date(2020, 5, 1), line: 1, type: '7&7' }],
	new Date(2020, 4, 22), new Date(2020, 5, 18)
);
const worked = days.filter((d) => d.kind === 'work')
	.map((d) => `${d.date.getMonth() + 1}/${d.date.getDate()}`).join(' ');
const EXPECT = '5/27 5/28 5/29 5/30 5/31 6/4 6/5 6/6 6/7 6/8 6/12 6/13 6/14 6/15 6/16 6/17 6/18';
check('worked example', worked === EXPECT, `\n      got  ${worked}\n      want ${EXPECT}`);

// --- 3. engine reproduces every published seam row ---------------------------
const TYPE_OF: Record<TransitionKind, [ScheduleType, ScheduleType]> = {
	'7to7': ['7&7', '7&7'], '8to8': ['8&6', '8&6'], '8to7': ['8&6', '7&7'], '7to8': ['7&7', '8&6']
};
// a real bid period for each letter
const SEAMS: Record<SeamTableLetter, Date> = { A: new Date(2020, 5, 1), B: new Date(2024, 5, 1) };
for (const l of ['A', 'B'] as SeamTableLetter[]) {
	check(`sample period is table ${l}`, seamTableLetterFor(seamStartFor(SEAMS[l])) === l);
}
let rows = 0;
for (const letter of ['A', 'B'] as SeamTableLetter[]) {
	for (const kind of Object.keys(SEAM_TABLES[letter]) as TransitionKind[]) {
		const [ft, tt] = TYPE_OF[kind];
		for (const fromLine of Object.keys(SEAM_TABLES[letter][kind]).map(Number)) {
			for (const toLine of Object.keys(SEAM_TABLES[letter][kind][fromLine]).map(Number)) {
				const period = SEAMS[letter];
				const seam = seamStartFor(period);
				const built = buildSchedule(
					{ line: fromLine, type: ft },
					[{ periodStart: period, line: toLine, type: tt }],
					addDays(seam, -7), addDays(seam, 20)
				);
				const got = built.map((d) => (d.kind === 'work' ? 'X' : '.')).join('');
				const want = SEAM_TABLES[letter][kind][fromLine][toLine];
				rows++;
				check(`${letter}/${kind}/${fromLine}->${toLine}`, got === want, `\n      got  ${got}\n      want ${want}`);
			}
		}
	}
}

// --- 4. steady state invariants ---------------------------------------------
for (const type of ['7&7', '8&6'] as ScheduleType[]) {
	for (const line of LINES[type]) {
		const start = new Date(2026, 0, 1);
		const sched = buildSchedule({ line, type }, [], start, addDays(start, 111));
		const tours = groupTours(sched).slice(1, -1); // drop window-clipped ends
		const len = type === '7&7' ? 7 : 8;
		check(`${type} line ${line} tour lengths`, tours.every((t) => t.length === len),
			tours.map((t) => t.length).join(','));
		check(`${type} line ${line} start weekday`,
			tours.every((t) => t.start.getDay() === (5 + (line - 1)) % 7));
		check(`${type} line ${line} steady-state agrees`,
			sched.every((d) => (d.kind === 'work') === isSteadyWorkDay(d.date, line, type)));
	}
}

console.log(`seam rows exercised: ${rows}`);
console.log(`passed: ${pass}   failed: ${fails.length}`);
for (const f of fails.slice(0, 10)) console.log('  ! ' + f);
if (fails.length) process.exit(1);
