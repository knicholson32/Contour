<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import Image from '$lib/components/Image.svelte';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';
  import { icons } from '$lib/components';
  import { page } from '$app/stores';
  import { goto} from '$app/navigation';
  import * as Map from '$lib/components/map';
  import Badge from '$lib/components/decorations/Badge.svelte';
  import * as MenuForm from '$lib/components/menuForm';
  import Tag from '$lib/components/decorations/Tag.svelte';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import * as Entry from '$lib/components/entry';
  import { dateToDateStringForm, getInlineDateUTC } from '$lib/helpers';

  export let form: import('./$types').ActionData;
  export let data: import('./$types').PageData;

  let submitting = false;
  let deleting = false;

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID('day-' + data.currentDay.id);
  $: formManager.updateForm(form);

  $: startTimeDefault = dateToDateStringForm(data.currentDay.startTime_utc, false, data.currentDay.startTimezone);
  $: endTimeDefault = dateToDateStringForm(data.currentDay.endTime_utc, false, data.currentDay.endTimezone);

  let startAirportTZ: string | null;
  let endAirportTZ: string | null;

  let urlActiveParam: string;
  let isMobileSize: boolean;

  const ref = $page.url.searchParams.get('ref');

</script>

<TwoColumn menu="scroll" {ref} form="scroll" bind:urlActiveParam bind:isMobileSize backText="Back" defaultRatio={0.33} >

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink" aria-label="Directory">
    <MenuForm.Title title="Duty Day" />
    <MenuForm.Link href={'/tour?' + urlActiveParam} icon={icons.chevronLeft} text="Edit Tour" type="left"/>
    <MenuForm.Link href={'/day/new?' + urlActiveParam} selected={$page.url.pathname.endsWith('new') && !isMobileSize} icon={icons.plus} text="Create a new day" type="right"/>
    <MenuForm.SearchBar />
    <!-- Existing Aircraft -->
    <Section title="Days">
      {#each data.days as day (day.id)}
        <a href="/day/{day.id}?{urlActiveParam}" class="relative select-none flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-0 {day.id === parseInt(data.params.id) && !isMobileSize ? 'bg-gray-200' : 'betterhover:hover:bg-gray-200 betterhover:hover:text-black'}">
          <div class="flex flex-row gap-1 items-center justify-center overflow-hidden py-2 flex-initial">
            <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">
              {day.startAirportId} - {day.endAirportId} 
              <span class="lowercase text-gray-400">
                on
                {getInlineDateUTC(day.startTime_utc)}
              </span>
              {#if $unsavedUIDs.includes('day-' + day.id)}
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

    <Map.Day legs={data.currentDay.legs} airports={data.airportList} deadheads={data.currentDay.deadheads} />

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
            <Submit disabled={data.currentDay.legs.length > 0} hoverTitle={data.currentDay.legs.length > 0 ? 'Disabled because legs still exist' : 'Delete Day'} class="w-full" failed={form?.ok === false && form.action === '?/default'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
          </form>
        {/if}
        <form class="flex-grow max-w-[33%] md:w-48 md:flex-grow-0 flex items-start" action="?/deadhead" method="post">
          <Submit class="w-full" failed={form?.ok === false && form.action === '?/delete'} submitting={deleting} theme={{primary: 'white'}} actionText={'Update DH'} actionTextInProgress={'Updating'} />
        </form>
        <a href="/day/{data.currentDay.id}/entry?active=menu" class="flex-grow w-full text-center md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">
          {#if data.currentDay.legs.length === 0}
            Create First Leg
          {:else}
            Edit Legs
          {/if}
        </a>
        {#if $unsavedChanges}
          <button type="button" on:click={() => clearUID(true)} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
        {/if}
        <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Update" actionTextInProgress="Update" />
      </div>
    </form>
  </div>

</TwoColumn>
