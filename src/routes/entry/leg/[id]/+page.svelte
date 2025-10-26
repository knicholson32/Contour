<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';
  import { icons } from '$lib/components';
  import { page } from '$app/state';
  import * as Card from "$lib/components/ui/card";
  import { afterNavigate, beforeNavigate, goto} from '$app/navigation';
  import type * as Types from '@prisma/client';
  import { API, DB } from '$lib/types';
  import * as MenuForm from '$lib/components/menuForm';
  import Tag from '$lib/components/decorations/Tag.svelte';
  import * as Popover from "$lib/components/ui/popover";
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import * as Entry from '$lib/components/entry';
  import { dateToDateStringForm, dateToTimeStringZulu, pad, preloadLegOverview, timeStrAndTimeZoneToUTC } from '$lib/helpers';
  import { v4 as uuidv4 } from 'uuid';
  import { browser } from '$app/environment';
  import { CircleAlert, CalendarDays, ChevronRight, Server, Fullscreen, Gauge, Link, Maximize, Plus, Route, RouteOff, Table2, Timer, Waypoints } from 'lucide-svelte';
  import { VisXYContainer, VisLine, VisAxis, VisCrosshair, VisTooltip, VisBulletLegend } from "@unovis/svelte";
	import { color } from "$lib/components/ui/helpers";
  import Tooltip from '$lib/components/routeSpecific/leg/Tooltip.svelte';
  import { onMount } from 'svelte';
  import MenuSection from '$lib/components/menuForm/MenuSection.svelte';
  import MenuElement from '$lib/components/menuForm/MenuElement.svelte';
  import LegEntry from '$lib/components/routeSpecific/leg/LegEntry.svelte';
  import * as Deck from '$lib/components/map/deck';

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

  let startAirportTZ: string | null = $state(data.startTimezone?.name ?? null);
  let endAirportTZ: string | null = $state(data.endTimezone?.name ?? null);
  let divertAirportTZ: string | null = $state(data.endTimezone?.name ?? null);

  let endApt: string | null = $state(null);
  let divertApt: string | null = $state(null);

  let outTime: string | null = $state(null);
  let inTime: string | null = $state(null);

  // Default to UTC
  let outTZ: string | null = $state('UTC');
  let inTZ: string | null = $state('UTC');



  let totalTime: string | null = $state(null);

  let urlActiveParam: string | undefined = $state();
  let urlFormParam: string | undefined = $state();
  let isMobileSize: boolean = $state(false);

  const onMenuBack = () => {
    // if (ref === null) goto('/tour/' + data.params.tour + '/day/' + data.params.id + '?active=form');
    // else goto(ref);
  }

  let approaches: {id: string, approach: Types.Approach | null, modified: Types.Approach | null}[] = $state([]);

  const resetApproaches = () => {
    approaches = [];
    if (browser) {
      for (let i = 0; i < localStorage.length; i++) {
        // Get the key
        const key = localStorage.key(i);
        // If it is not null and starts with the UID, add it to be removed.
        // We can't remove it here because then our for loop gets out of sync.
        if (key !== null && key.startsWith(data.leg?.id ?? 'unset' + '.approach-')) {
          const v = localStorage.getItem(key);
          if (v !== null) {
            try {
              const app = JSON.parse(v) as Types.Approach;
              if (app.id !== undefined) approaches.push({ id: app.id, modified: app, approach: null });
            } catch (e) {}
          }
        }
      }
    }
    for (const app of data.leg?.approaches ?? []) {
      // Only add the approach from defaults if it isn't added via local storage
      if (approaches.findIndex((a) => a.id === app.id) === -1) approaches.push({ id: app.id, approach: app, modified: null });
    }
    approaches = approaches;
  }
  resetApproaches();

  const addApproach = () => {
    approaches.push({ id: uuidv4(), approach: null, modified: null});
    approaches = approaches;
  }

  const deleteApproach = (id: string) => {
    approaches = approaches.filter((v) => v.id !== id);
  }

  let mapKey = $state(uuidv4());
  const resetMap = () => {
    mapKey = uuidv4();
    latLong = null;
  }


  let menuElements: { [key: string]: HTMLAnchorElement } = $state({});

  beforeNavigate(() => {
    menuElements = {};
  });

  let scrollToDiv: HTMLAnchorElement | undefined = $state();

  afterNavigate(() => {
    resetApproaches();
    if (data.leg === null) scrollToDiv = undefined;
    else {
      if (data.leg.id in menuElements) scrollToDiv = menuElements[data.leg.id];
      else scrollToDiv = undefined;
    }
    setTimeout(() => {
      resetMap()
    }, 1);

    if ((data.leg?.dayId ?? null) !== null && (selectedAircraftAPI !== null && selectedAircraftAPI.simulator === false)) useBlock = true;
  });

  const ref = page.url.searchParams.get('ref');

  const tickFormat = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return pad(date.getUTCHours(), 2) + ':' + pad(date.getUTCMinutes(), 2);
  }

  const x = (d: Types.Position) => d.timestamp;
  const yAltitude = (d: Types.Position) => {
    if (d.updateType === DB.UpdateType.PROJECTED || d.groundspeed === 0) return undefined;
    return d.altitude * 100;
  }
  const ySpeed = (d: Types.Position) => {
    if (d.updateType === DB.UpdateType.PROJECTED || d.groundspeed === 0) return undefined;
    return d.groundspeed * data.speedScaler;
  }
  const crosshairColor = (d: Types.Position, i: number) => [color()(),color({ secondary: true })()][i]

  let tooltip: HTMLElement | undefined = $state();
  let position: Types.Position | undefined = $state();
  let latLong: [number, number] | null = $state(null);
  const template = (d: Types.Position) => {
    position = d;
    latLong = [d.latitude, d.longitude];
    return tooltip;
  }

  let tooltipContainer: HTMLElement | undefined = $state(undefined);
  if (browser) tooltipContainer = document.body;

  let legsPopoverOpen = $state(false);
  // Use Block times is defaulted to true if the start time isn't the same as the start of the day (duty or assigned)
  let useBlock: boolean = $state(true);

  let submitFADelete: HTMLButtonElement | undefined = $state();
  const faDelete = async () => {
    if (submitFADelete === undefined) return;
    const result = await confirm('Are you sure? This CANNOT be undone.');
    if (result) submitFADelete.click();
  }

  let selectedAircraft: string | null = $state(null);
  let selectedAircraftAPI: API.Types.Aircraft | null = $state(data.selectedAircraftAPI);
  let mounted = false;
  const refreshSelectedAC = async (selected: string) => {
    if (!mounted) return;
    const res = await (await fetch(`/api/aircraft/reg/${selected}`)).json() as API.Aircraft;
    if (res.ok == true && res.type === 'aircraft') selectedAircraftAPI = res.aircraft;
  }

  onMount(async () => {
    mounted = true;
    if (selectedAircraft !== null)
      await refreshSelectedAC(selectedAircraft);
  });


  // console.log(data.leg.positions);

  let tourDayInfo = $state('');
  const updateTourDayInfo = (params: {dayId: number | null, tourId: number | null, search: string | null}) => {
    // $: tourDayInfo = data.searchParams.dayId === null ;
    if (params.dayId === null && params.tourId === null) tourDayInfo = '';
    else if (params.dayId !== null && params.tourId !== null) tourDayInfo = `day=${params.dayId}&tour=${params.tourId}`;
    else if (params.dayId !== null) tourDayInfo = `day=${params.dayId}`;
    else tourDayInfo = `tour=${params.tourId}`;

    if (params.search !== null && params.search !== '') {
      if (tourDayInfo === '') tourDayInfo = 'search=' + params.search;
      else tourDayInfo = tourDayInfo + '&search=' + params.search;
    }
  }



  $effect(() => {
    formManager.updateUID(data.leg?.id ?? 'unset');
  });
  $effect(() => {
    formManager.updateForm(formData);
  });

  let outTimeUTC = $derived(outTZ === null ? null : timeStrAndTimeZoneToUTC(outTime, outTZ));
  let inTimeUTC = $derived(inTZ === null ? null : timeStrAndTimeZoneToUTC(inTime, inTZ));
  let calcTotalTime: number | null = $derived(outTimeUTC === null || inTimeUTC === null ? null : ((inTimeUTC.value - outTimeUTC.value) / 60 / 60));
  let outTZBind = $derived((divertAirportTZ === null) ? endAirportTZ : divertAirportTZ);
  
  $effect(() => {
    formData;
    data;
    resetMap();
  });
  afterNavigate(() => {
    resetApproaches();
    updateTourDayInfo(data.searchParams);
  });
  let useBlockRequired = $derived((data.leg?.dayId ?? null) !== null && (selectedAircraftAPI !== null && selectedAircraftAPI.simulator === false));
  $effect(() => {
    if (useBlockRequired === true) useBlock = true;
  });
  $effect(() => {
    if (selectedAircraft !== null) refreshSelectedAC(selectedAircraft);
  });
  // $effect(() => updateTourDayInfo(data.searchParams));
