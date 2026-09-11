<script lang="ts">
	import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { AlertTriangle, CalendarDays, Download, Info, Plus, Trash2 } from 'lucide-svelte';
	import CbaText from '$lib/components/CbaText.svelte';

	interface Props {
		data: import('./$types').PageData;
		form: import('./$types').ActionData;
	}

	let { data, form }: Props = $props();

	const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	/** `YYYY-MM-DD` -> local Date. Avoids the UTC parse `new Date(str)` performs. */
	const parse = (s: string) => {
		const [y, m, d] = s.split('-').map(Number);
		return new Date(y, m - 1, d);
	};

	interface Cell {
		/** The ISO date; unique within a month grid. */
		key: string;
		date: string;
		day: number;
		kind: string;
		inSeam: boolean;
		/**
		 * Whether the same run of work or vacation continues into the adjacent
		 * day. Taken from the schedule rather than from grid position, so a run
		 * cut by a week row or a month boundary still reads as continuing.
		 */
		contL: boolean;
		contR: boolean;
		/** Name of the designated holiday falling on this day, if any. */
		holiday: string | null;
		/** False when the day lies beyond the range we can predict. */
		hasData: boolean;
		/** True when the day belongs to a neighbouring month. */
		outside: boolean;
		/** Column within the week row, 0 = Sunday. A run is cut at either edge. */
		col: number;
	}
	interface Month {
		key: string;
		label: string;
		cells: Cell[];
	}
	interface Year {
		year: number;
		months: Month[];
	}

	const pad = (n: number) => String(n).padStart(2, '0');
	const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

	// Build a full calendar grid for every month the schedule touches, then band
	// those by year. A schedule can span three calendar years, so the year
	// boundary needs to be obvious rather than implied by a month name.
	//
	// Each grid is padded to whole weeks with the neighbouring months' days, so
	// a week is never visually truncated at a month boundary.
	const years = $derived.by(() => {
		const byDate = new Map(data.days.map((d) => [d.date, d]));

		// Months present in the range, in order.
		const present: { y: number; m: number }[] = [];
		let lastKey = '';
		for (const d of data.days) {
			const date = parse(d.date);
			const key = `${date.getFullYear()}-${date.getMonth()}`;
			if (key !== lastKey) {
				present.push({ y: date.getFullYear(), m: date.getMonth() });
				lastKey = key;
			}
		}

		const out: Year[] = [];
		for (const { y, m } of present) {
			const lead = new Date(y, m, 1).getDay();
			const inMonth = new Date(y, m + 1, 0).getDate();
			// Pad to whole weeks. Neighbouring months' days are real days with a
			// real schedule, so they are built the same way as any other and only
			// differ in how they are drawn.
			const span = lead + inMonth;
			const total = span + ((7 - (span % 7)) % 7);
			const cells: Cell[] = [];

			for (let i = 0; i < total; i++) {
				const at = new Date(y, m, 1 - lead + i);
				const date = iso(at.getFullYear(), at.getMonth(), at.getDate());
				const rec = byDate.get(date);
				const bar = rec !== undefined && (rec.kind === 'work' || rec.kind === 'vacation');
				const neighbour = (offset: number) => {
					const n = new Date(at.getFullYear(), at.getMonth(), at.getDate() + offset);
					return byDate.get(iso(n.getFullYear(), n.getMonth(), n.getDate()))?.kind;
				};
				cells.push({
					key: date,
					date,
					day: at.getDate(),
					kind: rec?.kind ?? 'off',
					hasData: rec !== undefined,
					outside: at.getMonth() !== m,
					inSeam: rec?.inSeam ?? false,
					contL: bar && neighbour(-1) === rec.kind,
					contR: bar && neighbour(1) === rec.kind,
					holiday: data.holidays[date] ?? null,
					col: i % 7
				});
			}

			let year = out[out.length - 1];
			if (year === undefined || year.year !== y) {
				year = { year: y, months: [] };
				out.push(year);
			}
			year.months.push({
				key: `${y}-${m}`,
				label: new Date(y, m, 1).toLocaleDateString(undefined, { month: 'long' }),
				cells
			});
		}
		return out;
	});

	/** Split a month's cells into weeks, so the grid can use real table rows. */
	const weeksOf = (m: Month): Cell[][] => {
		const out: Cell[][] = [];
		for (let i = 0; i < m.cells.length; i += 7) out.push(m.cells.slice(i, i + 7));
		return out;
	};

	const workDays = $derived(data.days.filter((d) => d.kind === 'work').length);
	const vacationDays = $derived(data.days.filter((d) => d.kind === 'vacation').length);

	// Mirrors the RangeCalendar day styling used on the dashboard: only days that
	// mean something carry a filled tile, everything else is plain text. Colours
	// come from the theme tokens so this tracks the rest of the app.
	const cellClass = (c: Cell) => {
		// Nothing known about the day, so nothing to draw beyond the number.
		if (!c.hasData) return 'text-muted-foreground opacity-50';

		let base: string;
		// Today wins over the schedule colours. The run's squared edges and the
		// filled days either side still show whether it falls inside a tour, so
		// nothing is lost by overriding the fill for one day.
		if (c.date === data.today) base = 'bg-amber-400 text-amber-950';
		// Work is the selected-day equivalent: the one thing being scanned for.
		else if (c.kind === 'work') base = 'bg-primary text-primary-foreground';
		else if (c.kind === 'vacation')
			base = 'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300';
		else base = 'text-foreground';

		// A neighbouring month's days keep their colours but recede, following
		// RangeCalendar's data-outside-month treatment. Tours and vacation stay
		// legible so a run reads continuously across the month boundary.
		return c.outside ? `${base} opacity-40` : base;
	};

	/**
	 * A run of work or vacation renders as a continuous bar, rounded wherever
	 * the bar actually ends on screen.
	 *
	 * That is either end of the run itself, or the edge of a week row: a run
	 * crossing a week wraps onto the next line, so each visible segment gets
	 * capped rather than left with a squared-off edge against nothing.
	 */
	const roundClass = (c: Cell) => {
		if (!c.hasData || (c.kind !== 'work' && c.kind !== 'vacation')) return 'rounded-md';
		const openL = !c.contL || c.col === 0;
		const openR = !c.contR || c.col === 6;
		if (openL && openR) return 'rounded-md';
		if (openL) return 'rounded-l-md rounded-r-none';
		if (openR) return 'rounded-l-none rounded-r-md';
		return 'rounded-none';
	};

	// Transitions live in the query string so the pilot can explore without saving.
	const setTransitions = (list: { period: string; line: number; type: string }[]) => {
		const u = new URL(page.url);
		u.searchParams.delete('t');
		for (const t of list) u.searchParams.append('t', `${t.period}:${t.line}:${t.type}`);
		goto(u, { keepFocus: true, noScroll: true });
	};

	let newPeriod = $state('');
	let newLine = $state('');
	let newType = $state<'7&7' | '8&6'>('7&7');

	const addTransition = () => {
		if (newPeriod === '' || newLine === '') return;
		setTransitions([
			...data.transitions,
			{ period: newPeriod, line: Number(newLine), type: newType }
		]);
		newPeriod = '';
		newLine = '';
	};

	const removeTransition = (i: number) =>
		setTransitions(data.transitions.filter((_, n) => n !== i));

	// Only lines valid for the chosen type may be offered (19.2(E)(2) limits 8&6
	// lines to Monday, Wednesday and Saturday starts).
	const linesFor = (t: '7&7' | '8&6') => data.lines[t];
	const startDayOf = (line: number) => DOW[(5 + (line - 1)) % 7];
	const startDayFull = (line: number) => DOW_FULL[(5 + (line - 1)) % 7];
