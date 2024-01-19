<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import * as Entry from '$lib/components/entry';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';
  import { icons } from '$lib/components';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import * as MenuForm from '$lib/components/menuForm';
  import { Submit } from '$lib/components/buttons';
  import { FormManager } from '$lib/components/entry/localStorage';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID(data.entry?.id ?? 'new-reg');
  $: formManager.updateForm(form);


  let urlActiveParam: string;
  let isMobileSize: boolean;

  const update = () => {
    if(!browser) return;
    // console.log('update on page');
  }

  const validate = (text: string): boolean => {
    console.log(text);
    return /^[0-9]?[0-9]?[0-9]?[0-9]?$/.test(text)
  }

  let submitting = false;
  let deleting = false;

  const ref = $page.url.searchParams.get('ref');
  const reg = $page.url.searchParams.get('reg');

  let totalTime: string;

</script>

<TwoColumn {ref} menu="scroll" form="scroll" bind:urlActiveParam bind:isMobileSize backText="Back" >

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink" aria-label="Directory">
    <MenuForm.Title title="Entries" />
    {#if ref !== null}
      <MenuForm.Link href={ref} icon={icons.chevronLeft} text="Go Back" type={'left'} />
    {/if}
    {#if data.entries.length === 0}
      <MenuForm.BlankMenu href={'/entry/new?' + urlActiveParam} title="No entries" subtitle="Get started by creating a new entry." buttonText="New Entry" />
    {:else}
      <MenuForm.Link href={'/entry/new?' + urlActiveParam} icon={icons.plus} text="Create a new entry" type={'right'} selected={$page.url.pathname.endsWith('entry/new') && !isMobileSize} />
      <MenuForm.SearchBar />
      {#each data.entries as entry (entry.id)}
        <Section title={entry.id} collapsable={true} >
          <!-- {#each group.regs as ac (ac.id)} -->
            <a href="/entry/{entry.id}?{urlActiveParam}" class="relative select-none flex flex-row justify-left items-center gap-2 pl-2 pr-1 py-2 {entry.id === data.params.id && !isMobileSize ? 'bg-gray-200' : 'betterhover:hover:bg-gray-200 betterhover:hover:text-black'}">
              <!-- {#if ac.imageId !== null}
                <div class="h-6 w-6 flex-none flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  <Badge class="h-full">{ac._count.legs}</Badge>
                </div>
              {:else if ac.type.imageId !== null}
                <div class="h-6 w-6 flex-none flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  <Badge class="h-full">{ac._count.legs}</Badge>
                </div>
              {:else}
                <div class="h-6 w-6 flex-shrink-0 rounded-lg bg-gray-300 text-black uppercase font-mono text-xxs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
                  {ac.registration.substring(0, (ac.registration.length < 2 ? ac.registration.length : 3))}
                </div>
              {/if}
              <div class="flex flex-col gap-0.5 overflow-hidden flex-initial">
                <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">
                  {ac.registration}
                  {#if unsavedKeys.includes(ac.id)}
                    <Tag>UNSAVED</Tag>
                  {:else if ac.simulator === true}
                    <Tag>SIM</Tag>
                  {/if}
                </div>
              </div>
              <div class="flex-grow"></div>
              <span class="text-xxs text-gray-400">{data.aircraftTimes[ac.id]}hr</span>
              <svg class="h-4 w-4 shrink-0 flex-nowrap" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                {@html icons.chevronRight}
              </svg> -->
            </a>
          <!-- {/each} -->
        </Section>  
      {/each}
    {/if}
  </nav>
  
  <!-- Form Side -->
  <div slot="form" class="flex-shrink">
    <form action="?/createOrModify&{$page.url.search}" method="post" enctype="multipart/form-data" use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        submitting = false;
        setTimeout(() => {
          if (form?.ok !== false) formManager.clearUID(false);
        }, 1);
      };
    }}>

      <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.TimePicker {form} required={true} title="Date" name="date" dateOnly={true} update={update} />
        <Entry.AircraftPicker {form} required={true} title="Aircraft" name="aircraft" aircraft={data.aircraft} defaultValue={data.entry?.aircraft.registration ?? null} update={update} />
        <Entry.AirportPicker {form} required={true} airports={data.airports} title="From" name="from" initialValue={data.entry?.originAirportId} update={update} />
        <Entry.AirportPicker {form} required={true} airports={data.airports} title="To" name="to" initialValue={data.entry?.destinationAirportId} update={update} />
        <Entry.Input title="Route" name="route" uppercase={true} validator={validate} update={update} defaultValue={null} />
        <Entry.Ticker title="Passengers" name="pax" defaultValue={data.entry?.passengers ?? null} update={update} />
      </Section>

      <Section title="Times">
        <Entry.FlightTime required={true} title="Total Time" name="total-time" autoFill={null} bind:value={totalTime} defaultValue={data.entry?.totalTime ?? null} update={update} />
        <Entry.FlightTime title="PIC" name="pic-time" bind:autoFill={totalTime} defaultValue={data.entry?.pic ?? null} update={update} />
        <Entry.FlightTime title="SIC" name="sic-time" bind:autoFill={totalTime} defaultValue={data.entry?.sic ?? null} update={update} />
        <Entry.FlightTime title="Night" name="night-time" bind:autoFill={totalTime} defaultValue={data.entry?.night ?? null} update={update} />
        <Entry.FlightTime title="Solo" name="solo-time" bind:autoFill={totalTime} defaultValue={data.entry?.solo ?? null} update={update} />
      </Section>

      <Section title="Cross Country">
        <Entry.FlightTime title="Cross Country" name="xc-time" bind:autoFill={totalTime} defaultValue={data.entry?.xc ?? null} update={update} />
      </Section>

      <Section title="Takeoffs & Landings">
        <Entry.Ticker title="Day Takeoffs" name="day-takeoffs" defaultValue={data.entry?.dayTakeOffs ?? null} update={update} />
        <Entry.Ticker title="Day Landings" name="day-landings" defaultValue={data.entry?.dayLandings ?? null} update={update} />
        <Entry.Ticker title="Night Takeoffs" name="night-takeoffs" defaultValue={data.entry?.nightTakeOffs ?? null} update={update} />
        <Entry.Ticker title="Night Landings" name="night-landings" defaultValue={data.entry?.nightLandings ?? null} update={update} />
      </Section>

      <Section title="Instrument">
        <Entry.FlightTime title="Actual Instrument" name="actual-instrument-time" bind:autoFill={totalTime} defaultValue={data.entry?.actualInstrument ?? null} update={update} />
        <Entry.FlightTime title="simulated Instrument" name="simulated-instrument-time" bind:autoFill={totalTime} defaultValue={data.entry?.simulatedInstrument ?? null} update={update} />
        <Entry.Ticker title="Holds" name="holds" update={update} defaultValue={data.entry?.holds ?? null} />
      </Section>

      <Section title="Training">
        <Entry.FlightTime title="Dual Given" name="dual-given-time" bind:autoFill={totalTime} defaultValue={data.entry?.dualGiven ?? null} update={update} />
        <Entry.FlightTime title="Dual Received" name="dual-received-time" bind:autoFill={totalTime} defaultValue={data.entry?.dualReceived ?? null} update={update} />
        <Entry.FlightTime title="Simulated Flight" name="sim-time" bind:autoFill={totalTime} defaultValue={data.entry?.sim ?? null} update={update} />
      </Section>

      <Section title="Comments">
        <Entry.TextField name="comments" placeholder="Enter comments here" defaultValue={data.entry?.notes ?? null} update={update} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        {#if data.entry !== null}
          <form class="flex-grow max-w-[33%] md:w-48 md:flex-grow-0 flex items-start" action="?/delete" method="post" use:enhance={({ cancel }) => {
            const answer = confirm('Are you sure you want to delete this Entry? This action cannot be undone.');
            if (!answer) cancel();
            else {
              deleting = true;
              return async ({ update }) => {
                await update({ invalidateAll: true });
                deleting = false;
                if (form?.ok !== false) formManager.clearUID(false);
              };
            }
          }}>
            <input type="hidden" name="id" value={data.entry?.id} />
            <Submit class="w-full" failed={form?.ok === false && form.action === '?/default'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
          </form>
        {/if}
        {#if $unsavedChanges}
          <button type="button" on:click={() => formManager.clearUID()} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
          <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText={data.entry !== null ? 'Update' : 'Create'} actionTextInProgress={data.entry !== null ? 'Updating' : 'Creating'} />
        {/if}
      </div>
    </form>
  </div>

</TwoColumn>
