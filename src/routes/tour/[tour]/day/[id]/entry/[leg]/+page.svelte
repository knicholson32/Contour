<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import Image from '$lib/components/Image.svelte';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';
  import * as Map from '$lib/components/map';
  import { icons } from '$lib/components';
  import { page } from '$app/stores';
  import { afterNavigate, goto} from '$app/navigation';
  import Badge from '$lib/components/decorations/Badge.svelte';
  import * as MenuForm from '$lib/components/menuForm';
  import Tag from '$lib/components/decorations/Tag.svelte';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import * as Entry from '$lib/components/entry';
  import { dateToDateStringForm, getInlineDateUTC, timeStrAndTimeZoneToUTC } from '$lib/helpers';

  export let form: import('./$types').ActionData;
  export let data: import('./$types').PageData;

  let submitting = false;
  let deleting = false;

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID(data.leg?.id ?? 'unset');
  $: formManager.updateForm(form);

  let startAirportTZ: string | null = data.startTimezone?.name ?? null;
  let endAirportTZ: string | null = data.endTimezone?.name ?? null;
  let divertAirportTZ: string | null = data.endTimezone?.name ?? null;

  let endApt: string | null;
  let divertApt: string | null;

  let outTime: string;
  let inTime: string;

  // Default to UTC
  let outTZ: string | null = 'UTC';
  let inTZ: string | null = 'UTC';

  $: outTimeUTC = outTZ === null ? null : timeStrAndTimeZoneToUTC(outTime, outTZ);
  $: inTimeUTC = inTZ === null ? null : timeStrAndTimeZoneToUTC(inTime, inTZ);
  $: calcTotalTime = outTimeUTC === null || inTimeUTC === null ? null : ((inTimeUTC.value - outTimeUTC.value) / 60 / 60);

  $: outTZBind = (divertAirportTZ === null) ? endAirportTZ : divertAirportTZ;

  let totalTime: string | null;

  let urlActiveParam: string;
  let isMobileSize: boolean;

  const onMenuBack = () => {
    if (ref === null) goto('/tour/' + data.params.tour + '/day/' + data.params.id + '?active=form');
    else goto(ref);
  }

  import { v4 as uuidv4 } from 'uuid';
  import { onMount } from 'svelte';
  let mapKey = uuidv4();
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
  });

  const ref = $page.url.searchParams.get('ref');

</script>

