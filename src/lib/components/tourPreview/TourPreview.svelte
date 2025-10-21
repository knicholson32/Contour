<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { getInlineDateUTCPretty, getWeekdayUTC, timeStrAndTimeZoneToUTC } from "$lib/helpers";
  import { Prisma } from "@prisma/client";
  import { SwitchSmall } from "$lib/components/ui/switchSmall";
  import { cn } from "$lib/utils.js";
  import { onMount } from "svelte";
  import type { API } from "$lib/types";
  import { TicketX } from "lucide-svelte";
  import type { TimeZone } from "@vvo/tzdb";
  import { Button } from "../ui/button";
  import { ArrowUpRight } from "lucide-svelte";

  const DAY_AND_WIDTH = 86400 / 6;

  interface Props {
    tour: Prisma.TourGetPayload<{include: { days: { include: { legs: true } } }}>;
    startTimeValue?: string | null,
    startTimeValueTZ?: string | null,
    endTimeValue?: string | null,
    endTimeValueTZ?: string | null,
    hoveringLeg?: string | null,
    addDays?: number,
    tzData?: TimeZone,
    prefersUTC?: boolean
  }

  let { tour, startTimeValue = null, endTimeValue = null, startTimeValueTZ = null, endTimeValueTZ = null, hoveringLeg = $bindable(null), addDays = 0, tzData, prefersUTC, ...rest }: Props = $props();

  let selectedStartDate: number | null = $derived.by(() => {
    if (startTimeValue === null) return null;
    if (startTimeValueTZ === null) return ((new Date(startTimeValue + 'UTC')).getTime() / 1000);
    return timeStrAndTimeZoneToUTC(startTimeValue, startTimeValueTZ)?.value ?? null;
  });

  let selectedEndDate: number | null = $derived.by(() => {
    if (endTimeValue === null) return null;
    if (endTimeValueTZ === null) return ((new Date(endTimeValue + 'UTC')).getTime() / 1000);
    return timeStrAndTimeZoneToUTC(endTimeValue, endTimeValueTZ)?.value ?? null;
  });

  let days: Date[] = $state([]);

  // Whether or not to use the local timezone, or UTC time
  let useLocal = $state(prefersUTC === undefined ? true : !prefersUTC);

  const calculateDays = () => {
    const newDays: Date[] = [];
    const tourDaysSorted = tour.days.sort((a, b) => a.startTime_utc - b.startTime_utc);
    if (tourDaysSorted.length > 0) {
      // Get the first duty day of the tour
      let day1 = new Date(tourDaysSorted[0].startTime_utc * 1000);
      // Get the end of the last duty day
      const utcLast = tourDaysSorted[tourDaysSorted.length - 1].endTime_utc;

      // Back that day up so it is the first UTC day that the tour started on
      if (useLocal) {
        // Check if we are using computer local time or Home TZ time
        if (tzData === undefined) {
          // Using computer local time, which is the default for the Date object
          day1.setHours(0, 0, 0, 0);
        } else {
          // Using Home TZ time. we need to set to UTC and then shift by whatever timezone offset
          // the Home TZ uses. Start by setting it to UTC
          day1.setUTCHours(0, 0, 0, 0);
          // Reassign it with the required offset
          day1 = new Date(day1.getTime() - tzData.currentTimeOffsetInMinutes * 60000);
        }
      } else  day1.setUTCHours(0, 0, 0, 0);

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

  onMount(async () => {
    // Try to assign TZ data if it doesn't exist.
    if (tzData === undefined || prefersUTC === undefined) {
      const tzRaw = await (await fetch('/api/timezone/home')).json() as API.Response;
      if (tzRaw.ok === true && tzRaw.type === 'timezone-home') {
        tzData = (tzRaw as API.HomeTimeZone).data;
        prefersUTC = (tzRaw as API.HomeTimeZone).prefers_utc;
      }
    }
  });

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
      <span class={cn("transition-opacity select-none", !useLocal ? "opacity-30" : "")}>
        {#if tzData === undefined}
          Local
        {:else}
          Home <span class="italic">({tzData.alternativeName})</span>
        {/if}
      </span>
    </div>
    <div class="w-full h-24 flex flex-row justify-center-safe gap-0 px-4 m-auto overflow-x-scroll relative" style="justify-content: safe center;">
      <!-- Tour Progress Bar -->
      <div class="relative">
        <div class="absolute bottom-11 bg-zinc-500/20 h-4 rounded-full overflow-hidden" style="width: {(days.length * 6)}rem;">
          {#if selectedStartDate !== null && selectedEndDate !== null}
          <!-- {(selectedStartDate - firstDayStartUTC) / DAY_AND_WIDTH} -->
           <!-- selectedStartDateTZOffset -->
            <div class="h-full bg-pink-400 absolute text-xxs transition-all animate-pulse z-50" style="left: {(selectedStartDate - firstDayStartUTC) / DAY_AND_WIDTH}rem; width: {(selectedEndDate - selectedStartDate) / DAY_AND_WIDTH}rem"></div>
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
  <div class="w-full h-full flex flex-row gap-4 items-center justify-center relative min-h-16">
    <p class="font-thin">This tour has no days</p>
    <Button href={`/entry/day/new?tour=${tour.id}`} rel="noopener noreferrer" class="absolute right-5">
      Add days
      <ArrowUpRight class="w-4 h-4"></ArrowUpRight>
    </Button>
  </div>
{/if}
