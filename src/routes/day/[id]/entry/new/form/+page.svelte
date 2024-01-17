<script lang="ts">
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import * as Entry from '$lib/components/entry';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { enhance } from '$app/forms';
  import { dateToDateStringForm, getInlineDateUTC, validateURL } from '$lib/helpers';
  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let submitting = false;

  let endApt: string | null;
  let divertApt: string | null;

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID('new-entry-day');
  $: formManager.updateForm(form);
	
  let startAirportTZ: string | null = data.startTimezone?.name ?? null;
  let endAirportTZ: string | null = data.endTimezone?.name ?? null;
  let divertAirportTZ: string | null = data.endTimezone?.name ?? null;


  $: outTZ = (divertAirportTZ === null) ? endAirportTZ : divertAirportTZ;

  let totalTime: string | null;

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
        <a href="/tour">NOTE: Will be assigned the tour that started {getInlineDateUTC(data.currentTour.startTime_utc)}</a>
        <br/>
        <a href="/tour">NOTE: Will be assigned the day that started {getInlineDateUTC(data.currentDay.startTime_utc)}</a>
      </div>

      {#if data.entry.progressPercent !== null && data.entry.progressPercent !== 100}
        <div class="p-3">
          NOTICE: The cache entry is NOT complete. The flight is still in progress. Make sure the flight has finished, and reload with "No Cache" enabled.
        </div>
      {/if}


      {#if data.entry.inaccurateTiming === true}
        <div class="p-3">
          NOTICE: This entry has inaccurate timing. Verify the start and end times.
        </div>
      {/if}

      {#if data.existingEntry === true}
        <div class="p-3 text-red-500">
          NOTICE: An entry with this FlightAware ID already exists
        </div>
      {/if}

      <a href="{data.entrySettings['entry.day.entry.fa_link']}" target="_blank">FlightAware Link</a>

      <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.Input title="Ident" name="ident" uppercase={true} defaultValue={data.entry.ident} />
        <Entry.AircraftPicker required={true} title="Aircraft" name="aircraft" aircraft={data.aircraft} defaultValue={data.entry.registration ?? null} />
        <Entry.AirportPicker required={true} airports={data.airports} bind:tz={startAirportTZ} title="From" name="from" defaultValue={data.entry.originAirportId} />
        <Entry.AirportPicker required={true} airports={data.airports}  bind:tz={endAirportTZ} title="To" name="to" bind:value={endApt} defaultValue={data.entry.destinationAirportId} />
        <Entry.AirportPicker required={false} airports={data.airports}  bind:tz={divertAirportTZ} title="Divert" name="divert" bind:value={divertApt} defaultValue={data.entry.diversionAirportId} />
        <Entry.Input title="Route" name="route" disabled={true} uppercase={true} defaultValue={data.entry.filedRoute} />
        <Entry.Ticker title="Passengers" name="pax" defaultValue={null} />
      </Section>

      <Section title="Block Times">
        <Entry.TimePicker required={true} title="Out" name="out" bind:autoTZ={startAirportTZ} defaultValue={data.startTime} />
        <Entry.TimePicker required={true} title="In" name="in" autoTZ={outTZ} defaultValue={data.endTime} />
      </Section>

      <Section title="Times">
        <Entry.FlightTime required={true} title="Total Time" name="total-time" autoFill={null} bind:value={totalTime} defaultValue={data.totalTime} />
        <Entry.FlightTime title="PIC" name="pic-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="SIC" name="sic-time" bind:autoFill={totalTime} defaultValue={data.totalTime} />
        <Entry.FlightTime title="Night" name="night-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="Cross Country" name="xc-time" bind:autoFill={totalTime} defaultValue={data.totalTime} />
      </Section>

      <Section title="Takeoffs & Landings">
        <Entry.Ticker title="Day Takeoffs" name="day-takeoffs" defaultValue={null} />
        <Entry.Ticker title="Day Landings" name="day-landings" defaultValue={null} />
        <Entry.Ticker title="Night Takeoffs" name="night-takeoffs" defaultValue={null} />
        <Entry.Ticker title="Night Landings" name="night-landings" defaultValue={null} />
      </Section>

      <Section title="Instrument">
        <Entry.FlightTime title="Actual Instrument" name="actual-instrument-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="simulated Instrument" name="simulated-instrument-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.Ticker title="Holds" name="holds" defaultValue={null} />
      </Section>

      <Section title="Training & Other" collapsable={true} visible={false}>
        <Entry.FlightTime title="Solo" name="solo-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="Dual Given" name="dual-given-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="Dual Received" name="dual-received-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="Simulated Flight" name="sim-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.Switch title="Flight Review" name="flight-review" defaultValue={false} />
        <Entry.Switch title="Checkride" name="checkride" defaultValue={false} />
        <Entry.Switch title="IPC" name="ipc" defaultValue={false} />
        <Entry.Switch title="FAA 61.58" name="faa6158" defaultValue={false} />
      </Section>

      <Section title="Comments">
        <Entry.TextField name="comments" placeholder="Enter comments here" defaultValue={null} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        <a href="/day/{data.params.id}/entry/new/link" class="flex-grow w-full text-center md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-yellow-500 bg-yellow-400 text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Change Link</a>
        {#if $unsavedChanges}
          <button type="button" on:click={() => clearUID(true)} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
        {/if}
        <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Create" actionTextInProgress="Create" />
      </div>
    </form>
  </div>

</OneColumn>