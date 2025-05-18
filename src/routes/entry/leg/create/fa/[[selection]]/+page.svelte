<script lang="ts">
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import * as Entry from '$lib/components/entry';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { enhance } from '$app/forms';
  import { dateToDateStringForm, deleteQueries, getAirportFromICAO, getHoursMinutesUTC, getInlineDateUTC, getInlineDateUTCFA, getWeekdayUTC, setActive } from '$lib/helpers';
  import Warning from '$lib/components/Warning.svelte';
  import * as Map from '$lib/components/map';
  import { v4 as uuidv4 } from 'uuid';
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';
  import BlankMenu from '$lib/components/menuForm/BlankMenu.svelte';
  import icons from '$lib/components/icons';
  import Frame from '$lib/components/entry/Frame.svelte';
  
  interface Props {
    data: import('./$types').PageData;
    form: import('./$types').ActionData;
  }

  let { data, form: formData }: Props = $props();

  let submitting = $state(false);

  const formManager = new FormManager();
  formManager.updateUID('new-day-leg');
  // $: formManager.updateForm(form);

  let noCache: boolean = $state(false);
  let fetchAirports: boolean;
  let expansive: boolean = $state(false);
  let searchTitle = $state('Search');
  let progress = $state(false);

  let mapKey = $state(uuidv4());
  const resetMap = () => mapKey = uuidv4();


  const nav = async (href: string) => {
    console.log(href);

    progress = true;
    await goto(href);
    progress = false;
  }

  $effect(() => {
    formData;
    data;
    resetMap();
  });



  $effect(() => {
    searchTitle = noCache ? expansive ? 'Search with Large API Request' : 'Search with API Request' : 'Search';
  });

  afterNavigate(() => {
    setTimeout(resetMap, 1);
    noCache = false;
    fetchAirports = false;
    expansive = false;
    deleteQueries(['no-cache', 'expansive']);
    progress = false;
  });
  
  const now = Math.floor((new Date()).getTime() / 1000);

  let flightIDs: string = $state('');
  const addOption = (option: string) => {
    const fids = flightIDs === null || flightIDs === undefined ? '' : flightIDs;
    let parsed = fids.split(',').map((v) => {
      if(v.indexOf('-') !== -1) return v.trim();
      else return v.trim().toUpperCase();
    });
    if (parsed.length === 1 && parsed[0] === '') parsed = [];
    option = option.trim().toUpperCase();
    if (!parsed.includes(option)) parsed.push(option);
    console.log('2', parsed);
    flightIDs = parsed.join(', ');
  }

  let urlFormParam: string | undefined = $state(undefined);

</script>

