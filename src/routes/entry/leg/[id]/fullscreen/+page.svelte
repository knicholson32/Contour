<script lang="ts">
  import * as Map from '$lib/components/map';
  import { page } from '$app/state';
  import * as Card from "$lib/components/ui/card";
  import { afterNavigate, beforeNavigate} from '$app/navigation';
  import type * as Types from '@prisma/client';
  import { DB } from '$lib/types';
  import { pad } from '$lib/helpers';
  import { v4 as uuidv4 } from 'uuid';
  import { browser } from '$app/environment';
  import { Minimize, Route, Table2 } from 'lucide-svelte';
  import { VisXYContainer, VisLine, VisAxis, VisCrosshair, VisTooltip, VisBulletLegend } from "@unovis/svelte";
	import { color } from "$lib/components/ui/helpers";
  import Tooltip from '$lib/components/routeSpecific/leg/Tooltip.svelte';
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import MenuSection from '$lib/components/menuForm/MenuSection.svelte';
  import MenuElement from '$lib/components/menuForm/MenuElement.svelte';
  import LegEntry from '$lib/components/routeSpecific/leg/LegEntry.svelte';

  interface Props {
    form: import('./$types').ActionData;
    data: import('./$types').PageData;
  }

  let { form: formData, data }: Props = $props();


  let mapKey = uuidv4();
  const resetMap = () => {
    // mapKey = uuidv4();
    // latLong = null;
  }

  $effect(() => {
    formData;
    data;
    resetMap();
  });

  let menuElements: { [key: string]: HTMLAnchorElement } = $state({});

  beforeNavigate(() => {
    menuElements = {};
  });


  let scrollToDiv: HTMLAnchorElement | null = $state(null);

  afterNavigate(() => {
    if (data.leg === null) scrollToDiv = null;
    else {
      if (data.leg.id in menuElements) scrollToDiv = menuElements[data.leg.id];
      else scrollToDiv = null;
    }
  });



  // @see https://stackoverflow.com/a/22480938/5441886
  const isScrolledIntoView = (el: HTMLElement) => {
    let rect = el.getBoundingClientRect();
    let elemTop = rect.top;
    let elemBottom = rect.bottom;

    // Only completely visible elements return true:
    let isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
    // Partially visible elements return true:
    //isVisible = elemTop < window.innerHeight && elemBottom >= 0;
    return isVisible;
  }

  // Scroll to the proper div
  const scrollTo = (div: HTMLAnchorElement | HTMLDivElement | null) => {
    if (div === null) return;
    if (!isScrolledIntoView(div)) {
      div.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  $effect(() => {
    scrollTo(scrollToDiv);
  });


  const tickFormat = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return pad(date.getUTCHours(), 2) + ':' + pad(date.getUTCMinutes(), 2);
  }

  // let speedScaler = 1;

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

  let tourDayInfo = $state('');
  const updateTourDayInfo = (params: {dayId: number | null, tourId: number | null}) => {
    // $: tourDayInfo = data.searchParams.dayId === null ;
    if (params.dayId === null && params.tourId === null) tourDayInfo = '';
    else if (params.dayId !== null && params.tourId !== null) tourDayInfo = `day=${params.dayId}&tour=${params.tourId}`;
    else if (params.dayId !== null) tourDayInfo = `day=${params.dayId}`;
    else tourDayInfo = `tour=${params.tourId}`;
    const search = page.url.searchParams.get('search');
    if (search !== null && search !== '') {
      if (tourDayInfo === '') tourDayInfo = 'search=' + search;
      else tourDayInfo = tourDayInfo + '&search=' + search;
    }
  }

  $effect(() => {
    updateTourDayInfo(data.searchParams);
  });

  let center = $state((animate?: boolean) => {});

  let innerWidth: number = $state(0);
  let paddingTopLeft: [number, number] = $state([40, 40]);
  let paddingBottomRight: [number, number] = $state([40, 40]);


  $effect(() => {
    if (innerWidth < 768) {
      paddingTopLeft = [40, 40];
      paddingBottomRight = [40, 40];
    } else {
      paddingTopLeft = [275, 20];
      paddingBottomRight = [50, 225];
    }
    center();
  });

</script>

<svelte:window bind:innerWidth />

<div class="hidden">
  <Tooltip bind:el={tooltip} bind:position />
</div>

<OneColumn>
  
  <div class="flex-shrink relative">
    <div class="fixed top-0 bottom-0 left-0 right-0 z-40">
      {#key mapKey}
        <Map.Fullscreen bind:center={center} bind:paddingBottomRight bind:paddingTopLeft positions={data.leg.positions} fixes={data.leg.fixes} airports={data.airportList} target={latLong}>
          <a title="Exit full screen" href="/entry/leg/{data.leg.id}?active=form&{tourDayInfo}" class="absolute group top-2 right-2 z-50 w-5 h-5 inline-flex items-center justify-center">
            <Minimize class="w-5 h-5 dark:text-white group-hover:w-4 group-hover:h-4 transition-all" />
          </a>
          <button onclick={() => { center(true); }} title="Center on route" type="button" class="absolute group top-9 right-2 z-50 w-5 h-5 inline-flex items-center justify-center">
            <Route class="w-5 h-5 dark:text-white group-hover:w-4 group-hover:h-4 transition-all" />
          </button>
        </Map.Fullscreen>
      {/key}

      <!-- <div class="absolute z-[100] bottom-0 top-0 left-0 right-0 p-4 flex flex-row gap-2"> -->
        <div class="absolute left-4 top-4 bottom-4 z-50 w-[240px] backdrop-blur-sm rounded-xl border bg-white/70 border-gray-200 dark:bg-zinc-900/70 dark:border-zinc-800 p-0 overflow-hidden hidden md:flex">
          <div class="overflow-y-scroll overflow-x-hidden -mr-[1px] w-[240px]" style="scrollbar-width:none">
            <div class="-mt-[2px]">
              {#each data.legs as group,i (group.text)}
                <MenuSection title={group.text}>
                  {#each group.entries as leg, i (leg.id)}
                    <MenuElement bind:element={menuElements[leg.id]} href="/entry/leg/{leg.id}/fullscreen?{tourDayInfo}" selected={leg.id === data.params.id}>
                      <LegEntry leg={leg} unsaved={false} />
                    </MenuElement>
                  {/each}
                </MenuSection>
              {/each}
            </div>
          </div>
        </div>

        <Card.Root class="absolute right-4 bottom-4 w-[calc(100%-240px-1rem-1rem-1rem)] z-50 backdrop-blur-sm bg-white/70 dark:bg-zinc-900/70 hidden md:block">
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-semibold">Speed and Altitude</Card.Title>
            <Table2 class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content class="p-4 pt-0">
            <div onmouseleave={() => latLong=[0, 0]} role="presentation">
              <VisXYContainer class="" data={data.leg.positions} height="80" padding={{left: 5, right: 5, top: 5, bottom: 5}}>
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
          </Card.Content>
        </Card.Root>


      <!-- </div> -->
    </div>


  </div>

</OneColumn>
