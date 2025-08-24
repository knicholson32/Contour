<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import * as Card from "$lib/components/ui/card";
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte'
  import { v4 as uuidv4 } from 'uuid';
  import { icons } from '$lib/components';
  import { page } from '$app/state';
  import { afterNavigate, goto, invalidateAll} from '$app/navigation';
  import * as MenuForm from '$lib/components/menuForm';
  import Tag from '$lib/components/decorations/Tag.svelte';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import * as Entry from '$lib/components/entry';
  import { dateToDateStringForm, dateToDateStringFormMonthDayYear, getInlineDateUTC } from '$lib/helpers';
  import * as Deck from '$lib/components/map/deck';
  import { ArrowRight, Timer, TowerControl } from 'lucide-svelte';
  import MenuSection from '$lib/components/menuForm/MenuSection.svelte';
  import MenuElement from '$lib/components/menuForm/MenuElement.svelte';
  import { TourPreview } from '$lib/components/tourPreview';

  interface Props {
    form: import('./$types').ActionData;
    data: import('./$types').PageData;
  }

  let { form: formData, data }: Props = $props();

  let submitting = $state(false);
  let deleting = $state(false);

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();

  $effect(() => {
    formManager.updateUID('tour-' + (data.currentTour?.id ?? 'new-'));
  });
  $effect(() => {
    formManager.updateForm(formData);
  });

  let startTimeDefault = $derived(data.currentTour === null ? null : dateToDateStringForm(data.currentTour.startTime_utc, false, data.currentTour.startTimezone));
  let endTimeDefault = $derived(data.currentTour === null || data.currentTour.endTime_utc === null || data.currentTour.endTimezone === null ? null : dateToDateStringForm(data.currentTour.endTime_utc, false, data.currentTour.endTimezone));

  let showAirportTZ: string | null = $state(null);
  let endAirportTZ: string | null = $state(null);

  let urlActiveParam: string | undefined = $state();
  let isMobileSize: boolean = $state(false);

  let mapKey: string | null = $state(null);
  const resetMap = () => {
    mapKey = uuidv4();
  }

  $effect(() => {
    formData;
    data;
    resetMap();
  });

  afterNavigate(() => {
    setTimeout(resetMap, 1);
  });


  let hoveringLeg: string | null = $state(null);
  const ref = page.url.searchParams.get('ref');

  // let highlight: string | null = $state(null);

  // $effect(() => {
  //   if (hoveringLeg === null) {
  //     highlight = null;
  //   } else {
  //     highlight = data.tourMap?.ids.findIndex((leg) => leg === hoveringLeg) ?? -1;
  //     if (highlight === -1) highlight = null;
  //   }
  // });

</script>