<svelte:head>
   {#if progress}
      <style>
         body {
            cursor: progress;
         }
      </style>
   {/if}
</svelte:head>	

<TwoColumn menuZone="scroll" formZone="scroll" backText="Back" bind:urlFormParam ratio={0.6} minSizes={{ menu: 650, form: 300 }} afterDrag={resetMap}>

  <!-- Menu Side -->
  {#snippet menu()}
    <nav class="flex-shrink dark:divide-zinc-800" aria-label="Directory">

      <form method="get">
        {#if data.currentTour !== null}
          <input type="hidden" name="tour" value={data.currentTour.id}>
        {/if}
        {#if data.currentDay !== null}
          <input type="hidden" name="day" value={data.currentDay.id}>
        {/if}
        <Section title="Flight Aware Options" error={formData !== null && formData.ok === false && formData.action === '?/default' && formData.name === '*' ? formData.message : null}>
          <Entry.Switch title="Poll FlightAware" name="no-cache" bind:value={noCache} defaultValue={false} />
          
          {#if noCache === true}
            <Entry.Switch title="Expansive Search" name="expansive" bind:value={expansive} defaultValue={false} />
          {/if}
          <Entry.Input required={noCache} uppercase={true} title="Flight ID" name="flight-id" placeholder="EJA762" bind:value={flightIDs} 
          defaultValue={page.url.searchParams.get('flight-id')} />
          <Frame title="Options" required={false} name="" form={null} class="relative">
            {#snippet outsideButton()}
                      <div  class="w-full overflow-x-auto whitespace-nowrap absolute top-0 bottom-0 right-0 left-0 pr-3">
                <div class="flex flex-row gap-2 items-center h-full">
                  {#each data.flightIDOptions as o}
                    <button type="button" onclick={() => addOption(o)} class="text-xs first:ml-auto px-2 rounded-full bg-sky-500 text-white font-bold">{o}</button>
                  {/each}
                </div>
              </div>
                    {/snippet}
          </Frame>
          {#if data.currentDay === null}
            <Entry.TimePicker name="date" title="Approx. Flight Date" defaultValue={dateToDateStringForm(new Date().getTime() / 1000, true, 'utc')} dateOnly={true}/>
          {/if}
          <Entry.Submit bind:title={searchTitle}/>
        </Section>

      </form>

      <Section title="Legs">
        {#if data.options.length === 0}
          <Entry.Text>No Results</Entry.Text>
        {:else}
        <!-- divide-y divide-gray-100 dark:divide-zinc-800  -->
          <table role="list" class="w-full text-xs"> 
            <thead>
              <tr class="text-left h-12">
                <th class="pl-2 text-center hidden md:table-cell">Ident</th>
                <th class="pl-2 md:pl-0"></th>
                <th class="">Date</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th class="text-center hidden sm:table-cell">A/C</th>
                <th class="text-center">Duration</th>
              </tr>
            </thead>
            <tbody>
              {#each data.options as o}
                <tr onclick={() => nav(`/entry/leg/create/fa/${o.fa_flight_id}?${urlFormParam}`)} class="{progress ? '' : 'cursor-pointer'} betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-950/40 {page.params.selection === o.fa_flight_id ? 'bg-gray-200 dark:bg-zinc-950' : 'even:bg-gray-50 dark:even:bg-zinc-800/40'} {o.exists ? 'opacity-40 dark:opacity-20' : ''}">
                  <td class="pl-2 text-center hidden md:table-cell"><a class="text-sky-400 inline-flex gap-1" target="_blank" href="https://www.flightaware.com/live/flight/id/{o.fa_flight_id}:0">
                    {o.ident}
                  </a></td>
                  <td class="text-yellow-500 pl-2 md:pl-0">
                    {#if o.progress === 0 || o.inaccurateTiming === true || o.startTime === 0 || o.startTime <= now - (10 * 24 * 60 * 60)}
                      <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                        {@html icons.warning}
                      </svg>
                    {/if}
                  </td>
                  <td class=" text-xs py-1">
                    <p>{getWeekdayUTC(o.startTime)}</p>
                    <p>{getInlineDateUTCFA(o.startTime)}</p>
                  </td>
                  <td class="text-xs py-1">
                    <p>{o.originAirport.timestamp}</p>
                    {#if o.originAirport.obj !== null}
                      <div class="font-mono text-xs hidden sm:inline-flex whitespace-nowrap gap-2">
                        <a class="text-sky-400" href="/airports/{o.originAirport.id}">{o.originAirport.id}</a>
                        <div class="max-w-36 text-ellipsis overflow-hidden whitespace-nowrap" title="{o.originAirport.obj?.name}">{o.originAirport.obj?.name}</div>
                      </div>
                      <p class="font-mono text-xs sm:hidden"><a class="text-sky-400" href="/airports/{o.originAirport.id}">{o.originAirport.id}</a></p>
                    {:else}
                      <p>{o.originAirport.id}</p>
                    {/if}
                  </td>
                  {#if o.diversionAirport === undefined}
                    <td class="text-xs py-1">
                      <p>{o.destinationAirport.timestamp}</p>
                      {#if o.destinationAirport.obj !== null}
                        <div class="font-mono text-xs hidden sm:inline-flex whitespace-nowrap gap-2">
                          <a class="text-sky-400" href="/airports/{o.destinationAirport.id}">{o.destinationAirport.id}</a>
                          <div class="max-w-36 text-ellipsis overflow-hidden whitespace-nowrap" title="{o.destinationAirport.obj?.name}">{o.destinationAirport.obj?.name}</div>
                        </div>
                        <p class="font-mono text-xs sm:hidden"><a class="text-sky-400" href="/airports/{o.destinationAirport.id}">{o.destinationAirport.id}</a></p>
                      {:else}
                        <p>{o.destinationAirport.id}</p>
                      {/if}
                    </td>
                  {:else}
                    <td class="text-xs py-1">
                      <p>{o.diversionAirport.timestamp} - <span class="text-yellow-500">Divert</span></p>
                      {#if o.diversionAirport.obj !== null}
                        <div class="font-mono text-xs hidden sm:inline-flex whitespace-nowrap gap-2">
                          <a class="text-sky-400" href="/airports/{o.diversionAirport.id}">{o.diversionAirport.id}</a>
                          <div class="max-w-36 text-ellipsis overflow-hidden whitespace-nowrap" title="{o.diversionAirport.obj?.name}">{o.diversionAirport.obj?.name}</div>
                        </div>
                        <p class="font-mono text-xs sm:hidden"><a class="text-sky-400" href="/airports/{o.diversionAirport.id}">{o.diversionAirport.id}</a></p>
                      {:else}
                        <p>{o.diversionAirport.id}</p>
                      {/if}
                    </td>
                  {/if}
                  {#if o.type.id === undefined}
                    <td class="text-center hidden sm:table-cell">{o.type.name}</td>
                  {:else}
                    <td class="text-center hidden sm:table-cell"><a class="text-sky-400" href="/aircraft/type/{o.type.id}">{o.type.name}</a></td>
                  {/if}
                  <td class="text-center">{o.duration}</td>
                  <!-- <td class="pr-2 text-center">
                    <a type="button" href="/tour/{data.params.tour}/day/{data.params.id}/entry/new/link/{o.fa_flight_id}?flight-id={o.ident}&active=form" class="flex-grow text-center md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-1 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
                      ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">
                        X
                    </a>
                  </td> -->
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </Section>

    </nav>
  {/snippet}

  <!-- Form Side -->
  {#snippet form()}
    <div class="flex-shrink">

      
      {#if data.selected === null}

        <div class="w-full h-full fixed top-0 bottom-0 flex flex-col items-center justify-center">
        <BlankMenu title="No Leg Selected" subtitle="Search for options and select a leg" />
        </div>

      {:else}

        <form method="post" enctype="multipart/form-data" use:enhance={() => {
          submitting = true;
          formManager.clearUID();
          return async ({ update }) => {
            await update({ reset: false });
            submitting = false;
          };
        }}>

          {#if data.airportList !== null}
            <Section title="Map">
              {#key mapKey}
                <Map.Airports class="z-0" airports={data.airportList} />
              {/key}
            </Section>
          {/if}
        

          <Section title="Warnings" warning={true}>
            {#if data.selected.progressPercent !== null && data.selected.progressPercent !== 100}
              <Warning>
                <p class="text-xs">The flight is not finished ({data.selected.progressPercent}%). Reload with <span class="font-mono text-xs inline-flex whitespace-nowrap">"Poll Flightaware"</span> to refresh.</p>
              </Warning>
            {/if}

            {#if data.selected.inaccurateTiming === true}
              <Warning error={true}><p class="text-xs">This entry has inaccurate timing. Verify the start and end times.</p></Warning>
            {/if}

            {#if data.existingEntry === true}
              <Warning error={true}><p class="text-xs">An entry with this FlightAware ID already exists.</p></Warning>
            {/if}
          </Section>

          <Section title="FlightAware">
            <Entry.Link href="https://www.flightaware.com/live/flight/id/{data.selected.faFlightId}:0" title="FlightAware Source" />
          </Section>

          <Section title="General">
            <Entry.Input disabled={true} title="Flight ID" name="" defaultValue={data.selected.ident} />
            <Entry.Input disabled={true} title="Registration" name="" defaultValue={data.selected.registration} />
            <Entry.Input disabled={true} title="Type" name="" defaultValue={data.selected.aircraftType} />
          </Section>

          <Section title="Airports">
            <Entry.Input disabled={true} title="Origin" name="" defaultValue="{data.selected.originAirportId} at {data.startTime}" />
            {#if data.selected.diversionAirportId === null}
              <Entry.Input disabled={true} title="Destination" name="" defaultValue="{data.selected.destinationAirportId} at {data.endTime}" />
            {:else}
              <Entry.Input disabled={true} title="Destination" name="" defaultValue="{data.selected.destinationAirportId} -> DIVERT" />
              <Entry.Input disabled={true} title="Divert" name="" defaultValue="{data.selected.diversionAirportId} at {data.endTime}" />
            {/if}
          </Section>
          <Section title="Timing">
            <Entry.FlightTime disabled={true} title="Total Time" name="" defaultValue={data.totalTime} />
          </Section>

          <Section title="Route">
            <Entry.Input disabled={true} title="Filed Route" name="" defaultValue={data.selected.filedRoute} />
          </Section>

          <!-- <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
            <a href="/tour/{data.params.tour}/day/{data.id}/entry/new/link" class="flex-grow w-full text-center md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-yellow-500 bg-yellow-400 text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Change Link</a>
            <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" {submitting} theme={{primary: 'green'}} actionText="Looks Good" actionTextInProgress="Creating" />
          </div> -->
        

          <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
          <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={formData?.ok === false && (formData.action === '?/default' || formData?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Next" actionTextInProgress="Creating" />
          </div>
        </form>
      {/if}
    </div>
  {/snippet}

</TwoColumn>