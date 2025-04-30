<script lang="ts">

  import type * as Types from '@prisma/client';
  import * as helpers from '$lib/helpers';
  import Schedule from './helpers/Schedule.svelte';
  import Blank from './helpers/Blank.svelte';

  export let data: ((Types.Deadhead | (Types.Leg & { aircraft: { simulator: boolean } })) & { type: 'deadhead' | 'leg', diversionAirportId: string | null })[];
  export let day: Types.DutyDay;

  // Sort the data so deadheads come before flights if they start at the same time
  data.sort((a, b) => a.startTime_utc === b.startTime_utc ? (a.type === 'deadhead' ? -1 : 1) : 0);

  let dutyDayLength = ((day.endTime_utc - day.startTime_utc) / 60 / 60).toFixed(1);

  const dataFormatted: {
    entity: (typeof data[0] | {
      type: 'blank',
      startTime_utc: number,
      endTime_utc: number,
    }),
    i: number
  }[] = [];


  const dataCleaned: typeof data = [];
  for (const d of data) {
    if (d.endTime_utc === null || d.startTime_utc === null || (d.type === 'leg' && (d as (Types.Leg & { aircraft: { simulator: boolean } })).aircraft.simulator === true)) continue;
    dataCleaned.push(d);
  }

  if (dataCleaned.length > 0) {
    let lastEntry = dataCleaned[0];
    let index = 0;
    if (lastEntry.startTime_utc ?? 0 > day.startTime_utc) {
      dataFormatted.push({
        entity: {
            type: 'blank',
            startTime_utc: day.startTime_utc,
            endTime_utc: lastEntry.startTime_utc ?? 0,
          },
          i: index
      });
    }
    if (dataCleaned.length > 1) {
      dataFormatted.push({
        entity: lastEntry,
        i: index++
      });
      
      for (let i = 1; i < dataCleaned.length; i++) {
        const entry = dataCleaned[i];
        if ((entry.startTime_utc ?? 0) > (lastEntry.endTime_utc ?? 0)) {
          // There is a gap
          dataFormatted.push({
            entity: {
              type: 'blank',
              startTime_utc: lastEntry.endTime_utc ?? 0,
              endTime_utc: entry.startTime_utc ?? 0
            },
            i: index
          });
        }
        dataFormatted.push({
          entity: entry,
          i: index++
        });
        lastEntry = entry;
      }
    } else {
      dataFormatted.push({
        entity: dataCleaned[0],
        i: 0
      });
    }
  }

  const spacing = 1.25;

</script>

<!-- <div class="w-full relative mb-3 bg-zinc-900">
  <div class="w-full relative overflow-y-hidden overflow-x-scroll backdrop-blur-lg pb-4">
    <div class="{$$restProps.class} w-full relative flex flex-row items-start text-white pt-3 pb-[1.25rem] px-2" style="min-width: {4.75 * dataFormatted.length}rem;">
      {#each dataFormatted as entry}
        {#if entry.entity.type === 'blank'}
          <Blank entry={entry.entity} i={entry.i} spacing={spacing} dayStartTime={day.startTime_utc} dayEndTime={day.endTime_utc}/>
        {:else}
          <Schedule entry={entry.entity} i={entry.i} spacing={spacing} dayStartTime={day.startTime_utc} dayEndTime={day.endTime_utc} />
        {/if}
      {/each}
    </div>
  </div>
  {#each Array(data.length + 4) as _, i}
    <div class="absolute z-0 h-1 left-0 right-0 border-t border-gray-200/5" style="top: {(i - 2) * spacing + 1.85}rem"/>
  {/each}
  <div class="absolute bottom-1 text-xxs text-gray-300 w-full flex flex-row px-1">
    <span>{helpers.getHoursMinutesUTC(new Date(day.startTime_utc * 1000))}</span>
    <span class="flex-grow text-center">{dutyDayLength} hr</span>
    <span>{helpers.getHoursMinutesUTC(new Date(day.endTime_utc * 1000))}</span>
  </div>
</div> -->

<div class="w-full relative bg-gray-50 dark:bg-zinc-900 border-t border-b border-gray-200 dark:border-zinc-700">
  <div class="w-full relative z-10 overflow-y-hidden overflow-x-auto pb-3">
    <div class="{$$restProps.class} w-full relative flex flex-row items-start text-zinc-800 dark:text-white pt-3 pb-[1.25rem] px-2" style="min-width: {4.75 * dataFormatted.length}rem;">
      {#each dataFormatted as entry}
        {#if entry.entity.type === 'blank'}
          <Blank entry={entry.entity} i={entry.i} spacing={spacing} dayStartTime={day.startTime_utc} dayEndTime={day.endTime_utc}/>
        {:else}
          <Schedule entry={entry.entity} i={entry.i} spacing={spacing} dayStartTime={day.startTime_utc} dayEndTime={day.endTime_utc} />
        {/if}
      {/each}
    </div>
  </div>
  {#each Array(data.length + 4) as _, i}
    <div class="absolute z-0 h-1 left-0 right-0 border-t border-zinc-800/5 dark:border-gray-200/5" style="top: {(i - 2) * spacing + 1.85}rem"></div>
  {/each}
  <div class="absolute bottom-1 text-xxs text-gray-600 dark:text-gray-300 w-full flex flex-row px-1">
    <span>{helpers.getHoursMinutesUTC(new Date(day.startTime_utc * 1000))}</span>
    <span class="flex-grow text-center">{dutyDayLength} hr</span>
    <span>{helpers.getHoursMinutesUTC(new Date(day.endTime_utc * 1000))}</span>
  </div>
</div>