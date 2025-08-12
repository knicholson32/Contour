<script lang="ts">

  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import * as Entry from '$lib/components/entry';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { enhance } from '$app/forms';
  import { v4 as uuidv4 } from 'uuid';
  import { browser } from '$app/environment';
  import { dateToDateStringForm, getHoursMinutesUTC, getInlineDateUTC, getInlineDateUTCFA, getInlineDateUTCPretty, getWeekdayUTC } from '$lib/helpers';
    import TourPreview from '$lib/components/tourPreview/TourPreview.svelte';
    import { Title } from '$lib/components/menuForm';
    import { ChevronRight } from 'lucide-svelte';
  interface Props {
    data: import('./$types').PageData;
    form: import('./$types').ActionData;
  }

  let { data, form }: Props = $props();

  let submitting = $state(false);

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  // const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $effect(() => {
    formManager.updateUID('new-day');
  });
  $effect(() => {
    formManager.updateForm(form);
  });

  let startAirportTZ: string | null = $state(null);
  let endAirportTZ: string | null = $state(null);

  let flightIDsInitial: {id: string, value: string | null}[] = [];

  if (browser) {
    // Loop through the keys
    for (let i = 0; i < localStorage.length; i++) {
      // Get the key
      const key = localStorage.key(i);
      // If it is not null and starts with the UID, add it to be removed.
      // We can't remove it here because then our for loop gets out of sync.
      if (key !== null && key.startsWith('new-day.flight-id-')) {
        const v = localStorage.getItem(key);
        const id = key.substring(key.indexOf('-id-') + 4);
        console.log(key, id, v);
        flightIDsInitial.push({
          id: id,
          value: v
        });
      }
    }
  }

  let flightIDs: {id: string, value: string | null}[] = $state(flightIDsInitial);

  const addIfNoEmpty = () => {
    let emptyEntryExists = false;
    for (const e of flightIDs) {
      if (e.value === null || e.value === '') {
        emptyEntryExists = true;
        break;
      }
    }
  
    if (!emptyEntryExists) {
      flightIDs.push({
        id: uuidv4(),
        value: ''
      });
      flightIDs = flightIDs;
    }
  }


  const flightIDUpdate = (i: number) => {
    if (flightIDs[i] === undefined) return;
    addIfNoEmpty();
  }


  addIfNoEmpty();

  let startTimeValue: string | null = $state(null);
  let endTimeValue: string | null = $state(null);


</script>

<OneColumn>

  <div class="shrink">
    <form method="post" enctype="multipart/form-data" use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        submitting = false;
        setTimeout(() => {
          if (form?.ok !== false) formManager.clearUID(false);
        }, 1);
      };
    }}>

      <!-- <div class="p-3">
        <a href="/tour/{data.currentTour.id}">NOTE: Assigning to current tour that started {getInlineDateUTC(data.currentTour.startTime_utc)}</a>
      </div> -->

      <!-- <div class="w-fill h-48 flex flex-row gap-3 py-3 px-2">
        {#each data.currentTour.days as day (day.id)}
          <div class="aspect-1 bg-zinc-50 flex flex-col items-center">
            <div>{getWeekdayUTC(day.startTime_utc)}</div>
            <div class="text-xxs">{getInlineDateUTCFA(day.startTime_utc)}
              <span class="italic">{getHoursMinutesUTC(new Date((day.endTime_utc - day.startTime_utc) * 1000), false)}</span>
            </div>
          </div>
        {/each}
      </div> -->

      <Title title="Add Duty Day to Tour" floatLeft={true}>
        <div class="hidden sm:inline-flex text-xs flex-row items-center justify-around">
          <span class=""> - April 25th, 2025</span>
          <a href="/entry/tour/{data.currentTour.id}" class="absolute right-0 group hover:underline inline-flex gap-1">Go To Tour <ChevronRight class="w-4 h-4"></ChevronRight></a>
        </div>
      </Title>

      <TourPreview tour={data.currentTour} startTimeValue={startTimeValue} startTimeValueTZ="UTC" endTimeValue={endTimeValue} endTimeValueTZ="UTC" addDays={2} tzData={data.tzData} prefersUTC={data.prefersUTC} />
      
      <Section title="Start" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.AirportPicker required={true} title="Airport" name="start-airport" airports={data.airports} bind:tz={startAirportTZ} defaultValue={data.lastDay?.endAirportId ?? data.currentTour.startAirportId} />
        <Entry.TimePicker required={true} title="Time" name="start-time" dateOnly={false} tz="UTC" bind:autoTZ={startAirportTZ} defaultValue={data.lastDay === null ? dateToDateStringForm(data.currentTour.startTime_utc, false, 'UTC') : null} bind:value={startTimeValue} />
      </Section>

      <Section title="End" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.AirportPicker required={true} title="Airport" name="end-airport" airports={data.airports}  bind:tz={endAirportTZ} defaultValue={null} />
        <Entry.TimePicker required={true} title="Time" name="end-time" dateOnly={false} tz="UTC" bind:autoTZ={endAirportTZ} defaultValue={null} bind:value={endTimeValue} />
      </Section>

      <Section title="Flight IDs (API Caching)">
        {#each flightIDs as entry, i (entry.id)}
          <Entry.Input required={false} title="Flight ID" placeholder="EJA762" name="flight-id-{entry.id}" uppercase={true} useCommonName="flight-id" bind:value={entry.value} defaultValue={null} update={() => { flightIDUpdate(i) }} />
        {/each}
      </Section>

      <Section title="Notes">
        <Entry.TextField name="notes" placeholder="Enter Notes" defaultValue={null} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        {#if $unsavedChanges}
          <button type="button" onclick={() => clearUID(true)} class="grow w-full md:w-48 md:grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
        {/if}
        <Submit class="grow w-full md:w-48 md:grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Next" actionTextInProgress="Creating" />
      </div>
    </form>
  </div>

</OneColumn>