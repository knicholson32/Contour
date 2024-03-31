<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { Timeline } from '$lib/components/timeline';
  import * as Card from "$lib/components/ui/card";
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
  import { dateToDateStringForm, dateToDateStringFormMonthDayYear, getInlineDateUTC } from '$lib/helpers';
  import * as Map from '$lib/components/map';
  import { Timer, TowerControl } from 'lucide-svelte';
    import MenuSection from '$lib/components/menuForm/MenuSection.svelte';
    import MenuElement from '$lib/components/menuForm/MenuElement.svelte';

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
  });



  const ref = $page.url.searchParams.get('ref');

</script>

<TwoColumn menu="scroll" {ref} form="scroll" bind:urlActiveParam bind:isMobileSize backText="Back">

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink dark:divide-zinc-800" aria-label="Directory">
    <MenuForm.Title title="Tours" />
    <MenuForm.Link href={'/entry/tour/new?' + urlActiveParam} selected={$page.url.pathname.endsWith('new') && !isMobileSize} icon={icons.plus} text="Start a new tour" type="right"/>
    <MenuForm.SearchBar />
    <!-- Existing Tours -->
    <MenuSection title="Tours">
      {#each data.tours as tour (tour.id)}
        <MenuElement href="/entry/tour/{tour.id}?{urlActiveParam}" selected={tour.id === parseInt(data.params.id) && !isMobileSize}>
          <div class="flex flex-col gap-1 w-full overflow-hidden pl-2 mr-5 flex-initial font-medium text-xs">
            <div class="inline-flex overflow-hidden whitespace-nowrap text-ellipsis">
              <span class="text-sky-600 w-20">{dateToDateStringFormMonthDayYear(tour.startTime_utc)}</span>
              <span class="mx-2 text-xxs">→</span>
              <span class="ml-1 text-sky-600 w-20">
                {#if tour.endTime_utc === null}
                  In Progress
                {:else}
                  {dateToDateStringFormMonthDayYear(tour.endTime_utc ?? 0)}
                {/if}
              </span>
              <span class="flex-grow ml-1">
                {#if $unsavedUIDs.includes('tour-' + tour.id)}
                  <Tag>UNSAVED</Tag>
                {/if}
              </span>
              <span class="mx-2 text-xxs">
                {tour._count.days + ' '}
                {#if tour._count.days === 1}
                  Day
                {:else}
                  Days
                {/if}
              </span>
            </div>
          </div>
          <div class="absolute right-1">
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
              {@html icons.chevronRight}
            </svg>
          </div>
        </MenuElement>
      {/each}
    </MenuSection>
  </nav>
  
  <!-- Form Side -->
  <div slot="form" class="flex-shrink">

    {#if data.entrySettings['entry.tour.current'] === data.currentTour?.id}
      <MenuForm.Title title="Active Tour" />
    {/if}

    {#if data.tourMap !== null}
      {#key mapKey}
        <Map.Bulk class="rounded-md bg-transparent border-red-500 ring-0 bg-red-500" legIDs={data.tourMap.ids} pos={data.tourMap.positions} airports={data.tourMap.airports} />
      {/key}
    {/if}

    {#if data.stats !== null}

      <div class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 p-4 {data.tourMap !== null ? 'border-t' : ''}">
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">Flight Time</Card.Title>
            <Timer class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold">{data.stats.flight.toFixed(1)} hr</div>
            <p class="text-xs text-muted-foreground">{data.stats.distance.toFixed(0)} nmi traveled</p>
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">Duty Time</Card.Title>
            <Timer class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold">{data.stats.duty.toFixed(1)} hr</div>
            {#if data.stats.duty === 0}
              <p class="text-xs text-muted-foreground">Unknown duty ratio</p>
            {:else}
              <p class="text-xs text-muted-foreground">Ratio of {(data.stats.flight / data.stats.duty * 100).toFixed(0)}%</p>
            {/if}
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">Unique Airports</Card.Title>
            <TowerControl class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold">{data.stats.airports}</div>
            <p class="text-xs text-muted-foreground">{data.stats.operations} operations</p>
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">Average Speed</Card.Title>
            <TowerControl class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold">{data.stats.speed.toFixed(0)} kts</div>
            <p class="text-xs text-muted-foreground">Max {data.stats.fastestSpeed.toFixed(0)} kts</p>
          </Card.Content>
        </Card.Root>
      </div>
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

      <!-- <div class="mx-4 my-6">
        <Calendar startUnix={data.currentTour === null ? new Date().getTime() / 1000 : data.currentTour.startTime_utc } />
      </div> -->

      <Section title="Tour Start" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.AirportPicker required={true} title="Show Airport" name="show-airport" airports={data.airports} bind:tz={showAirportTZ} defaultValue={data.currentTour?.startAirportId ?? data.tourSettings['tour.defaultStartApt'] ?? null} />
        <Entry.TimePicker required={true} title="Show Time" name="show-time" dateOnly={false} tz="UTC" bind:autoTZ={showAirportTZ} defaultValue={startTimeDefault} />
      </Section>

      {#if (data.currentTour?.endTime_utc ?? null) !== null}
        <Section title="Tour End">
          <Entry.AirportPicker required={true} title="End Airport" name="end-airport" airports={data.airports} bind:tz={endAirportTZ} defaultValue={data.currentTour?.endAirportId ?? null} />
          <Entry.TimePicker required={true} title="End Time" name="end-time" dateOnly={false} tz="UTC" bind:autoTZ={endAirportTZ} defaultValue={endTimeDefault} />
        </Section>
      {:else if data.params.id !== 'new'}
        <Section title="Tour End">
          <Entry.Link href="/entry/tour/{data.params.id}/end" target="_self" title="End Tour" />
        </Section>
      {/if}

      <Section title="Details">
        <Entry.Select required={true} title="Company" options={['NetJets']} placeholder="Unset" name="company" defaultValue={'NetJets'} />
        <Entry.Switch required={true} title="Line Check" name="line-check" defaultValue={data.currentTour?.lineCheck ?? false} />
      </Section>
      <Section title="Notes">
        <Entry.TextField name="notes" placeholder="Enter Notes" defaultValue={data.currentTour?.notes ?? null} />
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
        <a href="/entry/day?tour={data.params.id}" class="flex-grow text-center w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
            ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">Days</a>
        {#if $unsavedChanges}
          <button type="button" on:click={() => clearUID(true)} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
            ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">Clear</button>
          <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText={data.params.id === 'new' ? 'Create' : 'Update'} actionTextInProgress={data.params.id === 'new' ? 'Creating' : 'Updating'} />
        {/if}
      </div>
    </form>
  </div>

</TwoColumn>
