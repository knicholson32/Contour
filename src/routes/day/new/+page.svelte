<script lang="ts">
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import * as Entry from '$lib/components/entry';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;
  import { v4 as uuidv4 } from 'uuid';
    import { browser } from '$app/environment';
    import { getInlineDateUTC } from '$lib/helpers';

  let submitting = false;

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  // const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID('new-day');
  $: formManager.updateForm(form);

  let startAirportTZ: string | null;
  let endAirportTZ: string | null;

  let flightIDs: {id: string, value: string | null}[] = [];

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
        flightIDs.push({
          id: id,
          value: v
        });
      }
    }
  }

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

</script>

<OneColumn>

  <div class="flex-shrink">
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

      <div class="p-3">
        <a href="/tour">NOTE: Assigning to current tour that started {getInlineDateUTC(data.currentTour.startTime_utc)}</a>
      </div>

      <Section title="Start" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.AirportPicker required={true} title="Airport" name="start-airport" airports={data.airports} bind:tz={startAirportTZ} defaultValue={null} />
        <Entry.TimePicker required={true} title="Time" name="start-time" dateOnly={false} bind:autoTZ={startAirportTZ} defaultValue={null} />
      </Section>

      <Section title="End" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.AirportPicker required={true} title="Airport" name="end-airport" airports={data.airports}  bind:tz={endAirportTZ} defaultValue={null} />
        <Entry.TimePicker required={true} title="Time" name="end-time" dateOnly={false} bind:autoTZ={endAirportTZ} defaultValue={null} />
      </Section>

      <Section title="Flight IDs (API Caching)">
        {#each flightIDs as entry, i (entry.id)}
          <Entry.Input required={false} title="Flight ID" placeholder="EJA762" name="flight-id-{entry.id}" useCommonName="flight-id" bind:value={entry.value} defaultValue={null} update={() => { flightIDUpdate(i) }} />
        {/each}
      </Section>

      <Section title="Notes">
        <Entry.TextField name="notes" placeholder="Enter Notes" defaultValue={null} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        {#if $unsavedChanges}
          <button type="button" on:click={() => clearUID(true)} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
        {/if}
        <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Next" actionTextInProgress="Creating" />
      </div>
    </form>
  </div>

</OneColumn>