</script>

<div class="hidden">
  <Tooltip bind:el={tooltip} bind:position />
</div>

<TwoColumn menuZone="scroll" {ref} formZone="scroll" bind:scrollToDiv bind:urlActiveParam bind:urlFormParam bind:isMobileSize backText="Back" onMenuBack={onMenuBack} afterDrag={resetMap}>


  <!-- Menu Side -->
  {#snippet menu()}
    <nav class="shrink dark:divide-zinc-800" aria-label="Directory">
      {#if data.currentDay !== null}
        <MenuForm.Title title="Duty Day Legs" />
        <MenuForm.Link href={`/entry/day/${data.currentDay.id}?${urlFormParam}`} type="left" text="Back to Day" />
        <!-- <MenuForm.Link href={`/entry/leg/create/fa?${urlFormParam}`} icon={icons.plus} text="Create a new leg" type="right"/> -->
        <Popover.Root bind:open={legsPopoverOpen}>
          <Popover.Trigger class="w-full">
            <MenuForm.Link href="#" icon={icons.plus} text="Create a new leg" type="right"/>
          </Popover.Trigger>
          <Popover.Content side={isMobileSize ? undefined : 'right'} class="rounded-md bg-white dark:bg-zinc-900 py-1 px-0 focus:outline-hidden w-auto">
            <!-- Active: "bg-gray-100", Not Active: "" -->
            <a href="/entry/leg/create/fa?{urlFormParam}" onclick={() => legsPopoverOpen = false} class="hover:bg-gray-50 dark:hover:bg-zinc-800 block px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white" role="menuitem" tabindex="-1" id="user-menu-item-1">From FlightAware</a>
            <a href="/entry/leg/create/form?{urlFormParam}" onclick={() => legsPopoverOpen = false} class="hover:bg-gray-50 dark:hover:bg-zinc-800 block px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white" role="menuitem" tabindex="-1" id="user-menu-item-1">From Scratch</a>
          </Popover.Content>
        </Popover.Root>
      {:else}
        <MenuForm.Title title={page.url.searchParams.get('tour') !== null ? 'Tour Legs' : 'Legs'} />
        <Popover.Root bind:open={legsPopoverOpen}>
          <Popover.Trigger class="w-full">
            <MenuForm.Link href="#" icon={icons.plus} text="Create a new leg" type="right"/>
            {#if page.url.searchParams.get('tour') !== null}
              <MenuForm.Link href={`/entry/day?tour=${page.url.searchParams.get('tour')}`} icon={icons.plus} text="Go back to Tour" type="left"/>
            {/if}
          </Popover.Trigger>
          <Popover.Content side={isMobileSize ? undefined : 'right'} class="rounded-md bg-white dark:bg-zinc-900 py-1 px-0 focus:outline-hidden w-auto">
            <!-- Active: "bg-gray-100", Not Active: "" -->
            <a href="/entry/leg/create/fa" onclick={() => legsPopoverOpen = false} class="hover:bg-gray-50 dark:hover:bg-zinc-800 block px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white" role="menuitem" tabindex="-1" id="user-menu-item-1">From FlightAware</a>
            <a href="/entry/leg/create/form" onclick={() => legsPopoverOpen = false} class="hover:bg-gray-50 dark:hover:bg-zinc-800 block px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white" role="menuitem" tabindex="-1" id="user-menu-item-1">From Scratch</a>
          </Popover.Content>
        </Popover.Root>
      {/if}
      <MenuForm.SearchBar />
      <!-- Existing Legs -->
      {#if data.legDeadheadCombo === null}
        {#each data.legs as group,i (group.text)}
          <MenuSection title={group.text}>
            {#each group.entries as leg, i (leg.id)}
              <MenuElement bind:element={menuElements[leg.id]} href="/entry/leg/{leg.id}?{urlActiveParam}" selected={leg.id === page.params.id && !isMobileSize}>
                <LegEntry leg={leg} unsaved={$unsavedUIDs.includes(leg.id)} />
              </MenuElement>
            {/each}
          </MenuSection>
        {/each}
      {:else}
        {#if data.legDeadheadCombo.length !== 0 && !(data.legDeadheadCombo.length === 1 && data.legDeadheadCombo[0].type === 'deadhead' && data.legDeadheadCombo[0].entry.originAirportId === data.legDeadheadCombo[0].entry.destinationAirportId)}
          <MenuSection title="Legs">
            {#each data.legDeadheadCombo as entry, i (entry.id)}
              {#if entry.type === 'leg'}
                <MenuElement href="/entry/leg/{entry.id}?{urlActiveParam}" selected={entry.id === page.params.id && !isMobileSize}>
                  <div class="flex flex-col gap-1 w-full overflow-hidden pl-2 mr-5 flex-initial font-medium text-xs">
                    <div class="inline-flex overflow-hidden whitespace-nowrap text-ellipsis">
                      <span class="">
                        {#if entry.entry.originAirportId === null && entry.entry.destinationAirportId === null}
                          No Route
                        {:else}
                          {entry.entry.originAirportId} → {entry.entry.diversionAirportId === null ? entry.entry.destinationAirportId : entry.entry.diversionAirportId}
                        {/if}
                      </span>
                      <span class="grow ml-1">
                        {#if $unsavedUIDs.includes(entry.entry.id)}
                          <Tag>UNSAVED</Tag>
                        {/if}
                      </span>
                      <span class="mr-2">
                        <div class="w-4 h-4 text-xxs flex items-center justify-center font-bold rounded-full bg-sky-600 text-white">{i + 1}</div>
                      </span>
                      <span class="text-sky-600">
                        {#if entry.entry.startTime_utc === null}
                          No Date
                        {:else}
                          {dateToTimeStringZulu(entry.entry.startTime_utc)}
                        {/if}
                      </span>
                    </div>
                    <div class="inline-flex overflow-hidden whitespace-nowrap text-ellipsis">
                      <span class="font-normal text-gray-400 dark:text-zinc-500 overflow-hidden whitespace-nowrap text-ellipsis">
                        {entry.entry.aircraft.registration} ({entry.entry.aircraft.type.typeCode})
                      </span>
                      <span class="grow"></span>
                      <span class="">{entry.entry.totalTime.toFixed(1)}</span> <span class="font-light ml-1">Total</span>
                    </div>
                  </div>
                  <div class="absolute right-1">
                    <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                      {@html icons.chevronRight}
                    </svg>
                  </div>
                </MenuElement>
              {:else}
                <div class="relative select-none flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-0 bg-gray-50 dark:bg-zinc-950/50">
                  <div class="flex flex-row gap-1 items-center justify-center overflow-hidden py-2 flex-initial">
                    <div class="uppercase font-bold font-mono text-xs overflow-hidden whitespace-nowrap text-ellipsis text-gray-400 dark:text-zinc-700">
                      <span class="text-xxs font-thin">{i+1}</span> {entry.entry.originAirportId} → {entry.entry.destinationAirportId} (Deadhead)
                    </div>
                  </div>
                </div>
              {/if}
            {/each}
          </MenuSection>
        {/if}
        {#if data.simulatedLegs.length > 0}
          <MenuSection title="Simulated Flights">
            {#each data.simulatedLegs as entry, i}
              <MenuElement href="/entry/leg/{entry.id}?{urlActiveParam}" selected={entry.id === page.params.id && !isMobileSize}>
                <div class="flex flex-col gap-1 w-full overflow-hidden pl-2 mr-5 flex-initial font-medium text-xs">
                  <div class="inline-flex overflow-hidden whitespace-nowrap text-ellipsis">
                    <span class="">
                      {#if entry.originAirportId === null && entry.destinationAirportId === null}
                        No Route
                      {:else}
                        {entry.originAirportId} → {entry.diversionAirportId === null ? entry.destinationAirportId : entry.diversionAirportId}
                      {/if}
                    </span>
                    <span class="grow ml-1">
                      {#if $unsavedUIDs.includes(entry.id)}
                        <Tag>UNSAVED</Tag>
                      {/if}
                    </span>
                    <span class="mr-2">
                      <Server class="w-4 h-4" />
                    </span>
                    <span class="text-sky-600">
                      Simulated
                    </span>
                  </div>
                  <div class="inline-flex overflow-hidden whitespace-nowrap text-ellipsis">
                    <span class="font-normal text-gray-400 dark:text-zinc-500 overflow-hidden whitespace-nowrap text-ellipsis">
                      {entry.aircraft.registration} ({entry.aircraft.type.typeCode})
                    </span>
                    <span class="grow"></span>
                    <span class="">{entry.totalTime.toFixed(1)}</span> <span class="font-light ml-1">Total</span>
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
        {/if}
      {/if}
    </nav>
  {/snippet}
  
  <!-- Form Side -->
  {#snippet form()}
    <div class="shrink">
      {#if data.leg === null}
        <div class="absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center">
          <div class="text-center">
            <RouteOff class="h-12 w-12 mx-auto"/>
            <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No Legs</h3>
            {#if data.currentDay === null}
              <p class="mt-1 text-sm text-gray-400">Get started by creating a leg.</p>
            {:else}
              <p class="mt-1 text-sm text-gray-400">Get started by creating a leg for this duty day.</p>
            {/if}
            {#if data.currentDay !== null}
              <div class="mt-6">
                <Popover.Root>
                  <Popover.Trigger class="w-full">
                    <div class="inline-flex items-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-sky-500 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">
                      <Plus class="-ml-0.5 mr-1.5 h-5 w-5" />
                      Create A New Leg
                    </div>
                  </Popover.Trigger>
                  <Popover.Content  class="rounded-md bg-white dark:bg-zinc-900 py-1 px-0 focus:outline-hidden w-auto">
                    <!-- Active: "bg-gray-100", Not Active: "" -->
                    <a href="/entry/leg/create/fa?{urlFormParam}" onclick={() => legsPopoverOpen = false} class="hover:bg-gray-50 dark:hover:bg-zinc-800 block px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white" role="menuitem" tabindex="-1" id="user-menu-item-1">From FlightAware</a>
                    <a href="/entry/leg/create/form?{urlFormParam}" onclick={() => legsPopoverOpen = false} class="hover:bg-gray-50 dark:hover:bg-zinc-800 block px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white" role="menuitem" tabindex="-1" id="user-menu-item-1">From Scratch</a>
                  </Popover.Content>
                </Popover.Root>
                <!-- <a href="/entry/leg/create/fa?{urlFormParam}" class="inline-flex items-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-sky-500 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">
                  <Plus class="-ml-0.5 mr-1.5 h-5 w-5" />
                  Create A New Leg
                </a> -->
              </div>
            {/if}
          </div>
        </div>
      {:else}

        {#if data.leg.originAirportId !== null && data.leg.destinationAirportId !== null && data.deckLeg !== null}
          <div class="relative h-[calc(100vh_-_260px_-_6rem_-_var(--nav-height)_-_1rem_+_2px)] md:h-[calc(100vh_-_276px_-_6rem_-_var(--nav-height)_-_1rem_+_2px)] flex bg-black">
            <Deck.Core padding={50} >
              <Deck.Airports airports={data.airportList} highlight={data.airportList.map((a) => a.id)} />
              <Deck.Leg leg={data.deckLeg}/>
                {#if latLong !== null}
                  <Deck.Widgets.GeoReferencedTooltip bind:position={latLong} hidden={latLong === null || (latLong[0] === 0 && latLong[1] === 0)} fade={false}>
                    <img src="/MapPin.svg" alt="Highlighted location" class="w-4 h-4"/>
                  </Deck.Widgets.GeoReferencedTooltip>
                {/if}
            </Deck.Core>
            {#if data.leg.positions.length === 0}
              <a href="/entry/leg/{data.leg.id}/upload-positions" class="absolute bottom-4 right-4 z-10 inline-flex gap-2 items-center justify-center border border-zinc-300 dark:border-zinc-950/50 bg-zinc-100/70 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 backdrop-blur-lg px-3 py-2 rounded-lg text-xxs uppercase">
                <span>Upload KLM</span>
                <Waypoints class="w-3 h-3" />
              </a>
            {:else}
              <a href="/entry/leg/{data.leg.id}/fullscreen?{tourDayInfo}" class="absolute group top-2 right-2 z-50">
                <Maximize class="w-5 h-5 dark:text-white group-hover:hidden" />
                <Fullscreen class="w-5 h-5 dark:text-white hidden group-hover:block" />
              </a>
            {/if}
          </div>
        {/if}

        {#if data.leg.flightAwareData !== null || data.leg.positions.length > 0}
          <div class="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-4 p-4 relative">
            <Card.Root class="col-span-1 xs:col-span-2 xl:col-span-4">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-semibold">Speed and Altitude</Card.Title>
                <Table2 class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content class="p-4 pt-0">
                {#key mapKey}
                  <div onmouseleave={() => latLong=[0, 0]} role="presentation" class="h-[104px]">
                    <VisXYContainer data={data.leg.positions} height="80" padding={{left: 5, right: 5, top: 5, bottom: 5}}>
                      <VisAxis gridLine={false} type="x" tickValues={data.tickValues} minMaxTicksOnly={false} {tickFormat} />
                      <VisCrosshair {template} color={crosshairColor} />
                      <VisTooltip verticalPlacement={'top'} horizontalPlacement={'right'} verticalShift={25} container={tooltipContainer} /> 
                      <VisLine {x} y={yAltitude} color={color({secondary: false})} />
                      <VisLine {x} y={ySpeed} color={color({secondary: true})} />
                      <VisBulletLegend items={[
                        { name: 'Altitude', color: color()() },
                        { name: 'Speed', color: color({ secondary: true })() },
                      ]} />
                    </VisXYContainer>
                  </div>
                {/key}
              </Card.Content>
            </Card.Root>

            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">FlightAware</Card.Title>
                <Link class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                {#if data.leg.flightAwareData !== null}
                  <a href={data.leg.flightAwareData.sourceLink} target="_blank">
                    {#if data.leg.flightAwareData.operator === null}
                      <div class="text-2xl font-bold">{data.leg.flightAwareData.registration}</div>
                      <p class="text-xs text-muted-foreground">International</p>
                    {:else}
                      <div class="text-2xl font-bold">{data.leg.flightAwareData.operator}{data.leg.flightAwareData.flightNumber}</div>
                      <p class="text-xs text-muted-foreground">{data.leg.flightAwareData.registration}</p>
                    {/if}
                  </a>
                {:else}
                  <div class="text-2xl font-bold">No Source</div>
                  <p class="text-xs text-muted-foreground">This leg does not have FlightAware data</p>
                {/if}
              </Card.Content>
            </Card.Root>

            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Flight Time</Card.Title>
                <Timer class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                {#if data.stats.time === null}
                  <div class="text-2xl font-bold">Unknown</div>
                {:else}
                  <div class="text-2xl font-bold">{data.stats.time.toFixed(1)} hr</div>
                  {#if totalTime !== null && !isNaN(parseFloat(totalTime))}
                    <p class="text-xs text-muted-foreground">= Total {Math.sign(parseFloat(totalTime) - data.stats.time) === 1 ? '-' : '+'} {Math.abs(parseFloat(totalTime) - data.stats.time).toFixed(1)} hr</p>
                  {/if}
                {/if}
              </Card.Content>
            </Card.Root>

            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Avg. Speed</Card.Title>
                <Gauge class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{data.stats.avgSpeed.toFixed(0)} kts</div>
                <p class="text-xs text-muted-foreground">Max {data.stats.maxSpeed.toFixed(0)} kts</p>
              </Card.Content>
            </Card.Root>

            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Distance</Card.Title>
                <Route class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{data.stats.distance.toFixed(0)} nmi</div>
                <p class="text-xs text-muted-foreground">{(data.stats.distance * 1.15).toFixed(0)} mi</p>
              </Card.Content>
            </Card.Root>
            {#if data.leg.day !== null}
              <a href="/entry/day/{data.leg.day.id}?tour={data.leg.day.tourId}&active=form" class="col-span-1 xs:col-span-2 xl:col-span-4 flex flex-row gap-3 items-center group cursor-pointer">
                <div class="bg-sky-500 p-1.5 rounded-full">
                  <CalendarDays class="w-4 h-4"/>
                </div>
                <div class="uppercase text-xs group-hover:underline underline-offset-2 decoration-2 decoration-sky-500">Go To Duty Day</div>
                <div class="grow"></div>
                <ChevronRight class="w-5 h-5" />
              </a>
            {/if}
          </div>
        {:else}
          {#if data.leg.day !== null}
            <div class="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-4 p-4 relative">
              <a href="/entry/day/{data.leg.day.id}?tour={data.leg.day.tourId}&active=form" class="col-span-1 xs:col-span-2 xl:col-span-4 flex flex-row gap-3 items-center group cursor-pointer">
                <div class="bg-sky-500 p-1.5 rounded-full">
                  <CalendarDays class="w-4 h-4"/>
                </div>
                <div class="uppercase text-xs group-hover:underline underline-offset-2 decoration-2 decoration-sky-500">Go To Duty Day</div>
                <div class="grow"></div>
                <ChevronRight class="w-5 h-5" />
              </a>
            </div>
          {/if}
        {/if}

        {#if data.entrySettings['entry.entryMXMode'] === true}

          <Section title="Leg Maintenance" collapsable={false} messageRight={true} error={formData !== null && formData.ok === false && formData.action === '?/mx' && formData.name === '*' ? formData.message : null}>
            <form action="?/deleteFA" method="post" enctype="multipart/form-data" class="p-4 flex flex-row gap-3 items-center">
              <button bind:this={submitFADelete} type="submit" class="hidden" aria-label="presentation"></button>
              <button onclick={faDelete} type="button" class="flex flex-row gap-3 items-center group">
                <div class="p-0 rounded-full text-red-500">
                  <CircleAlert class="w-7 h-7"/>
                </div>
                <div class="uppercase text-xs group-hover:underline underline-offset-2 decoration-2 decoration-red-500">Erase FlightAware Data</div>
              </button>
              <div class="grow"></div>
            </form>
            <form action="?/modifyDutyDay" method="post" enctype="multipart/form-data" class="flex flex-row gap-3 items-center">
              <Entry.Input title="Duty Day" name="dutyDayID" error={formData !== null && formData.ok === false && formData.action === '?/modifyDutyDay' ? formData.message : ''} uppercase={true} defaultValue={`${data.leg.dayId ?? ''}`} placeholder="Enter a Duty Day ID here" />
              <button type="submit" class="flex flex-row gap-3 items-center group px-2">
                <div class="uppercase text-xs group-hover:underline underline-offset-2 decoration-2 decoration-green-500">Apply</div>
                <div class="p-0 rounded-full text-green-500">
                  <ChevronRight class="w-7 h-7"/>
                </div>
              </button>
            </form>
            {#snippet message()}
                      <a  href="/settings/data" class="flex flex-row gap-3 items-center group">
                <div class="uppercase text-xs group-hover:underline underline-offset-2 decoration-2 decoration-sky-500">Modify Settings</div>
                <ChevronRight class="w-5 h-5" />
              </a>
                    {/snippet}
          </Section>
        {/if}

        <form id="form-update" action="?/update" method="post" enctype="multipart/form-data" use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            await update({ reset: false });
            submitting = false;
            preloadLegOverview();
            setTimeout(() => {
              if (formData?.ok !== false) {
                formManager.clearUID(false);
                resetApproaches();
              }
            }, 1);
          };
        }}>

          <Section title="General" error={formData !== null && formData.ok === false && formData.action === '?/default' && formData.name === '*' ? formData.message : null}>
            <Entry.Input title="Ident" name="ident" uppercase={true} defaultValue={data.leg.ident} placeholder={data.leg.aircraft.registration} />
            <Entry.AircraftPicker required={true} title="Aircraft" name="aircraft" aircraft={data.aircraft} bind:value={selectedAircraft} defaultValue={data.leg.aircraft.registration} />
            {#if data.leg.day === null}
              {#if data.leg.startTime_utc !== null}
                <Entry.TimePicker name="date" title="Date" defaultValue={dateToDateStringForm(data.leg.startTime_utc, true, 'utc')} dateOnly={true}/>
              {:else}
                <Entry.TimePicker name="date" title="Date" defaultValue={null} allowNullDefault={true} dateOnly={true}/>
              {/if}
            {:else}
              {#if data.leg.day !== null}
                <Entry.TimePicker name="date-placeholder-disabled" title="Date" disabled={true} defaultValue={dateToDateStringForm(data.leg.day.startTime_utc, true, 'utc')} dateOnly={true}/>
              {/if}
            {/if}
            <Entry.AirportPicker required={false} airports={data.airports} bind:tz={startAirportTZ} title="From" name="from" defaultValue={data.leg.originAirportId} />
            <Entry.AirportPicker required={false} airports={data.airports} bind:tz={endAirportTZ} title="To" name="to" bind:value={endApt} defaultValue={data.leg.destinationAirportId} />
            <Entry.AirportPicker required={false} airports={data.airports} bind:tz={divertAirportTZ} title="Divert" name="divert" bind:value={divertApt} defaultValue={data.leg.diversionAirportId} />
            <Entry.Input title="Route" name="route" disabled={true} uppercase={true} defaultValue={data.leg.route ?? data.leg.flightAwareData?.filedRoute ?? null} />
            <Entry.Ticker title="Passengers" name="pax" defaultValue={data.leg.passengers} />
          </Section>

          <Section title="Block Times">
            {#if useBlockRequired}
              <input type="hidden" name="use-block" value="true" />
            {:else}
              <Entry.Switch title="Use Block Times" name="use-block{useBlockRequired ? '-disabled' : ''}" tooltip={useBlockRequired ? 'Disabled because this leg must use block time (it is attached to a duty day).' : ''} disabled={useBlockRequired} bind:value={useBlock} defaultValue={data.leg.useBlock} />
            {/if}
            <!-- {/if} -->
            {#if useBlock || useBlockRequired}
              <Entry.TimePicker required={true} title="Out" name="out" bind:value={outTime} bind:tz={outTZ} bind:autoTZ={startAirportTZ} defaultValue={data.startTime} />
              <Entry.TimePicker required={true} title="In" name="in" bind:value={inTime} bind:tz={inTZ} autoTZ={outTZBind} defaultValue={data.endTime} />
              <Entry.FlightTime required={false} disabled={true} title="Calculated Total Time" name="calc-total-time" defaultValue={calcTotalTime} />
            {/if}
          </Section>

          <Section title="Times">
            <Entry.FlightTime required={true} title={selectedAircraftAPI === null || selectedAircraftAPI.simulator === false ? 'Total Time' : 'Simulated Flight'} name="total-time" autoFill={null} bind:value={totalTime} defaultValue={data.leg.totalTime} />
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
            <Entry.FlightTime title="Simulated Instrument" name="simulated-instrument-time" bind:autoFill={totalTime} defaultValue={data.leg.simulatedInstrument} />
            <Entry.Ticker title="Holds" name="holds" defaultValue={data.leg.holds} />
            {#key page.params.id}
              {#each approaches as approach (approach.id)}
                {#if approach.modified !== null}
                  <Entry.InstrumentApproach name={`approach`} id={approach.id} airports={data.airports} defaultAirport={endApt} defaultValue={null} value={approach.modified} onDelete={deleteApproach} />
                {:else}
                  <Entry.InstrumentApproach name={`approach`} id={approach.id} airports={data.airports} defaultAirport={endApt} defaultValue={approach.approach} value={null} onDelete={deleteApproach} />
                {/if}
              {/each}
            {/key}
            <Entry.Button title="Add Approach" focus={addApproach} />
          </Section>

          <Section title="Training & Other" collapsable={true} visible={(selectedAircraftAPI !== null && selectedAircraftAPI.simulator === true)}>
            <Entry.FlightTime title="Solo" name="solo-time" bind:autoFill={totalTime} defaultValue={data.leg.solo} />
            <Entry.FlightTime title="Dual Given" name="dual-given-time" bind:autoFill={totalTime} defaultValue={data.leg.dualGiven} />
            <Entry.FlightTime title="Dual Received" name="dual-received-time" bind:autoFill={totalTime} defaultValue={data.leg.dualReceived} />
            <Entry.Switch title="Crossing" name="crossing" defaultValue={data.leg.crossing} />
            <Entry.Switch title="Flight Review" name="flight-review" defaultValue={data.leg.flightReview} />
            <Entry.Switch title="Checkride" name="checkride" defaultValue={data.leg.checkride} />
            <Entry.Switch title="IPC" name="ipc" defaultValue={data.leg.ipc} />
            <Entry.Switch title="FAA 61.58" name="faa6158" defaultValue={data.leg.faa6158} />
          </Section>

          <Section title="Comments">
            <Entry.TextField name="comments" placeholder="Enter comments here" defaultValue={data.leg.notes} />
          </Section>
        </form>

        <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end bottom-0 z-10">
          {#if data.leg !== null}
            <form class="grow max-w-[33%] md:w-48 md:grow-0 flex items-start" action="?/delete" method="post" use:enhance={({ cancel }) => {
              const answer = confirm('Are you sure you want to delete this leg? This action cannot be undone.');
              if (!answer) cancel();
              else {
                deleting = true;
                return async ({ update }) => {
                  await update({ invalidateAll: true });
                  deleting = false;
                  preloadLegOverview();
                  setTimeout(() => {
                    if (formData?.ok !== false) formManager.clearUID(false);
                  }, 1);
                };
              }
            }}>
              <input type="hidden" name="id" value={data.leg.id} />
              {#if data.leg.day?.tourId !== undefined}
                <input type="hidden" name="tour" value={data.leg.day.tourId} />
              {/if}
              {#if data.leg.dayId !== null}
                <input type="hidden" name="day" value={data.leg.dayId} />
              {/if}
              <Submit class="w-full" failed={formData?.ok === false && formData.action === '?/delete'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
            </form>
          {/if}
          {#if $unsavedChanges}
            <button type="button" onclick={() => clearUID(true)} class="grow w-full md:w-48 md:grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
            <Submit remoteForm="form-update" class="grow w-full md:w-48 md:grow-0" failed={formData?.ok === false && (formData.action === '?/default' || formData?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Update" actionTextInProgress="Update" />
          {/if}
        </div>
      {/if}
    </div>
  {/snippet}

</TwoColumn>
