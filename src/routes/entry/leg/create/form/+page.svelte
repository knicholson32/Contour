<script lang="ts">
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import * as Entry from '$lib/components/entry';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { enhance } from '$app/forms';
  import type * as Types from '@prisma/client';
  import { v4 as uuidv4 } from 'uuid';
  import { onMount } from 'svelte';
  import Warning from '$lib/components/Warning.svelte';

  import { dateToDateStringForm, getInlineDateUTC, preloadLegOverview, timeStrAndTimeZoneToUTC, validateURL } from '$lib/helpers';
  import { Title } from '$lib/components/menuForm';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { API } from '$lib/types';
  import * as Deck from '$lib/components/map/deck';
    import { CircleCheck } from 'lucide-svelte';
  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let submitting = false;

  let endApt: string | null;
  let divertApt: string | null;
  let myLeg: boolean = true;
  let autoPad: boolean = true;

  let outTime: string | null = data.startTime ?? null;
  let inTime: string | null = data.endTime ?? null;

  // Default to UTC
  let outTZ: string | null = 'UTC';
  let inTZ: string | null = 'UTC';

  $: outTimeUTC = outTZ === null ? null : timeStrAndTimeZoneToUTC(outTime, outTZ);
  $: inTimeUTC = inTZ === null ? null : timeStrAndTimeZoneToUTC(inTime, inTZ);
  $: calcTotalTime = outTimeUTC === null || inTimeUTC === null || isNaN(outTimeUTC.value) || isNaN(inTimeUTC.value) ? null : ((inTimeUTC.value - outTimeUTC.value) / 60 / 60);
  // $: calcTotalTimeVerbose = calcTotalTime === null ? '0' : autoPad ? `-${data.entrySettings['entry.day.blockStartPad'] / 3600} +${data.entrySettings['entry.day.blockEndPad'] / 3600} | ${calcTotalTime.toFixed(1)}` : '';

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

  let approaches: {id: string, approach: Types.Approach | null, modified: Types.Approach | null}[] = [];

  const addApproach = () => {
    approaches.push({ id: uuidv4(), approach: null, modified: null});
    approaches = approaches;
  }

  const deleteApproach = (id: string) => {
    approaches = approaches.filter((v) => v.id !== id);
  }

  let mapKey = uuidv4();
  const resetMap = () => {
    mapKey = uuidv4();
  }

  let ac: string;
  let useBlock: boolean = false;
  $: useBlockRequired = (data.dayId ?? null) !== null && (selectedAircraftAPI !== null && selectedAircraftAPI.simulator === false);
  $: if (useBlockRequired === true) useBlock = true;

  $: {
    form;
    data;
    resetMap();
  }

  let mounted = false;

  const refreshSelectedAC = async (selected: string) => {
    if (!mounted) return;
    const res = await (await fetch(`/api/aircraft/reg/${selected}`)).json() as API.Aircraft;
    console.log(res);
    if (res.ok == true && res.type === 'aircraft') selectedAircraftAPI = res.aircraft;
  }

  onMount(() => {
    mounted = true;
    if (page.url.searchParams.get('clearChanges') !== null) {
      formManager.clearUID(true);
      const u = new URLSearchParams(page.url.search);
      u.delete('clearChanges');
      setTimeout(() => {
        goto(`/entry/leg/create/form?${u.toString()}`, { replaceState: true, invalidateAll: true });
      }, 1);
    }
    setTimeout(resetMap, 1);
    refreshSelectedAC(ac);
  });

  let selectedAircraftAPI: API.Types.Aircraft | null = null;
  $: refreshSelectedAC(ac);



</script>

