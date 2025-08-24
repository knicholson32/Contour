<script lang="ts">
    import { page } from '$app/state';
    import { getHoursMinutesUTC } from "$lib/helpers";
    import * as helpers from ".";


  interface Props {
    entry: {
      startTime_utc: number | null,
      endTime_utc: number | null,
      originAirportId: string | null,
      destinationAirportId: string | null,
      diversionAirportId: string | null,
      type: 'deadhead' | 'leg'
      id: string | null,
      dayId: number | null
    };
    i: number;
    spacing: number;
    dayStartTime: number;
    dayEndTime: number;
    highlight: string | null
  }

  let {
    entry,
    i,
    spacing,
    dayStartTime,
    dayEndTime,
    highlight = $bindable(null)
  }: Props = $props();

  const totalTime = ((entry.endTime_utc??0) - (entry.startTime_utc??0)) / 60 / 60;

  const u = new URLSearchParams(page.url.search);
  if (entry.dayId !== null) u.set('day', entry.dayId.toFixed(0));
  u.set('active', 'form');
  const legLink = `/entry/leg/${entry.id}?${u.toString()}`;

  const mouseEnter = () => {
    highlight = entry.id;
  }

  const mouseLeave = () => {
    if (highlight === entry.id) highlight = null;
  }

</script>

<a onmouseenter={mouseEnter} onmouseleave={mouseLeave} href="{entry.id !== null && entry.dayId !== null && entry.type === 'leg' ? legLink : '#'}" class="group hover:opacity-80 select-none {helpers.getText(i, entry.type)} flex flex-col gap-0.5 items-center justify-center min-w-19 lg:min-w-26" style="width: {helpers.convertUTCToWidth(i, entry.startTime_utc, entry.endTime_utc, dayStartTime, dayEndTime)}%; margin-top: {i * spacing}rem">
  <div class="w-full text-xxs leading-3 inline-flex px-2">
    {#if totalTime >= 0}
      <span class="text-gray-500">{getHoursMinutesUTC(new Date((entry.startTime_utc??0) * 1000), false)}</span>
      <span class="grow"></span>
      <span class="text-gray-500">{getHoursMinutesUTC(new Date((entry.endTime_utc??0) * 1000), false)}</span>
    {:else}
      <span class="text-red-500">{getHoursMinutesUTC(new Date((entry.startTime_utc??0) * 1000), false)}</span>
      <span class="grow"></span>
      <span class="text-red-500">{getHoursMinutesUTC(new Date((entry.endTime_utc??0) * 1000), false)}</span>
    {/if}
  </div>
  <div class="h-2 w-full ring-0 rounded-lg inline-flex items-center justify-center font-mono text-xs {helpers.getBackground(i, entry.type)}">
    {#if entry.diversionAirportId !== null}
      │
    {/if}
  </div>
  <div class="w-full text-xxs leading-3 inline-flex px-2 font-mono">
    <span>{entry.originAirportId}</span>
    <span class="grow"></span>
    {#if entry.diversionAirportId !== null}
      <span class="hidden lg:block">{entry.destinationAirportId}</span>
      <span class="grow"></span>
      <span>{entry.diversionAirportId}</span>
    {:else}
      <span class="grow"></span>
      <span>{entry.destinationAirportId}</span>
    {/if}
  </div>
  {#if totalTime >= 0}
    <div class="w-full text-xxs leading-3 inline-flex px-2 justify-end text-gray-500">{totalTime.toFixed(1)}hr</div>
  {:else}
    <div class="w-full text-xxs leading-3 inline-flex px-2 justify-end text-red-500">{totalTime.toFixed(1)}hr</div>
  {/if}
</a>