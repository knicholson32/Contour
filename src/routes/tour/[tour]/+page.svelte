<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { Timeline } from '$lib/components/timeline';
  import Image from '$lib/components/Image.svelte';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte'
  import { v4 as uuidv4 } from 'uuid';
  import { icons } from '$lib/components';
  import { page } from '$app/stores';
  import { afterNavigate, goto, invalidateAll} from '$app/navigation';
  import Badge from '$lib/components/decorations/Badge.svelte';
  import * as MenuForm from '$lib/components/menuForm';
  import Tag from '$lib/components/decorations/Tag.svelte';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import * as Entry from '$lib/components/entry';
  import { dateToDateStringForm, getInlineDateUTC } from '$lib/helpers';
    import { onMount } from 'svelte';

  export let form: import('./$types').ActionData;
  export let data: import('./$types').PageData;

  let submitting = false;
  let deleting = false;

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID('tour-' + (data.currentTour?.id ?? 'new-'));
  $: formManager.updateForm(form);

  $: startTimeDefault = data.currentTour === null ? null : dateToDateStringForm(data.currentTour.startTime_utc, false, data.currentTour.startTimezone);
  $: endTimeDefault = data.currentTour === null || data.currentTour.endTime_utc === null || data.currentTour.endTimezone === null ? null : dateToDateStringForm(data.currentTour.endTime_utc, false, data.currentTour.endTimezone);

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

<TwoColumn menu="scroll" {ref} form="scroll" bind:urlActiveParam bind:isMobileSize backText="Back">

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink dark:divide-zinc-800" aria-label="Directory">
    <MenuForm.Title title="Tours" />
    <MenuForm.Link href={'/tour/new?' + urlActiveParam} selected={$page.url.pathname.endsWith('new') && !isMobileSize} icon={icons.plus} text="Start a new tour" type="right"/>
    <MenuForm.SearchBar />
    <!-- Existing Tours -->
    <Section title="Tours">
      {#each data.tours as tour (tour.id)}
        <a href="/tour/{tour.id}?{urlActiveParam}" class="relative select-none flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-0 {tour.id === parseInt(data.params.tour) && !isMobileSize ? 'bg-gray-200 dark:bg-zinc-700' : 'betterhover:hover:bg-gray-200 dark:betterhover:hover:bg-zinc-600 betterhover:hover:text-black dark:betterhover:hover:text-white'}">
          <div class="flex flex-row gap-2 items-center justify-center overflow-hidden py-2 flex-initial">
            <div class="h-6 w-6 flex-none flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 dark:bg-transparent">
              <Badge class="h-full">{tour._count.days}</Badge>
            </div>
            <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">
              {#if tour.endTime_utc === null}
                {getInlineDateUTC(tour.startTime_utc)} - PRESENT
              {:else}
                {getInlineDateUTC(tour.startTime_utc)} - {getInlineDateUTC(tour.endTime_utc)} 
              {/if}
              {#if $unsavedUIDs.includes('tour-' + tour.id)}
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
      {/each}
    </Section>
  </nav>
  
  <!-- Form Side -->
  <div slot="form" class="flex-shrink">

    <!-- {#key mapKey}
      <Map.Day bind:this={map} class="" legs={data.currentDay.legs} airports={data.airportList} deadheads={data.currentDay.deadheads} />
      <Timeline class="" data={data.legDeadheadCombo} day={data.currentDay} />
    {/key} -->

    <!-- <div class="sticky top-0 bg-red-500">
      <div class="p-3">
        <a href="/tour">
          {#if data.currentDay.tour.id === data.currentTour?.id}
            NOTE: Assigned to the current tour that started {getInlineDateUTC(data.currentDay.tour.startTime_utc)}
          {:else}
            NOTE: Assigned a tour that started {getInlineDateUTC(data.currentDay.tour.startTime_utc)}
          {/if}
        </a>
      </div>
      <div class="p-3">
        This day has {data.currentDay.legs.length} legs
      </div>
      <div class="p-3">
        This day has {data.currentDay.deadheads.length} deadheads
      </div>
    </div> -->

    {#if data.entrySettings['entry.tour.current'] === data.currentTour?.id}
      <MenuForm.Title title="Active Tour" />
    {/if}

    <form action="?/updateOrCreate" method="post" enctype="multipart/form-data" use:enhance={() => {
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

      {#if (data.currentTour?.endTime_utc ?? null) !== null}
        <Section title="Tour End">
          <Entry.AirportPicker required={true} title="End Airport" name="end-airport" airports={data.airports} bind:tz={endAirportTZ} defaultValue={data.currentTour?.endAirportId ?? null} />
          <Entry.TimePicker required={true} title="End Time" name="end-time" dateOnly={false} tz="UTC" bind:autoTZ={endAirportTZ} defaultValue={endTimeDefault} />
        </Section>
      {:else if data.params.tour !== 'new'}
        <Section title="Tour End">
          <Entry.Link href="/tour/{data.params.tour}/end" target="_self" title="End Tour" />
        </Section>
      {/if}

      <Section title="Details">
        <Entry.Select required={true} title="Company" options={['NetJets']} placeholder="Unset" name="company" defaultValue={'NetJets'} />
        <Entry.Switch required={true} title="Line Check" name="line-check" defaultValue={false} />
      </Section>
      <Section title="Notes">
        <Entry.TextField name="notes" placeholder="Enter Notes" defaultValue={null} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        {#if data.currentTour !== null}
          <form class="flex-grow max-w-[33%] md:w-48 md:flex-grow-0 flex items-start" action="?/delete" method="post" use:enhance={({ cancel }) => {
            const answer = confirm('Are you sure you want to delete this duty day? This action cannot be undone.');
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
            <input type="hidden" name="id" value={data.currentTour.id} />
            <Submit disabled={data.currentTour.days.length > 0} hoverTitle={data.currentTour.days.length > 0 ? 'Disabled because days still exist' : 'Delete Tour'} class="w-full" failed={form?.ok === false && form.action === '?/default'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
          </form>
        {/if}
        <a href="/tour/{data.params.tour}/day" class="flex-grow text-center w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
            ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">Days</a>
        {#if $unsavedChanges}
          <button type="button" on:click={() => clearUID(true)} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
            ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">Clear</button>
          <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText={data.params.tour === 'new' ? 'Create' : 'Update'} actionTextInProgress={data.params.tour === 'new' ? 'Creating' : 'Updating'} />
        {/if}
      </div>
    </form>
  </div>

</TwoColumn>