</script>

<OneColumn>
	<div class="mx-auto w-full max-w-[120rem] px-4 py-6 space-y-4 xl:px-6">
		<div>
			<h1 class="text-xl font-semibold">Seam &amp; Vacations</h1>
			<p class="text-muted-foreground text-sm">
				<CbaText text="Seam transitions per 2024AA §19.9, with vacation applied under §19.4(H)." />
			</p>
		</div>

		{#if form?.message}
			<div class="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
				<CbaText text={form.message} />
			</div>
		{/if}

		<!-- Controls. These sit side by side once there is room for them, so the
		     calendar stays as close to the top of the viewport as possible. -->
		<div class="grid gap-4 lg:grid-cols-3 lg:items-start">
			<!-- Current schedule ------------------------------------------------- -->
			<section class="bg-card text-card-foreground rounded-lg border p-4 shadow-xs">
				<h2 class="text-sm font-semibold">Current schedule</h2>
				<form method="POST" action="?/setCurrent" use:enhance class="mt-3 flex flex-wrap items-end gap-3">
					<label class="text-muted-foreground text-xs">
						Type
						<select
							name="type"
							value={data.current?.type ?? '7&7'}
							class="mt-1 block rounded-md border-input bg-background border px-2 py-1.5 text-sm"
						>
							<option value="7&7">7 &amp; 7</option>
							<option value="8&6">8 &amp; 6</option>
						</select>
					</label>
					<label class="text-muted-foreground text-xs">
						Line
						<input
							name="line"
							type="number"
							min="1"
							max="14"
							value={data.current?.line ?? ''}
							class="mt-1 block w-24 rounded-md border-input bg-background border px-2 py-1.5 text-sm"
						/>
					</label>
					<button class="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm font-medium">
						Save
					</button>
					{#if data.current}
						<span class="text-muted-foreground text-xs">
							Line {data.current.line} starts on {startDayFull(data.current.line)}s.
						</span>
					{/if}
				</form>
				<p class="text-muted-foreground mt-2 text-xs">
					<CbaText
						text="7&7 lines run 1 to 14. 8&6 lines are limited to Monday, Wednesday and Saturday starts by 19.2(E)(2)."
					/>
				</p>
			</section>

		{#if data.current !== null}
			<!-- Bids ----------------------------------------------------------- -->
			<section class="bg-card text-card-foreground rounded-lg border p-4 shadow-xs">
				<h2 class="text-sm font-semibold">Bid a new line</h2>
				<p class="text-muted-foreground mt-1 text-xs">
					<CbaText
						text="Bid periods begin 1 February, 1 June and 1 October per 19.2(B). Chain as many as you like; these are not saved, they live in the URL so you can share or bookmark a scenario."
					/>
				</p>

				{#if data.transitions.length > 0}
					<ul class="mt-3 space-y-1.5">
						{#each data.transitions as t, i}
							<li class="flex flex-wrap items-center gap-2 text-sm ">
								<span class="text-muted-foreground font-mono text-xs">{t.period}</span>
								<span>{t.type} line {t.line} ({startDayOf(t.line)} start)</span>
								<button
									type="button"
									class="text-muted-foreground hover:text-destructive cursor-pointer"
									onclick={() => removeTransition(i)}
									aria-label="Remove"
								>
									<Trash2 size={14} />
								</button>
							</li>
						{/each}
					</ul>
				{/if}

				<div class="mt-3 flex flex-wrap items-end gap-3">
					<label class="text-muted-foreground text-xs">
						Bid period
						<select
							bind:value={newPeriod}
							class="mt-1 block rounded-md border-input bg-background border px-2 py-1.5 text-sm"
						>
							<option value="">Select&hellip;</option>
							{#each data.bidPeriodOptions as o}
								<option value={o.value}>{o.label}</option>
							{/each}
						</select>
					</label>
					<label class="text-muted-foreground text-xs">
						Type
						<select
							bind:value={newType}
							class="mt-1 block rounded-md border-input bg-background border px-2 py-1.5 text-sm"
						>
							<option value="7&7">7 &amp; 7</option>
							<option value="8&6">8 &amp; 6</option>
						</select>
					</label>
					<label class="text-muted-foreground text-xs">
						Line
						<select
							bind:value={newLine}
							class="mt-1 block rounded-md border-input bg-background border px-2 py-1.5 text-sm"
						>
							<option value="">Select&hellip;</option>
							{#each linesFor(newType) as l}
								<option value={String(l)}>{l} &mdash; {startDayOf(l)}</option>
							{/each}
						</select>
					</label>
					<button
						type="button"
						onclick={addTransition}
						class="cursor-pointer flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm font-medium"
					>
						<Plus size={14} /> Add
					</button>
				</div>
			</section>

			<!-- Vacation ------------------------------------------------------- -->
			<section class="bg-card text-card-foreground rounded-lg border p-4 shadow-xs">
				<h2 class="text-sm font-semibold">Awarded vacation</h2>
				<p class="text-muted-foreground mt-1 text-xs">
					<CbaText text="Whole weeks only. Each award covers seven days from the start date, per Section 8." />
				</p>

				{#if data.vacations.length > 0}
					<ul class="mt-3 space-y-1.5">
						{#each data.vacations as v}
							<li class="flex items-center gap-3 text-sm ">
								<span class="text-muted-foreground font-mono text-xs">{v.start}</span>
								{#if v.label}<span class="bg-muted rounded px-1.5 text-xs">{v.label}</span>{/if}
								<form method="POST" action="?/removeVacation" use:enhance>
									<input type="hidden" name="id" value={v.id} />
									<button class="text-muted-foreground hover:text-destructive cursor-pointer" aria-label="Remove">
										<Trash2 size={14} />
									</button>
								</form>
							</li>
						{/each}
					</ul>
				{/if}

				<form method="POST" action="?/addVacation" use:enhance class="mt-3 flex flex-wrap items-end gap-3">
					<label class="text-muted-foreground text-xs">
						Week starts
						<input
							name="startDate"
							type="date"
							required
							class="mt-1 block rounded-md border-input bg-background border px-2 py-1.5 text-sm"
						/>
					</label>
					<label class="text-muted-foreground text-xs">
						Bid label
						<input
							name="label"
							maxlength="1"
							placeholder="A"
							class="mt-1 block w-16 rounded-md border-input bg-background border px-2 py-1.5 text-sm"
						/>
					</label>
					<button class="cursor-pointer flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm font-medium">
						<Plus size={14} /> Add
					</button>
				</form>
			</section>

			<!-- Calendar export -------------------------------------------------- -->
			<section class="bg-card text-card-foreground rounded-lg border p-4 shadow-xs lg:col-span-3">
				<h2 class="flex items-center gap-2 text-sm font-semibold">
					<CalendarDays size={14} /> Calendar
				</h2>
				<div class="mt-3 flex flex-wrap items-end gap-4">
					<form method="POST" action="?/setTourTitle" use:enhance class="flex items-end gap-2">
						<label class="text-muted-foreground text-xs">
							Tour title
							<input
								name="tourTitle"
								value={data.tourTitle}
								placeholder="Tour"
								class="mt-1 block w-52 rounded-md border-input bg-background border px-2 py-1.5 text-sm"
							/>
						</label>
						<button class="border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md border px-3 py-1.5 text-sm">
							Save
						</button>
					</form>
					<!--
						Opened in a new tab so SvelteKit's client router leaves the link
						alone. A same-tab navigation fires beforeNavigate, which starts
						NProgress and only stops it on navigate.complete - and a download
						never completes a navigation, so the bar would sit there forever.
					-->
					<a
						href="/tools/seam/calendar.ics{page.url.search}"
						target="_blank"
						rel="noopener"
						class="cursor-pointer flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm font-medium"
					>
						<Download size={14} /> Download .ics
					</a>
				</div>
				<p class="text-muted-foreground mt-3 text-xs">
					One event per tour, named with the title above. <code>{'{days}'}</code> and
					<code>{'{line}'}</code> are substituted if you use them. Days off and vacation are left
					blank rather than given their own events, so the gaps speak for themselves.
				</p>
				<p class="text-muted-foreground mt-1 text-xs">
					The file covers the schedule you are transitioning into, starting at the seam period, and
					includes any scenario bids above. Import it into a calendar of its own so you can clear and
					re-import when you rebid.
				</p>

			</section>

		{/if}
		</div>

		{#if data.current === null}
			<div class="rounded-md bg-amber-50 dark:bg-amber-950 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
				Set your current line to see a schedule.
			</div>
		{:else}
			<!-- Diagnostics ---------------------------------------------------- -->
			{#if data.buildError}
				<div class="flex gap-2 rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
					<AlertTriangle size={16} class="mt-0.5 shrink-0" />
					<span><CbaText text={data.buildError} /></span>
				</div>
			{/if}
			{#each data.errors as e}
				<div class="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300"><CbaText text={e} /></div>
			{/each}
			{#each data.notes as n}
				<div
					class="flex gap-2 rounded-md px-3 py-2 text-sm {n.severity === 'warning'
						? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
						: 'bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300'}"
				>
					{#if n.severity === 'warning'}
						<AlertTriangle size={16} class="mt-0.5 shrink-0" />
					{:else}
						<Info size={16} class="mt-0.5 shrink-0" />
					{/if}
					<span><span class="font-mono text-xs">{n.start}</span> &mdash; <CbaText text={n.message} /></span>
				</div>
			{/each}

			<!-- Calendar ------------------------------------------------------- -->
			<section class="bg-card text-card-foreground rounded-lg border p-4 shadow-xs">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<h2 class="text-sm font-semibold">Calendar</h2>
					<div class="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
						<span class="flex items-center gap-1"><span class="bg-primary inline-block size-3 rounded"></span> Work ({workDays})</span>
						<span class="flex items-center gap-1"><span class="inline-block size-3 rounded bg-emerald-500/20 ring-1 ring-inset ring-emerald-500/50"></span> Vacation ({vacationDays})</span>
						<span class="flex items-center gap-1"><span class="bg-amber-400 inline-block size-3 rounded"></span> Today</span>
						<span class="flex items-center gap-1"><span class="inline-block size-1 rounded-full bg-red-500"></span> Seam</span>
						<span class="flex items-center gap-1"><span class="inline-block size-1 rounded-full bg-amber-400"></span> Holiday</span>
					</div>
				</div>

				{#each data.seamPeriods as s}
					<p class="text-muted-foreground mt-2 text-xs">
						<CbaText text={`Seam ${s.start} to ${s.end} per 19.9 table ${s.letter}: ${s.label}`} />
					</p>
				{/each}

				{#each years as y (y.year)}
					<div class="mt-5">
						<div class="mb-3 flex items-center gap-3">
							<h3 class="text-sm font-medium tracking-wide">{y.year}</h3>
							<div class="bg-border h-px flex-1"></div>
							<span class="text-muted-foreground text-[0.8rem] font-normal">
								{y.months.length}
								{y.months.length === 1 ? 'month' : 'months'}
							</span>
						</div>
						<!--
							A month grid is a fixed 252px (7 x size-9), so only one fits below
							the sm breakpoint. Centre it there, and go back to a flush left
							edge once two or more sit on a row.
						-->
						<div class="flex flex-wrap justify-center gap-x-6 gap-y-5 sm:justify-start">
							{#each y.months as m (m.key)}
								<div class="space-y-2">
									<h4 class="text-center text-sm font-medium">{m.label}</h4>
									<table class="w-max border-collapse">
										<thead>
											<tr class="flex">
												{#each DOW as d}
													<th
														scope="col"
														class="text-muted-foreground w-9 rounded-md text-[0.8rem] font-normal"
													>
														{d[0]}
													</th>
												{/each}
											</tr>
										</thead>
										<tbody>
											{#each weeksOf(m) as week, w (w)}
												<tr class="mt-2 flex w-full">
													{#each week as c (c.key)}
														<td class="relative p-0 text-center text-sm">
															<div
																title={[
																	c.date,
																	c.outside ? 'other month' : null,
																	c.holiday,
																	c.inSeam ? 'seam period' : null
																]
																	.filter(Boolean)
																	.join(' · ')}
																aria-hidden={c.outside ? 'true' : undefined}
																class="relative flex size-9 items-center justify-center p-0 font-normal {roundClass(
																	c
																)} {cellClass(c)}"
															>
																{c.day}
																{#if c.holiday}
																	<span
																		class="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-amber-400"
																	></span>
																{/if}
																{#if c.inSeam}
																	<span
																		class="absolute right-1 top-1 size-1 rounded-full bg-red-500"
																	></span>
																{/if}
															</div>
														</td>
													{/each}
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</section>
		{/if}
	</div>
</OneColumn>
