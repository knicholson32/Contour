<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import * as Card from "$lib/components/ui/card";
  import { Timeline } from '$lib/components/timeline';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte'
  import { v4 as uuidv4 } from 'uuid';
  import { icons } from '$lib/components';
  import { page } from '$app/stores';
  import { afterNavigate, goto} from '$app/navigation';
  import * as Map from '$lib/components/map';
  import * as MenuForm from '$lib/components/menuForm';
  import Tag from '$lib/components/decorations/Tag.svelte';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import * as Entry from '$lib/components/entry';
  import { dateToDateStringForm, dateToDateStringFormMonthDayYear, getInlineDateUTC } from '$lib/helpers';
  import { Briefcase, CalendarOff, ListOrdered, Plus, Timer, TowerControl } from 'lucide-svelte';
    import Warning from '$lib/components/Warning.svelte';
    import MenuElement from '$lib/components/menuForm/MenuElement.svelte';
    import MenuSection from '$lib/components/menuForm/MenuSection.svelte';

  export let form: import('./$types').ActionData;
  export let data: import('./$types').PageData;

  let submitting = false;
  let deleting = false;

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID('day-' + (data.currentDay?.id ?? 'unset'));
  $: formManager.updateForm(form);

  $: startTimeDefault = data.currentDay === null ? null : dateToDateStringForm(data.currentDay.startTime_utc, false, data.currentDay.startTimezone);
  $: endTimeDefault = data.currentDay === null ? null : dateToDateStringForm(data.currentDay.endTime_utc, false, data.currentDay.endTimezone);

  let startAirportTZ: string | null;
  let endAirportTZ: string | null;

  let isMobileSize: boolean;
  let urlActiveParam: string;
  let urlFormParam: string

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

  let map: Map.Day;

  const ref = $page.url.searchParams.get('ref');

</script>

<TwoColumn menu="scroll" {ref} form="scroll" bind:urlActiveParam bind:urlFormParam bind:isMobileSize backText="Back" afterDrag={resetMap}>

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink dark:divide-zinc-800" aria-label="Directory">
    <MenuForm.Title title="Duty Day" />
    {#if data.currentTour !== null}
      <MenuForm.Link href={`/entry/tour/${data.currentTour.id}?${urlFormParam}`} icon={icons.chevronLeft} text="Edit Tour" type="left"/>
      <MenuForm.Link href={`/entry/day/create?${urlFormParam}`} icon={icons.plus} text="Create a new day" type="right"/>
      <MenuForm.Link href={`/entry/leg?${urlFormParam}&tour=${data.currentTour.id}`} text="View All Legs in Tour" type="right">
        <ListOrdered class="w-3 h-3 text-white"/>
      </MenuForm.Link>
    {/if}
    <MenuForm.SearchBar />
    <!-- Existing Aircraft -->
    <MenuSection title="Days">
      {#each data.days as day,i (day.id)}
        <MenuElement href="/entry/day/{day.id}?{urlActiveParam}" selected={day.id === parseInt(data.params.id) && !isMobileSize}>
          <div class="flex flex-col gap-1 w-full overflow-hidden pl-2 mr-5 flex-initial font-medium text-xs">
            <div class="inline-flex overflow-hidden whitespace-nowrap text-ellipsis">
              <span class="font-mono">
                {day.startAirportId} → {day.endAirportId}
              </span>
              <span class="flex-grow ml-1">
                {#if $unsavedUIDs.includes('day-' + day.id)}
                  <Tag>UNSAVED</Tag>
                {/if}
              </span>
              <span class="text-sky-600">
                {dateToDateStringFormMonthDayYear(day.startTime_utc)}
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

    {#if data.currentDay === null}
      <div class="absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center">
        <div class="text-center">
          <CalendarOff class="h-12 w-12 mx-auto"/>
          <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No Days</h3>
          {#if data.currentTour === null}
            <p class="mt-1 text-sm text-gray-400">Get started by creating a day.</p>
          {:else}
            <p class="mt-1 text-sm text-gray-400">Get started by creating a day for this tour.</p>
          {/if}
          {#if data.currentTour !== null}
            <div class="mt-6">
              <a href="/entry/day/create?{urlFormParam}" class="inline-flex items-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">
                <Plus class="-ml-0.5 mr-1.5 h-5 w-5" />
                Create A New Day
              </a>
            </div>
          {/if}
        </div>
      </div>
    {:else}
    
      {#key mapKey}
        <Map.Day bind:this={map} class="" legs={data.currentDay.legs} airports={data.airportList} deadheads={data.currentDay.deadheads} />
        <Timeline class="" data={data.legDeadheadCombo} day={data.currentDay} />
      {/key}

      <div class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 p-4">
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

        {#if data.currentTour !== null && data.currentDay.tourId !== data.currentTour.id}
          <Section title="Warnings" warning={true}>
            <Warning error={true}>The current day is not apart of this tour set.</Warning>
          </Section>
        {/if}

        <Section title="Start" error={form !== null && form.ok === false && form.action === '?/update' && form.name === '*' ? form.message : null}>
          <Entry.AirportPicker action="?/update" required={true} title="Airport" name="start-airport" airports={data.airports} bind:tz={startAirportTZ} defaultValue={data.currentDay.startAirport.id} />
          <Entry.TimePicker action="?/update" required={true} title="Time" name="start-time" dateOnly={false} bind:autoTZ={startAirportTZ} tz={data.currentDay.startAirport.timezone === data.currentDay.startTimezone ? undefined : data.currentDay.startTimezone} defaultValue={startTimeDefault} />
        </Section>

        <Section title="End" error={form !== null && form.ok === false && form.action === '?/update' && form.name === '*' ? form.message : null}>
          <Entry.AirportPicker action="?/update" required={true} title="Airport" name="end-airport" airports={data.airports}  bind:tz={endAirportTZ} defaultValue={data.currentDay.endAirport.id} />
          <Entry.TimePicker action="?/update" required={true} title="Time" name="end-time" dateOnly={false} bind:autoTZ={endAirportTZ} tz={data.currentDay.endAirport.timezone === data.currentDay.endTimezone ? undefined : data.currentDay.endTimezone} defaultValue={endTimeDefault} />
        </Section>

        <Section title="Notes">
          <Entry.TextField name="notes" placeholder="Enter Notes" defaultValue={data.currentDay.notes} />
        </Section>

        <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
          {#if data.currentDay !== null}
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
              <input type="hidden" name="id" value={data.currentDay.id} />
              {#if data.currentTour?.id !== undefined}
                <input type="hidden" name="tour" value={data.currentTour?.id} />
              {/if}
              <Submit disabled={data.currentDay.legs.length > 0} hoverTitle={data.currentDay.legs.length > 0 ? 'Disabled because legs still exist' : 'Delete Day'} class="w-full" failed={form?.ok === false && form.action === '?/default'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
            </form>
          {/if}
          <a href="/entry/leg?active=menu&day={data.currentDay.id}{data.currentTour === null ? '' : '&tour='+data.currentTour.id}" class="flex-grow w-full text-center md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">
            Legs
          </a>
          {#if $unsavedChanges}
            <button type="button" on:click={() => clearUID(true)} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
              ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">Clear</button>
            <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Update" actionTextInProgress="Update" />
          {/if}
        </div>
      </form>
    {/if}
  </div>

</TwoColumn>