<TwoColumn menu="scroll" {ref} form="scroll" bind:urlActiveParam bind:isMobileSize backText="Back" onMenuBack={onMenuBack}>

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink dark:divide-zinc-800" aria-label="Directory">
    <MenuForm.Title title="Duty Day Legs" />
    <MenuForm.Link href={ref ?? ('/tour/' + data.params.tour + '/day/' + data.params.id + '?active=form')} type="left" text="Back to Day" />
    <MenuForm.Link href={'/tour/' + data.params.tour + '/day/' + data.params.id + '/entry/new?' + urlActiveParam} icon={icons.plus} text="Create a new leg" type="right"/>
    <MenuForm.SearchBar />
    <!-- Existing Legs -->
    <Section title="Legs">
      {#each data.legDeadheadCombo as leg,i (leg.id)}
        {#if leg.type === 'leg'}
          <a href="/tour/{data.params.tour}/day/{data.params.id}/entry/{leg.id}?{urlActiveParam}" class="relative select-none flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-0 {leg.id === data.params.leg && !isMobileSize ? 'bg-gray-200 dark:bg-zinc-700' : 'betterhover:hover:bg-gray-200 dark:betterhover:hover:bg-zinc-600 betterhover:hover:text-black dark:betterhover:hover:text-white'}">
            <div class="flex flex-row gap-1 items-center justify-center overflow-hidden py-2 flex-initial">
              <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">
                <span class="font-mono">{i+1}: {leg.originAirportId} → {leg.diversionAirportId === null ? leg.destinationAirportId : leg.diversionAirportId} </span>
                {#if $unsavedUIDs.includes(leg.id)}
                  <Tag>UNSAVED</Tag>
                {/if}
              </div>
            </div>
            <div class="absolute right-1">
              <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                {@html icons.chevronRight}
              </svg>
            </div>
          </a>
        {:else}
          <div class="relative select-none flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-0 bg-gray-50 dark:bg-zinc-950/50">
            <div class="flex flex-row gap-1 items-center justify-center overflow-hidden py-2 flex-initial">
              <div class="uppercase font-bold font-mono text-xs overflow-hidden whitespace-nowrap text-ellipsis text-gray-400 dark:text-zinc-700">
                {i+1}: {leg.originAirportId} → {leg.destinationAirportId} (Deadhead)
              </div>
            </div>
          </div>
        {/if}
      {/each}
    </Section>
    <!-- <Section title="End @ {data.day.endAirportId}"/> -->
  </nav>
  
  <!-- Form Side -->
  <div slot="form" class="flex-shrink">
    {#if data.leg === null}
      No Leg
    {:else}

      {#key mapKey}
        <Map.Leg positions={data.positions} fixes={data.fixes} airports={data.airportList} />
      {/key}

      <form action="?/update" method="post" enctype="multipart/form-data" use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          await update({ reset: false });
          submitting = false;
          setTimeout(() => {
            if (form?.ok !== false) formManager.clearUID(false);
          }, 1);
        };
      }}>

      <div class="p-3 text-gray-400">
        <a href={data.leg.flightAwareData?.sourceLink} target="_blank">FlightAware Source</a>
      </div>

      <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.Input title="Ident" name="ident" uppercase={true} defaultValue={data.leg.ident} />
        <Entry.AircraftPicker required={true} title="Aircraft" name="aircraft" aircraft={data.aircraft} defaultValue={data.leg.aircraft.registration} />
        <Entry.AirportPicker required={true} airports={data.airports} bind:tz={startAirportTZ} title="From" name="from" defaultValue={data.leg.originAirportId} />
        <Entry.AirportPicker required={true} airports={data.airports} bind:tz={endAirportTZ} title="To" name="to" bind:value={endApt} defaultValue={data.leg.destinationAirportId} />
        <Entry.AirportPicker required={false} airports={data.airports} bind:tz={divertAirportTZ} title="Divert" name="divert" bind:value={divertApt} defaultValue={data.leg.diversionAirportId} />
        <Entry.Input title="Route" name="route" disabled={true} uppercase={true} defaultValue={data.leg.flightAwareData?.filedRoute ?? ''} />
        <Entry.Ticker title="Passengers" name="pax" defaultValue={data.leg.passengers} />
      </Section>

      <Section title="Block Times">
        <Entry.TimePicker required={true} title="Out" name="out" bind:value={outTime} bind:tz={outTZ} bind:autoTZ={startAirportTZ} defaultValue={data.startTime} />
        <Entry.TimePicker required={true} title="In" name="in" bind:value={inTime} bind:tz={inTZ} autoTZ={outTZBind} defaultValue={data.endTime} />
        <Entry.FlightTime required={false} disabled={true} title="Calculated Total Time" name="calc-total-time" bind:defaultValue={calcTotalTime} />
      </Section>

      <Section title="Times">
        <Entry.FlightTime required={true} title="Total Time" name="total-time" autoFill={null} bind:value={totalTime} defaultValue={data.leg.totalTime} />
        <Entry.FlightTime title="PIC" name="pic-time" bind:autoFill={totalTime} defaultValue={data.leg.pic} />
        <Entry.FlightTime title="SIC" name="sic-time" bind:autoFill={totalTime} defaultValue={data.leg.sic} />
        <Entry.FlightTime title="Night" name="night-time" bind:autoFill={totalTime} defaultValue={data.leg.night} />
        <Entry.FlightTime title="Cross Country" name="xc-time" bind:autoFill={totalTime} defaultValue={data.leg.xc} />
      </Section>

      <Section title="Takeoffs & Landings">
        <Entry.Ticker title="Day Takeoffs" name="day-takeoffs" defaultValue={data.leg.dayTakeOffs} />
        <Entry.Ticker title="Day Landings" name="day-landings" defaultValue={data.leg.dayLandings} />
        <Entry.Ticker title="Night Takeoffs" name="night-takeoffs" defaultValue={data.leg.nightTakeOffs} />
        <Entry.Ticker title="Night Landings" name="night-landings" defaultValue={data.leg.nightLandings} />
      </Section>

      <Section title="Instrument">
        <Entry.FlightTime title="Actual Instrument" name="actual-instrument-time" bind:autoFill={totalTime} defaultValue={data.leg.actualInstrument} />
        <Entry.FlightTime title="simulated Instrument" name="simulated-instrument-time" bind:autoFill={totalTime} defaultValue={data.leg.simulatedInstrument} />
        <Entry.Ticker title="Holds" name="holds" defaultValue={data.leg.holds} />
      </Section>

      <Section title="Training & Other" collapsable={true} visible={false}>
        <Entry.FlightTime title="Solo" name="solo-time" bind:autoFill={totalTime} defaultValue={data.leg.solo} />
        <Entry.FlightTime title="Dual Given" name="dual-given-time" bind:autoFill={totalTime} defaultValue={data.leg.dualGiven} />
        <Entry.FlightTime title="Dual Received" name="dual-received-time" bind:autoFill={totalTime} defaultValue={data.leg.dualReceived} />
        <Entry.FlightTime title="Simulated Flight" name="sim-time" bind:autoFill={totalTime} defaultValue={data.leg.sim} />
        <Entry.Switch title="Flight Review" name="flight-review" defaultValue={data.leg.flightReview} />
        <Entry.Switch title="Checkride" name="checkride" defaultValue={data.leg.checkride} />
        <Entry.Switch title="IPC" name="ipc" defaultValue={data.leg.ipc} />
        <Entry.Switch title="FAA 61.58" name="faa6158" defaultValue={data.leg.faa6158} />
      </Section>

      <Section title="Comments">
        <Entry.TextField name="comments" placeholder="Enter comments here" defaultValue={data.leg.notes} />
      </Section>

        <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
          {#if data.leg !== null}
            <form class="flex-grow max-w-[33%] md:w-48 md:flex-grow-0 flex items-start" action="?/delete" method="post" use:enhance={({ cancel }) => {
              const answer = confirm('Are you sure you want to delete this leg? This action cannot be undone.');
              if (!answer) cancel();
              else {
                deleting = true;
                return async ({ update }) => {
                  await update({ invalidateAll: true });
                  deleting = false;
                  setTimeout(() => {
                    if (form?.ok !== false) formManager.clearUID(false);
                  }, 1);
                };
              }
            }}>
              <input type="hidden" name="id" value={data.leg.id} />
              <Submit class="w-full" failed={form?.ok === false && form.action === '?/delete'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
            </form>
          {/if}
          {#if $unsavedChanges}
            <button type="button" on:click={() => clearUID(true)} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
            <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Update" actionTextInProgress="Update" />
          {/if}
        </div>
      </form>
    {/if}
  </div>

</TwoColumn>
