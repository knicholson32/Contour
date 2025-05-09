<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { getInlineDateUTCPretty, getWeekdayUTC } from "$lib/helpers";
  import { Prisma } from "@prisma/client";
  import { SwitchSmall } from "$lib/components/ui/switchSmall";
  import { cn } from "$lib/utils.js";

  const DAY_AND_WIDTH = 86400 / 6;


  interface Props {
    tour: Prisma.TourGetPayload<{include: { days: { include: { legs: true } } }}>;
    startTimeValue?: string | null,
    endTimeValue?: string | null,
    hoveringLeg?: string | null,
    addDays?: number
  }

  let { tour, startTimeValue = null, endTimeValue = null, hoveringLeg = $bindable(null), addDays = 0, ...rest }: Props = $props();

  let selectedStartDate: number | null = $derived(startTimeValue === null ? null : ((new Date(startTimeValue)).getTime() / 1000));
  let selectedEndDate: number | null = $derived(endTimeValue === null ? null : ((new Date(endTimeValue)).getTime() / 1000));

  let days: Date[] = $state([]);

  // Whether or not to use the local timezone, or UTC time
  let useLocal = $state(false);

  const calculateDays = () => {
    const newDays: Date[] = [];
    const tourDaysSorted = tour.days.sort((a, b) => a.startTime_utc - b.startTime_utc);
    if (tourDaysSorted.length > 0) {
      // Get the first duty day of the tour
      const day1 = new Date(tourDaysSorted[0].startTime_utc * 1000);
      // Get the end of the last duty day
      const utcLast = tourDaysSorted[tourDaysSorted.length - 1].endTime_utc;

      // Back that day up so it is the first UTC day that the tour started on
      if (useLocal) day1.setHours(0, 0, 0, 0);
      else  day1.setUTCHours(0, 0, 0, 0);

      // Add it as the first day
      newDays.push(day1);
      // Initialize a variable to hold the current day offset
      let currentDate = new Date(day1);
      // Add days until we reach the end of the last day of the tour
      while (Math.floor(currentDate.getTime() / 1000) + 86400 - (addDays * 86400) < utcLast) {
        // Increment the date by one day
        currentDate.setDate(currentDate.getDate() + 1);
        // Push it as a new day
        newDays.push(new Date(currentDate));
      }
    }

    if (JSON.stringify(days) !== JSON.stringify(newDays)) {
      days = [...newDays]; // Only update if the value has changed
    }

  }
  calculateDays();

  let firstDayStartUTC = $derived(days.length === 0 ? 0 : Math.floor(days[0].getTime() / 1000))

  afterNavigate(calculateDays);
  $effect(() => {
    useLocal;
    calculateDays();
  });

</script>

{#if days.length > 0}
  <div class="w-full bg-white dark:bg-zinc-925 relative">
    <div class="absolute z-10 top-2 left-2 inline-flex items-center justify-center text-xxs gap-1">
      <span class={cn("transition-opacity select-none", useLocal ? "opacity-30" : "")}>UTC</span>
      <SwitchSmall bind:checked={useLocal} colorOnSwitched={false} />
      <span class={cn("transition-opacity select-none", !useLocal ? "opacity-30" : "")}>Local</span>
    </div>
    <div class="w-full h-24 flex flex-row justify-center-safe gap-0 px-4 m-auto overflow-x-scroll relative" style="justify-content: safe center;">
      <!-- Tour Progress Bar -->
      <div class="relative">
        <div class="absolute bottom-11 bg-zinc-500/20 h-4 rounded-full overflow-hidden" style="width: {(days.length * 6)}rem;">
          {#if selectedStartDate !== null && selectedEndDate !== null}
            <div class="h-full bg-pink-400 absolute text-xxs transition-all animate-pulse" style="left: {(selectedStartDate - firstDayStartUTC) / DAY_AND_WIDTH}rem; width: {(selectedEndDate - selectedStartDate) / DAY_AND_WIDTH}rem"></div>
          {/if}
          {#each tour.days as day (day.id)}
            <a href="/entry/day/{day.id}?tour={tour.id}" class="h-full bg-green-500 absolute text-xxs transition-all" style="left: {(day.startTime_utc - firstDayStartUTC) / DAY_AND_WIDTH}rem; width: {(day.endTime_utc - day.startTime_utc) / DAY_AND_WIDTH}rem" aria-label="Link to day">
            </a>
            {#each day.legs as leg (leg.id)}
              <a onmouseenter={() => hoveringLeg = leg.id} onmouseleave={() => hoveringLeg = null} href="/entry/leg/{leg.id}?tour={tour.id}" class="h-full bg-blue-500 absolute text-xxs transition-all" style="left: {(leg.startTime_utc - firstDayStartUTC) / DAY_AND_WIDTH}rem; width: {(leg.endTime_utc - leg.startTime_utc) / DAY_AND_WIDTH}rem" aria-label="Link to leg">
              </a>
            {/each}
          {/each}
        </div>
      </div>
      {#each days as day}
        <div class="aspect-1 pb-3 odd:bg-zinc-50 dark:odd:bg-zinc-950/50 flex flex-col items-center justify-end py-0.5 select-none">
          <div class="uppercase text-xs font-bold opacity-30 dark:opacity-60 -my-1">{getWeekdayUTC(Math.floor(day.getTime() / 1000))}</div>
          <div class="text-xxs opacity-30 dark:opacity-60">{getInlineDateUTCPretty(Math.floor(day.getTime() / 1000))}</div>
          <div class="absolute h-6 bottom-10 border-r border-zinc-500 border-dotted opacity-50 dark:opacity-60"></div>
        </div>
      {/each}
    </div>
  </div>
{:else}
  No Days
{/if}