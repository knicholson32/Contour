<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { v4 as uuidv4 } from 'uuid';
  import { page } from '$app/stores';
  import { afterNavigate, goto} from '$app/navigation';
  import * as MenuForm from '$lib/components/menuForm';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import * as Entry from '$lib/components/entry';
  import { dateToDateStringForm, getInlineDateUTC } from '$lib/helpers';
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';

  export let form: import('./$types').ActionData;
  export let data: import('./$types').PageData;

  let submitting = false;

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID('tour-end-' + data.currentTour?.id ?? 'new-');
  $: formManager.updateForm(form);

  $: startTimeDefault = data.currentTour === null ? null : dateToDateStringForm(data.currentTour.startTime_utc, false, data.currentTour.startTimezone);
  // $: endTimeDefault = dateToDateStringForm(data.currentDay.endTime_utc, false, data.currentDay.endTimezone);

  let showAirportTZ: string | null;
  let endAirportTZ: string | null;

  let urlActiveParam: string;
  let isMobileSize: boolean;

  let mapKey: string;
  const resetMap = () => {
    mapKey = uuidv4();
  }

  $: {
    form;
    data;
    resetMap();
  }

  afterNavigate(() => {
    setTimeout(resetMap, 1);
  })



  const ref = $page.url.searchParams.get('ref');

</script>

<OneColumn>

  <!-- Form Side -->
  <div class="flex-shrink">

    {#if data.entrySettings['entry.tour.current'] === data.currentTour?.id}
      <MenuForm.Title title="Active Tour" />
    {/if}

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

      <Section title="Tour Start" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.AirportPicker required={true} title="Show Airport" name="show-airport" airports={data.airports} bind:tz={showAirportTZ} defaultValue={data.currentTour?.startAirportId ?? data.tourSettings['tour.defaultStartApt'] ?? null} />
        <Entry.TimePicker required={true} title="Show Time" name="show-time" dateOnly={false} tz="UTC" bind:autoTZ={showAirportTZ} defaultValue={startTimeDefault} />
      </Section>

      <Section title="Tour End">
        <Entry.AirportPicker required={true} title="End Airport" name="end-airport" airports={data.airports} bind:tz={endAirportTZ} defaultValue={data.lastDay?.endAirportId ?? (data.currentTour?.startAirportId ?? data.tourSettings['tour.defaultStartApt'] ?? null)} />
        <Entry.TimePicker required={true} title="End Time" name="end-time" dateOnly={false} tz="UTC" bind:autoTZ={endAirportTZ} defaultValue={data.lastDay === null ? null : dateToDateStringForm(data.lastDay.endTime_utc, false, 'UTC')} />
      </Section>

      <Section title="Details">
        <Entry.Select required={true} title="Company" options={['NetJets']} placeholder="Unset" name="company" defaultValue={'NetJets'} />
        <Entry.Switch required={true} title="Line Check" name="line-check" defaultValue={false} />
      </Section>
      <Section title="Notes">
        <Entry.TextField name="notes" placeholder="Enter Notes" defaultValue={null} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        <a href="/tour/{data.params.id}" class="flex-grow w-full text-center md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
            ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">Cancel</a>
        {#if $unsavedChanges}
          <button type="button" on:click={() => clearUID(true)} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
            ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">Clear</button>
        {/if}
        <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="End Tour" actionTextInProgress="Ending Tour" />
      </div>
    </form>
  </div>

</OneColumn>