<OneColumn>

  <div class="shrink">

    <!-- {#key mapKey}
      <Map.Airports airports={data.airportList} />
    {/key} -->

    <form method="post" enctype="multipart/form-data" use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        submitting = false;
        preloadLegOverview();
        setTimeout(() => {
          if (form?.ok !== false) formManager.clearUID(false);
        }, 1);
      };
    }}>

      {#if data.dayId === null || data.dayId === undefined}
        <Title title="Generic Flight Leg" />
      {:else}
        <Title title="Duty Day (Tour) Leg" />
      {/if}

      {#if data.airportList !== null && data.airportList !== undefined && data.trackLeg !== null && data.trackLeg !== undefined}
        <Section title="Map">
          <div class="relative flex h-[50vh]">
            <Deck.Core>
              <Deck.Airports airports={data.airportList} highlight={data.airportList.map((a) => a.id)}/>
              <Deck.Leg leg={data.trackLeg}/>
            </Deck.Core>
            <div class="absolute z-10 inline-flex gap-2 items-center justify-center border border-zinc-300 dark:border-zinc-950/50 bg-zinc-100/70 dark:bg-zinc-900/50 backdrop-blur-lg px-3 py-2 rounded-lg bottom-4 right-4">
              <div class="text-xxs uppercase">Using Tracker Data</div>
              <CircleCheck class="w-4 h-4 text-green-500"/>
            </div>
          </div>
        </Section>
      {/if}

      <Section title="Warnings" warning={true}>
        {#if data.entry !== undefined}
          {#if data.entry.progressPercent !== null && data.entry.progressPercent !== 100}
            <Warning>The flight is still in progress. Make sure the flight has finished, and reload with <span class="font-mono text-xs">"Clear Cache"</span> enabled.</Warning>
          {/if}

          {#if data.entry.inaccurateTiming === true}
            <Warning error={true}>This entry has inaccurate timing. Verify the start and end times.</Warning>
          {/if}
        {/if}

        {#if data.existingEntry === true}
          <Warning error={true}>An entry with this FlightAware ID already exists.</Warning>
        {/if}
      </Section>


      <!-- <Section title="FlightAware">
        <Entry.Link href={data.entrySettings['entry.day.entry.fa_link']} title="FlightAware Source" />
      </Section> -->

      <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.Input title="Ident" name="ident" uppercase={true} defaultValue={data.entry?.ident ?? null} />
        <Entry.AircraftPicker required={true} title="Aircraft" name="aircraft" bind:value={ac} aircraft={data.aircraft} defaultValue={data.entry?.registration ?? null} />
        {#if data.dayId === null || data.dayId === undefined}
          <Entry.TimePicker name="date" title="Date" defaultValue={dateToDateStringForm(data.entry?.startTime ?? new Date().getTime() / 1000, true, 'utc')} dateOnly={true}/>
        {/if}
        <Entry.AirportPicker required={false} airports={data.airports} bind:tz={startAirportTZ} title="From" name="from" defaultValue={data.entry?.originAirportId ?? null} />
        <Entry.AirportPicker required={false} airports={data.airports}  bind:tz={endAirportTZ} title="To" name="to" bind:value={endApt} defaultValue={data.entry?.destinationAirportId ?? null} />
        <Entry.AirportPicker required={false} airports={data.airports}  bind:tz={divertAirportTZ} title="Divert" name="divert" bind:value={divertApt} defaultValue={data.entry?.diversionAirportId ?? null} />
        <Entry.Input title="Route" name="route" disabled={true} uppercase={true} defaultValue={data.entry?.filedRoute ?? null} />
        <Entry.Ticker title="Passengers" name="pax" defaultValue={null} />
      </Section>

      <Section title="Block Times">
        {#if useBlockRequired}
          <input type="hidden" name="use-block" value="true" />
        {:else}
          <Entry.Switch title="Use Block Times" name="use-block{useBlockRequired ? '-disabled' : ''}" tooltip={useBlockRequired ? 'Disabled because this leg must use block time (it is attached to a duty day).' : ''} disabled={useBlockRequired} bind:value={useBlock} defaultValue={useBlock} />
        {/if}
        <!-- {/if} -->
        {#if useBlock || useBlockRequired}
          <Entry.Switch title="Auto-Pad" name="auto-pad" noLocalStorage={true} bind:value={autoPad} defaultValue={true} />
          {#if autoPad}
            <Entry.TimePicker required={true} title="Out" name="out" bind:value={outTime} bind:tz={outTZ} bind:autoTZ={startAirportTZ} defaultValue={data.startTimePadded ?? null} />
            <Entry.TimePicker required={true} title="In" name="in" bind:value={inTime} bind:tz={inTZ} autoTZ={outTZ} defaultValue={data.endTimePadded ?? null} />
          {:else}
            <Entry.TimePicker required={true} title="Out" name="out" bind:value={outTime} bind:tz={outTZ} bind:autoTZ={startAirportTZ} defaultValue={data.startTime ?? null} />
            <Entry.TimePicker required={true} title="In" name="in" bind:value={inTime} bind:tz={inTZ} autoTZ={outTZ} defaultValue={data.endTime ?? null} />
          {/if}
          <Entry.FlightTime required={false} disabled={true} title="Calculated Total Time" name="calc-total-time" bind:defaultValue={calcTotalTime}>
            <div slot="details" class="text-xs text-gray-400 dark:text-zinc-600 flex items-center font-mono italic">
              {#if autoPad}
                Auto pad results in +{((data.entrySettings['entry.day.blockStartPad'] + data.entrySettings['entry.day.blockEndPad']) / 3600).toFixed(1)}
              {/if}
            </div>
          </Entry.FlightTime>
        {/if}
      </Section>

      <Section title="Times">
        <Entry.FlightTime required={true} title={selectedAircraftAPI === null || selectedAircraftAPI.simulator === false ? 'Total Time' : 'Simulated Flight'} name="total-time" autoFill={null} bind:value={totalTime} defaultValue={calcTotalTime} />
        <Entry.FlightTime title="PIC" name="pic-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="SIC" name="sic-time" bind:autoFill={totalTime} defaultValue={calcTotalTime} />
        <Entry.FlightTime title="Night" name="night-time" bind:autoFill={totalTime} defaultValue={data.nightEstimate === null || data.nightEstimate === undefined ? null : data.nightEstimate === 0 ? null : data.nightEstimate} />
        <Entry.FlightTime title="Cross Country" name="xc-time" bind:autoFill={totalTime} defaultValue={data.xc ? calcTotalTime : null} />
      </Section>

      <Section title="Takeoffs & Landings">
        <Entry.Switch title="My Leg" name="my-leg" noLocalStorage={true} bind:value={myLeg} defaultValue={true} />
        <Entry.Ticker title="Day Takeoffs" name="day-takeoffs" defaultValue={runwayOperations?.dayTO ?? null} />
        <Entry.Ticker title="Day Landings" name="day-landings" defaultValue={runwayOperations?.dayLdg ?? null} />
        <Entry.Ticker title="Night Takeoffs" name="night-takeoffs" defaultValue={runwayOperations?.nightTO ?? null} />
        <Entry.Ticker title="Night Landings" name="night-landings" defaultValue={runwayOperations?.nightLdg ?? null} />
      </Section>

      <Section title="Instrument">
        <Entry.FlightTime title="Actual Instrument" name="actual-instrument-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="Simulated Instrument" name="simulated-instrument-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.Ticker title="Holds" name="holds" defaultValue={null} />
        {#each approaches as approach (approach.id)}
          <Entry.InstrumentApproach name={`approach`} id={approach.id} airports={data.airports} defaultAirport={endApt} defaultValue={approach.approach} value={null} onDelete={deleteApproach} />
        {/each}
        <Entry.Button title="Add Approach" focus={addApproach} />
      </Section>

      <Section title="Training & Other" collapsable={true} visible={selectedAircraftAPI !== null && selectedAircraftAPI.simulator === true}>
        <Entry.FlightTime title="Solo" name="solo-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="Dual Given" name="dual-given-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.FlightTime title="Dual Received" name="dual-received-time" bind:autoFill={totalTime} defaultValue={null} />
        <Entry.Switch title="Crossing" name="crossing" defaultValue={false} />
        <!-- <Entry.FlightTime title="Simulated Flight" name="sim-time" bind:autoFill={totalTime} defaultValue={selectedAircraftAPI !== null && selectedAircraftAPI.simulator === true ? (totalTime === null ? null : parseFloat(totalTime)) : null} /> -->
        <Entry.Switch title="Flight Review" name="flight-review" defaultValue={false} />
        <Entry.Switch title="Checkride" name="checkride" defaultValue={false} />
        <Entry.Switch title="IPC" name="ipc" defaultValue={false} />
        <Entry.Switch title="FAA 61.58" name="faa6158" defaultValue={false} />
      </Section>

      <Section title="Comments">
        <Entry.TextField name="comments" placeholder="Enter comments here" defaultValue={null} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        {#if data.dayId !== null && data.dayId !== undefined && data.selection !== undefined}
          <a href={data.changeSourceURL} class="grow w-full text-center md:w-48 md:grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-yellow-500 bg-yellow-400 text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Change Source</a>
        {/if}
        {#if $unsavedChanges}
          <button type="button" on:click={() => clearUID(true)} class="grow w-full md:w-48 md:grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
        {/if}
        <Submit class="grow w-full md:w-48 md:grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Create" actionTextInProgress="Create" />
      </div>
    </form>
  </div>

</OneColumn>