<script lang="ts">
    import icons from "$lib/components/icons";
    import { dateToDateStringFormMonthDayYear } from "$lib/helpers";
    import type { Entry } from "$lib/types";
    import { Tag, Waypoints } from "lucide-svelte";

    export let unsaved: boolean;
    export let leg: Entry;


</script>

<div class="flex flex-col gap-1 w-full overflow-hidden pl-2 mr-5 flex-initial font-medium text-xs">
  <div class="inline-flex overflow-hidden whitespace-nowrap text-ellipsis">
    <span class="inline-flex font-mono items-center">
      {#if leg.originAirportId === null && leg.destinationAirportId === null}
        No Route
      {:else}
        {#if leg.diversionAirportId !== null}
          {leg.originAirportId} → <span class="line-through decoration-secondary decoration-2">{leg.destinationAirportId}</span> → {leg.diversionAirportId}
        {:else}
          {leg.originAirportId} → {leg.diversionAirportId === null ? leg.destinationAirportId : leg.diversionAirportId}
        {/if}
      {/if}
      {#if leg._count.positions > 0}
        <span class="text-primary ml-2"><Waypoints class="w-3 h-3"/></span>
      {/if}
    </span>
    <span class="flex-grow ml-1">
      {#if unsaved}
        <Tag>UNSAVED</Tag>
      {/if}
    </span>
    <span class="text-sky-600">
      {#if leg.startTime_utc === null}
        No Date
      {:else}
        {dateToDateStringFormMonthDayYear(leg.startTime_utc)}
      {/if}
    </span>
  </div>
  <div class="inline-flex overflow-hidden whitespace-nowrap text-ellipsis">
    <span class="font-normal text-gray-400 dark:text-zinc-500 overflow-hidden whitespace-nowrap text-ellipsis">
      {leg.aircraft.registration} ({leg.aircraft.type.typeCode})
    </span>
    <span class="flex-grow"></span>
    {#if leg._count.approaches > 0}
      <span class="mr-2">
        {leg._count.approaches + ' '}
        {#if leg._count.approaches === 1}
          Approach,
        {:else}
          Approaches,
        {/if}
      </span>
    {/if}
    <span class="">{leg.totalTime.toFixed(1)}</span> <span class="font-light ml-1">Total</span>
  </div>
</div>
<div class="absolute right-1">
  <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
    {@html icons.chevronRight}
  </svg>
</div>