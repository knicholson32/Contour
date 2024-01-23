<script lang="ts">
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import * as Entry from '$lib/components/entry';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { enhance } from '$app/forms';
  import * as Map from '$lib/components/map';

  import { dateToDateStringForm, getInlineDateUTC, timeStrAndTimeZoneToUTC, validateURL } from '$lib/helpers';
  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let submitting = false;

  let endApt: string | null;
  let divertApt: string | null;
  let myLeg: boolean = true;

  let outTime: string | null = data.startTime;
  let inTime: string | null = data.endTime;

  // Default to UTC
  let outTZ: string | null = 'UTC';
  let inTZ: string | null = 'UTC';

  $: outTimeUTC = outTZ === null ? null : timeStrAndTimeZoneToUTC(outTime, outTZ);
  $: inTimeUTC = inTZ === null ? null : timeStrAndTimeZoneToUTC(inTime, inTZ);
  $: calcTotalTime = outTimeUTC === null || inTimeUTC === null || isNaN(outTimeUTC.value) || isNaN(inTimeUTC.value) ? null : ((inTimeUTC.value - outTimeUTC.value) / 60 / 60);

  let runwayOperations = data.runwayOperations;

  $: {
    if (myLeg) {
      runwayOperations = data.runwayOperations
    } else {
      runwayOperations = {
        dayTO: 0,
        dayLdg: 0,
        nightTO: 0,
        nightLdg: 0
      }
    }
  }

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID('new-entry-day');
  $: formManager.updateForm(form);
	
  let startAirportTZ: string | null = data.startTimezone?.name ?? null;
  let endAirportTZ: string | null = data.endTimezone?.name ?? null;
  let divertAirportTZ: string | null = data.endTimezone?.name ?? null;


  $: outTZAuto = (divertAirportTZ === null) ? endAirportTZ : divertAirportTZ;

  let totalTime: string | null;

  import { v4 as uuidv4 } from 'uuid';
  import { onMount } from 'svelte';
    import Warning from '$lib/components/Warning.svelte';
  let mapKey = uuidv4();
  const resetMap = () => {
    mapKey = uuidv4();
  }

  $: {
    form;
    data;
    resetMap();
  }

  onMount(() => {
    setTimeout(resetMap, 1);
  });

</script>

<OneColumn>

  <div class="flex-shrink">

    <!-- {#key mapKey}
      <Map.Airports airports={data.airportList} />
    {/key} -->

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

      <Section title="Warnings" warning={true}>
        {#if data.entry.progressPercent !== null && data.entry.progressPercent !== 100}
          <Warning>The flight is still in progress. Make sure the flight has finished, and reload with <span class="font-mono text-xs">"Clear Cache"</span> enabled.</Warning>
        {/if}

        {#if data.entry.inaccurateTiming === true}
          <Warning error={true}>This entry has inaccurate timing. Verify the start and end times.</Warning>
        {/if}

        {#if data.existingEntry === true}
          <Warning error={true}>An entry with this FlightAware ID already exists.</Warning>
        {/if}
      </Section>


      <!-- <Section title="FlightAware">
        <Entry.Link href={data.entrySettings['entry.day.entry.fa_link']} title="FlightAware Source" />
      </Section> -->

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
        <Entry.TimePicker required={true} title="Out" name="out" bind:autoTZ={startAirportTZ} bind:tz={outTZ} bind:value={outTime} defaultValue={data.startTime} />
        <Entry.TimePicker required={true} title="In" name="in" autoTZ={outTZAuto} bind:tz={inTZ} bind:value={inTime} defaultValue={data.endTime} />
        <Entry.FlightTime required={false} disabled={true} title="Calculated Total Time" name="calc-total-time" bind:defaultValue={calcTotalTime} />
      </Section>

      <Section title="Times">
        <Entry.FlightTime required={true} title="Total Time" name="total-time" autoFill={null} bind:value={totalTime} defaultValue={calcTotalTime} />
        <Entry.FlightTime title="PIC" name="pic-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="SIC" name="sic-time" bind:autoFill={totalTime} defaultValue={calcTotalTime} />
        <Entry.FlightTime title="Night" name="night-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="Cross Country" name="xc-time" bind:autoFill={totalTime} defaultValue={data.xc ? calcTotalTime : null} />
      </Section>

      <Section title="Takeoffs & Landings">
        <Entry.Switch title="My Leg" name="my-leg" noLocalStorage={true} bind:value={myLeg} defaultValue={true} />
        <Entry.Ticker title="Day Takeoffs" name="day-takeoffs" defaultValue={runwayOperations.dayTO} />
        <Entry.Ticker title="Day Landings" name="day-landings" defaultValue={runwayOperations.dayLdg} />
        <Entry.Ticker title="Night Takeoffs" name="night-takeoffs" defaultValue={runwayOperations.nightTO} />
        <Entry.Ticker title="Night Landings" name="night-landings" defaultValue={runwayOperations.nightLdg} />
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
        <a href="/tour/{data.params.tour}/day/{data.params.id}/entry/new/link" class="flex-grow w-full text-center md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-yellow-500 bg-yellow-400 text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Change Link</a>
        {#if $unsavedChanges}
          <button type="button" on:click={() => clearUID(true)} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
        {/if}
        <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Create" actionTextInProgress="Create" />
      </div>
    </form>
  </div>

</OneColumn>