<TwoColumn menuZone="scroll" {ref} formZone="scroll" bind:urlActiveParam bind:isMobileSize backText="Back">

  <!-- Menu Side -->
  {#snippet menu()}
    <nav class="shrink dark:divide-zinc-800" aria-label="Directory">
      <MenuForm.Title title="Tours" />
      <MenuForm.Link href={'/entry/tour/new?' + urlActiveParam} selected={page.url.pathname.endsWith('new') && !isMobileSize} icon={icons.plus} text="Start a new tour" type="right"/>
      <MenuForm.SearchBar />
      <!-- Existing Tours -->
      <MenuSection title="Tours">
        {#each data.tours as tour (tour.id)}
          <MenuElement href="/entry/tour/{tour.id}?{urlActiveParam}" selected={tour.id === data.id && !isMobileSize}>
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
                <span class="grow ml-1">
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
  {/snippet}
  <!-- Form Side -->
  {#snippet form()}
    <div class="shrink">

      {#if data.entrySettings['entry.tour.current'] === data.currentTour?.id}
        <MenuForm.Title title="Active Tour" />
      {/if}

      {#if data.tourMap !== null}
        <div class="relative h-[calc(100vh_-_22rem_-_6rem_-_var(--nav-height)_-_1rem_+_2px)] md:h-[calc(100vh_-_12.5rem_-_6rem_-_var(--nav-height)_-_1rem_+_2px)] flex">
          <Deck.Core padding={50} >
            <Deck.Airports airports={data.tourMap.airports}/>
            <Deck.Legs legs={data.deckSegments} highlight={hoveringLeg}/>
          </Deck.Core>
          <a href="/entry/day?tour={data.id}" class="absolute right-4 bottom-4 z-10 inline-flex gap-2 items-center justify-center border border-zinc-300 dark:border-zinc-950/50 bg-zinc-100/70 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 backdrop-blur-lg px-3 py-2 rounded-lg text-xxs uppercase group">
            Days
            <ArrowRight class="w-4 h-4 group-hover:-mr-1 group-hover:ml-1 transition-all group-hover:text-sky-500"/>
          </a>
        </div>
      {/if}

      {#if data.stats !== null}

        <div class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 p-4 h-auto xs:h-88 md:h-50 {data.tourMap !== null ? 'border-t' : ''}">
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

      {#if data.currentTour !== null}
        <div class="mx-4 mb-4 bg-card text-card-foreground rounded-lg border shadow-xs overflow-hidden h-24">
          <TourPreview tour={data.currentTour} bind:hoveringLeg={hoveringLeg} tzData={data.tzData} prefersUTC={data.prefersUTC} />
        </div>
      {/if}

      <form id="form-update-or-create" action="?/updateOrCreate" method="post" enctype="multipart/form-data" use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          await update({ reset: false });
          submitting = false;
          setTimeout(() => {
            if (formData?.ok !== false) formManager.clearUID(false);
          }, 1);
        };
      }}>
        <Section title="Tour Start" error={formData !== null && formData.ok === false && formData.action === '?/default' && formData.name === '*' ? formData.message : null}>
          <Entry.AirportPicker required={true} title="Show Airport" name="show-airport" airports={data.airports} bind:tz={showAirportTZ} defaultValue={data.currentTour?.startAirportId ?? data.tourSettings['tour.defaultStartApt'] ?? null} />
          <Entry.TimePicker required={true} title="Show Time" name="show-time" dateOnly={false} tz="UTC" bind:autoTZ={showAirportTZ} defaultValue={startTimeDefault} />
        </Section>

        {#if (data.currentTour?.endTime_utc ?? null) !== null}
          <Section title="Tour End">
            <Entry.AirportPicker required={true} title="End Airport" name="end-airport" airports={data.airports} bind:tz={endAirportTZ} defaultValue={data.currentTour?.endAirportId ?? null} />
            <Entry.TimePicker required={true} title="End Time" name="end-time" dateOnly={false} tz="UTC" bind:autoTZ={endAirportTZ} defaultValue={endTimeDefault} />
          </Section>
        {:else if data.id !== 'new'}
          <Section title="Tour End">
            <Entry.Link href="/entry/tour/{data.id}/end" target="_self" title="End Tour" />
          </Section>
        {/if}

        <Section title="Details">
          <Entry.Select required={true} title="Company" options={['NetJets', 'Cape Air']} placeholder="Unset" name="company" defaultValue={data.currentTour?.companyId ?? 'NetJets'} />
          <Entry.Switch required={true} title="Line Check" name="line-check" defaultValue={data.currentTour?.lineCheck ?? false} />
        </Section>
        <Section title="Notes">
          <Entry.TextField name="notes" placeholder="Enter Notes" defaultValue={data.currentTour?.notes ?? null} />
        </Section>
      </form>
      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky top-[400px] z-10">
        {#if data.currentTour !== null}
          <form class="grow max-w-[33%] md:w-48 md:grow-0 flex items-start" action="?/delete" method="post" use:enhance={({ cancel }) => {
            const answer = confirm('Are you sure you want to delete this duty day? This action cannot be undone.');
            if (!answer) cancel();
            else {
              deleting = true;
              return async ({ update }) => {
                await update({ invalidateAll: true });
                deleting = false;
                if (formData?.ok !== false) formManager.clearUID(false);
              };
            }
          }}>
            <input type="hidden" name="id" value={data.currentTour.id} />
            <Submit disabled={data.currentTour.days.length > 0} hoverTitle={data.currentTour.days.length > 0 ? 'Disabled because days still exist' : 'Delete Tour'} class="w-full" failed={formData?.ok === false && formData.action === '?/default'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
          </form>
        {/if}
        <a href="/entry/day?tour={data.id}" class="grow text-center w-full md:w-48 md:grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 
            ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">Days</a>
        {#if $unsavedChanges}
          <button type="button" onclick={() => clearUID(true)} class="grow w-full md:w-48 md:grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 
            ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900">Clear</button>
          <Submit remoteForm="form-update-or-create" class="grow w-full md:w-48 md:grow-0" failed={formData?.ok === false && (formData.action === '?/default' || formData?.action === '*')} {submitting} theme={{primary: 'white'}} actionText={data.id === 'new' ? 'Create' : 'Update'} actionTextInProgress={data.id === 'new' ? 'Creating' : 'Updating'} />
        {/if}
      </div>
    </div>
  {/snippet}

</TwoColumn>
