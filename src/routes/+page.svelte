<script lang="ts">
	import {Plane, Plus, Table2, Timer, Route, Gauge, TowerControl, BedDouble, ChevronUp, ArrowRight } from "lucide-svelte";
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import * as Tabs from "$lib/components/ui/tabs";
  import * as Deck from '$lib/components/map/deck';
  import * as HoverCard from "$lib/components/ui/hover-card";
  import pluralize from 'pluralize';
  import { pad, weekDaysShort } from '$lib/helpers';
	import { DateRangePicker } from "$lib/components/ui/date-range-picker";
  import { v4 as uuidv4 } from 'uuid';
  import { VisXYContainer, VisLine, VisScatter, VisAxis, VisCrosshair, VisTooltip, VisArea, VisBulletLegend } from "@unovis/svelte";
	import { color, scatterPointColors, scatterPointStrokeColors } from "$lib/components/ui/helpers";
  import { RangeCalendar } from "$lib/components/ui/range-calendar";
  import { CalendarDate } from "@internationalized/date";
  import { page } from "$app/state";
  import { afterNavigate, goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  import * as Popover from "$lib/components/ui/popover";
  import AircraftHoverCard from "$lib/components/decorations/AircraftHoverCard.svelte";

  interface Props {
    data: import('./$types').PageData;
  }

  let { data = $bindable() }: Props = $props();

  // Calculate some details about the last tour
  const lastTourStart = (data.lastTour?.startTime_utc !== undefined ? new Date((data.lastTour.startTime_utc - 86400) * 1000) : new Date());
  const lastTourStartStr = lastTourStart === null ? null : lastTourStart.getFullYear() + '-' + pad(lastTourStart.getMonth() + 1, 2) + '-' + pad(lastTourStart.getDate() + 1, 2);
  const lastTourEnd = (data.lastTour?.endTime_utc !== undefined && data.lastTour?.endTime_utc !== null ? new Date((data.lastTour.endTime_utc + 86400) * 1000) : new Date((new Date()).getTime() + 86400 * 1000));
  const lastTourEndStr = lastTourEnd === null ? null : lastTourEnd.getFullYear() + '-' + pad(lastTourEnd.getMonth() + 1, 2) + '-' + pad(lastTourEnd.getDate() + 1, 2);

  let dateRange: { start: CalendarDate | undefined, end: CalendarDate | undefined } | undefined = $state(undefined);
  let dateRangePlaceholder: CalendarDate | undefined = $state(undefined);

  let currentPreset: string | null = $state('lastTour')
  let presetOpen = $state(false);

  let skipReact = false;


  const presetToString = (preset: string | null) => {
    switch(preset) {
      case 'currentMonth':
        return 'Current Month';
      case 'lastMonth':
        return 'Last Month';
      case 'ytd':
        return 'Year to Date';
      case 'lastYear':
        return 'Last Year';
      case '12months':
        return 'Last 12 Months';
      case null:
        return 'Presets';
      default:
        return 'Last Tour';
    } 
  }

  let presetAsString = $derived(presetToString(currentPreset));

  afterNavigate(() => {

    // Get the start and end params
    let start: CalendarDate | null = null; // = page.url.searchParams.get('start') === null ? lastTourStart : new Date(Date.UTC((page.url.searchParams.get('start') as string).substring));
    let end: CalendarDate | null = null; // = page.url.searchParams.get('end') === null ? lastTourEnd : new Date(Date.UTC((page.url.searchParams.get('end') as string).substring));

    if (page.url.searchParams.get('start') === null) {
      if (lastTourStart !== null) start = new CalendarDate(lastTourStart.getFullYear(), lastTourStart.getMonth() + 1, lastTourStart.getDate());
    } else {
      const s = page.url.searchParams.get('start') as string;  // Eg: 2024-04-10
      start = new CalendarDate(parseInt(s.substring(0, 4)), parseInt(s.substring(5, 7)), parseInt(s.substring(8, 10)));
    }

    if (page.url.searchParams.get('end') === null) {
      if (lastTourEnd !== null) end = new CalendarDate(lastTourEnd.getFullYear(), lastTourEnd.getMonth() + 1, lastTourEnd.getDate());
    } else {
      const s = page.url.searchParams.get('end') as string;  // Eg: 2024-04-10
      end = new CalendarDate(parseInt(s.substring(0, 4)), parseInt(s.substring(5, 7)), parseInt(s.substring(8, 10)));
    }

    if (page.url.searchParams.get('end') !== null && page.url.searchParams.get('start') !== null) currentPreset = page.url.searchParams.get('preset');
    else currentPreset = 'lastTour';


    // Initialize the date range object
    dateRange = undefined;


    // If start and end are assigned, set the date range directly
    if (start !== null && end !== null) {
      skipReact = true;
      dateRange = { start, end };
      dateRangePlaceholder = start;
    }

  });

  // Update the data range when the range selector is updated
  const updateRange = () => {
    // Only goto if in the browser, not skipped, and the data range is valid
    if (browser && !skipReact && dateRange !== undefined && dateRange.start !== undefined && dateRange.end !== undefined && !(dateRange.start.toString() === lastTourStartStr && dateRange.end.toString() === lastTourEndStr)) {
      page.url.searchParams.set('start', dateRange.start.toString());
      page.url.searchParams.set('end', dateRange.end.toString());
      page.url.searchParams.delete('preset');
      console.log('range', page.url.pathname + '?' + page.url.searchParams.toString());
      goto(page.url.pathname + '?' + page.url.searchParams.toString(), { replaceState: false, noScroll: false, invalidateAll: true  });
    } else  if(dateRange !== undefined && dateRange.start !== undefined && dateRange.end !== undefined) {
      console.log(dateRange.start.toString(), dateRange.end.toString())
    }
    // Reset skip if it was active
    if (skipReact) skipReact = false;
  }
  $effect(() => {
    dateRange;
    // console.log('new Range', dateRange);
    updateRange();
  });

  const navigateNoRange = () => {
    skipReact = true;
    page.url.searchParams.delete('start');
    page.url.searchParams.delete('end');
    page.url.searchParams.delete('preset');
    presetOpen = false;
    goto(page.url.pathname + '?' + page.url.searchParams.toString(), { replaceState: false, noScroll: false, invalidateAll: true });
  }

 const setRange = (range: 'currentMonth' | 'lastMonth' | 'ytd' | 'lastYear' | '12months') => {
    let startStr = '';
    let endStr = '';

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    switch(range) {
      case 'currentMonth':
        startStr = `${year}-${pad(month, 2)}-01`;
        endStr = `${year}-${pad(month, 2)}-${pad((new Date(Date.UTC(year, month, 0))).getUTCDate(), 2)}`;
        break;
      case 'lastMonth':
        let y = year;
        let m = month - 1;
        if (m <= 0) {
          m = 12;
          y--;
        }
        startStr = `${y}-${pad(m, 2)}-01`;
        endStr = `${y}-${pad(m, 2)}-${pad((new Date(Date.UTC(y, m, 0))).getUTCDate(), 2)}`;
        break;
      case 'ytd':
        startStr = `${year}-01-01`;
        endStr = `${year}-${pad(month, 2)}-${pad(day, 2)}`;
        break;
      case 'lastYear':
        startStr = `${year - 1}-01-01`;
        endStr = `${year - 1}-12-31`;
        break;
      case '12months':
        startStr = `${year-1}-${pad(month, 2)}-${pad(day, 2)}`;
        endStr = `${year}-${pad(month, 2)}-${pad(day, 2)}`;
        break;
    }

    skipReact = true;
    page.url.searchParams.set('start', startStr);
    page.url.searchParams.set('end', endStr);
    page.url.searchParams.set('preset', range);
    presetOpen = false;
    goto(page.url.pathname + '?' + page.url.searchParams.toString(), { replaceState: false, noScroll: false, invalidateAll: true });
  }

  type DayStat = { id: number | null, index: number, dateString: string, onTour: boolean, startTime: number, endTime: number, flight: number | null, sim: number | null, extendedDay: boolean, distance: number | null, duty: number | null };

	const x = (d: DayStat) => d.index;

  const tickFormat = (i: number) => {
    const day = data.dutyDays.statistics[i]; 
    const d = day.startTime;
    if (d === undefined) return '';
    const date = new Date(d * 1000);
    return weekDaysShort[date.getDay()] + ' ' + pad(date.getMonth() + 1, 2) + '/' + pad(date.getDate(), 2) + (day.extendedDay ? ' (Cont.)' : '');
  }

  let maxFlight = 0;
  let maxDuty = 0;
  for (const d of data.dutyDays.statistics) {
    if (d.flight !== null && d.flight > maxFlight) maxFlight = d.flight;
    if (d.duty !== null && d.duty > maxDuty) maxDuty = d.duty;
  }

  // console.log(data.dutyDays.statistics);

  const yTourAreaDuty = (d: DayStat) => d.onTour === true ? (maxDuty / 60 / 60) * 1000 : 0;
  const yTourAreaFlight = (d: DayStat) => d.onTour === true ? maxFlight * 1000 : 0;

	const yDist = (d: DayStat) => d.distance;
  const yFlight = (d: DayStat) => (d.flight ?? 0);
  const ySim = (d: DayStat) => (d.sim ?? 0);
  const flightTemplate = (d: DayStat) => (d.flight ?? 0).toFixed(1) + ' hr<br/><span class="text-xs">' + tickFormat(d.index) + '</span>';
  const dualTemplate = (d: DayStat) => ((d.duty ?? 0) / 60 / 60).toFixed(1) + ' hr Duty<br/>' + (d.flight ?? 0 > 0 ? (d.flight ?? 0).toFixed(1) + ' hr Flight<br/>' : '') + ((d.sim ?? 0) > 0 ? ((d.sim ?? 0).toFixed(1) + ' hr Sim<br/>') : '') + '<span class="text-xs">' + tickFormat(d.index) + '</span>';
  const yDuty = (d: DayStat) => (d.duty ?? 0) / 60 / 60;
  const dutyTemplate = (d: DayStat) =>  ((d.duty ?? 0) / 60 / 60).toFixed(1) + ' hr<br/><span class="text-xs">' + tickFormat(d.index) + '</span>';

  const crosshairColor = (d: DayStat, i: number) => [color()(),color({ secondary: true })()][i]

  let tooltipContainer: HTMLElement | undefined = $state(undefined);
  if (browser) tooltipContainer = document.body;

  const get = {
    to: (id: string) => data.legSummary[id].to,
    from: (id: string) => data.legSummary[id].from,
  }

  // const events = {
  //   [Scatter.selectors.point]: {
  //       click: (d: DayStat) => {
  //         console.log('click', d.id)
  //       },
  //   },
  // }


  const NUM_AC_VIS = 5;

  let flownAircraftKeys = $derived(data.acList.slice(-NUM_AC_VIS));
  let extraAircraftKeys = $derived(data.acList.slice(0, -NUM_AC_VIS));

  let moreAircraft = $derived(extraAircraftKeys.length > 0);

  let airportHighlight: string[] = $state([]);

  // setTimeout(() => {
  //   console.log('clear');
  //   airportHighlight = [];
  // }, 5000)

</script>

<OneColumn>

  <div class="flex-col md:flex ">
    <div class="flex-1 space-y-4 p-3 md:p-6 pt-6 h-full">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between space-y-2">
        <!-- <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2> -->
        <h2 class="text-3xl font-thin tracking-wide">Dashboard</h2>
        <div class="relative flex flex-col md:flex-row items-start sm:items-center gap-4">
          <div class="hidden md:inline-flex gap-1 items-center h-12">
            {#if moreAircraft}
              <HoverCard.Root>
                <HoverCard.Trigger class="-ml-4">
                  {#snippet child()}
                    <div class="w-12 h-12 bg-primary border-4 border-gray-100 dark:border-zinc-900 rounded-full flex justify-center items-center text-background">
                      <Plus class="h-4 w-4" />
                    </div>
                  {/snippet}
                </HoverCard.Trigger>
                <HoverCard.Content class="w-auto p-0 inline-flex bg-transparent border-0 -mt-0 pl-2">
                  {#each extraAircraftKeys as ac (ac.id)}
                    <AircraftHoverCard id={ac.id} reg={ac.reg} time={ac.time} />
                  {/each}
                </HoverCard.Content>
              </HoverCard.Root>
            {/if}
            {#each flownAircraftKeys as ac (ac.id)}
              <AircraftHoverCard id={ac.id} reg={ac.reg} time={ac.time} />
            {/each}
          </div>
          <DateRangePicker bind:value={dateRange} highlights={data.dutyDays.highlightDates} class="w-full sm:w-[300px]" />
          <div class="w-full sm:w-auto sm:absolute -bottom-14 right-0 ">
            <div class="flex flex-row items-center gap-2">
              <div class="hidden sm:block whitespace-nowrap">
                {pluralize('duty day', data.dutyDays.num, true)} <span class="text-sm text-muted-foreground">selected</span> 
              </div>
              <Popover.Root bind:open={presetOpen}>
                <Popover.Trigger class={buttonVariants({ variant: currentPreset === null ? 'outline' : 'default' })}>   
                  {presetAsString}
                </Popover.Trigger>
                <Popover.Content class="w-64 mt-2 animate-in animate-out" collisionPadding={0} align="end">
                  <div class="grid gap-4">
                    <div class="space-y-2">
                      <h4 class="font-medium leading-none">Duration Presets</h4>
                      <p class="text-sm text-muted-foreground">
                        Select some common date ranges
                      </p>
                    </div>
                    <Button variant={currentPreset === 'lastTour' ? 'default' : 'outline'}  onclick={navigateNoRange} size="sm">
                      Last Tour
                    </Button>
                    <Button variant={currentPreset === 'currentMonth' ? 'default' : 'outline'} onclick={() => setRange('currentMonth')} size="sm">
                      Current Month
                    </Button>
                    <Button variant={currentPreset === 'lastMonth' ? 'default' : 'outline'} onclick={() => setRange('lastMonth')} size="sm">
                      Last Month
                    </Button>
                    <Button variant={currentPreset === 'ytd' ? 'default' : 'outline'} onclick={() => setRange('ytd')} size="sm">
                      Year to Date
                    </Button>
                    <Button variant={currentPreset === 'lastYear' ? 'default' : 'outline'} onclick={() => setRange('lastYear')} size="sm">
                      Last Year
                    </Button>
                    <Button variant={currentPreset === '12months' ? 'default' : 'outline'} onclick={() => setRange('12months')} size="sm">
                      Last 12 Months
                    </Button>
                  </div>
                </Popover.Content>
              </Popover.Root>
            </div>
          </div>
        </div>
      </div>
      <Tabs.Root value="overview" class="space-y-4">
        <Tabs.List class="w-full sm:w-auto">
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="duty">Flight/Duty Time</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview" class="space-y-2 h-full">
          <div class="w-full px-2 sm:hidden gap-1 items-center h-12 grid justify-center place-items-center" style="grid-template-columns: repeat({Object.keys(data.acList).length}, minmax(0, 1fr));">
            {#each data.acList as ac (ac.id)}
              <AircraftHoverCard id={ac.id} time={ac.time} reg={ac.reg} compress={false} />
            {/each}
          </div>

          <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-4">

            <Card.Root class="row-span-3 sm:row-span-4 md:row-span-2 lg:col-span-2 lg:col-start-4 lg:row-start-1 xl:col-span-1 xl:col-start-4">
              <Card.Content class="p-0 border-0 ring-0">
                <RangeCalendar
                  bind:value={dateRange}
                  highlights={data.dutyDays.highlightDates}
                  numberOfMonths={1}
                  placeholder={dateRangePlaceholder}
                />
              </Card.Content>
            </Card.Root>

            <Card.Root class="">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Average Duty Day</Card.Title>
                <Timer class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{(data.dutyDays.duration.avg / 60 / 60).toFixed(1)} hr</div>
                <p class="text-xs text-muted-foreground">Longest day was {(data.dutyDays.duration.longest / 60 / 60).toFixed(1)} hr</p>
              </Card.Content>
            </Card.Root>

            <Card.Root class="lg:row-start-2">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Primary Aircraft</Card.Title>
                <Plane class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                {#if data.mostCommonAC.ac === null}
                  <div class="text-2xl font-bold">None</div>
                  <p class="text-xs text-muted-foreground">No aircraft activity during this window</p>
                {:else}
                  <a href="/aircraft/type/{data.mostCommonAC.ac.id}?active=form">
                    <div class="text-2xl font-bold">{data.mostCommonAC.ac.typeCode}</div>
                    <p class="text-xs text-muted-foreground">{data.mostCommonAC.ac.make} {data.mostCommonAC.ac.model} - {data.mostCommonAC.time.toFixed(1)} hr</p>
                  </a>
                {/if}
              </Card.Content>
            </Card.Root>

            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Average Rest</Card.Title>
                <BedDouble class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                {#if isNaN(data.rest.shortest)}
                  <div class="text-2xl font-bold">None</div>
                  <p class="text-xs text-muted-foreground">No rest during this window</p>
                {:else}
                  <div class="text-2xl font-bold">{(data.rest.avg / 60 / 60).toFixed(1)} hr</div>
                  <p class="text-xs text-muted-foreground">Shortest rest was {(data.rest.shortest / 60 / 60).toFixed(1)} hr</p>
                {/if}
              </Card.Content>
            </Card.Root>

            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Unique Airports</Card.Title>
                <TowerControl class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="inline-flex items-end gap-2">
                  <span class="text-2xl font-bold">{data.airports.length}</span>
                  <span class="text-xs text-muted-foreground font-normal pb-1">{data.operations} operations</span>
                </div>
                <p class="text-xs text-muted-foreground inline-flex items-center gap-1 w-full overflow-hidden whitespace-nowrap">
                  <span class="inline-flex text-lg select-none overflow-x-scroll">
                    {#each data.countries as country}
                      <span title={country.name + ', ' + country.count + (country.count === 1 ? ' airport' : ' airports')}>{country.emoji}</span>
                    {/each}
                  </span>
                </p>
              </Card.Content>
            </Card.Root>

            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Total Distance</Card.Title>
                <Route class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{data.miles.toFixed(0)} nmi</div>
                <p class="text-xs text-muted-foreground">{((data.miles) * 1.15).toFixed(0)} mi</p>
              </Card.Content>
            </Card.Root>

            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Average Speed</Card.Title>
                <Gauge class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{data.groundSpeed.toFixed(0)} kts</div>
                <p class="text-xs text-muted-foreground">{((data.groundSpeed) * 1.15).toFixed(0)} mph</p>
              </Card.Content>
            </Card.Root>
          </div>
          <div class="grid gap-2 grid-cols-5 xl:grid-cols-4">
            <Card.Root class="col-span-5 lg:col-span-3 xl:col-span-3">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-semibold">Flight & Duty Hours</Card.Title>
                <Table2 class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content class="p-4 pt-0">
                <VisXYContainer data={data.dutyDays.statistics} height="80" padding={{left: 5, right: 5, top: 5, bottom: 5}} yDomainMinConstraint={[0,0]}>
                  <VisAxis gridLine={false} type="x" minMaxTicksOnly={true} {tickFormat} />
                  <VisCrosshair template={dualTemplate} color={crosshairColor}/>
                  <VisTooltip verticalPlacement={'top'} horizontalPlacement={'right'} verticalShift={25} container={tooltipContainer} />
                  <VisArea curveType="linear" {x} y={yTourAreaFlight} color={color({ opacity: '0.2'})} excludeFromDomainCalculation={true} />
                  {#if data.containsSimTime}
                    <VisLine {x} y={ySim} color={color({secondary: false, accent: true})} lineDashArray={[5]} />
                  {/if}
                  <VisLine {x} y={yFlight} color={color({secondary: false})} />
                  <VisLine {x} y={yDuty} color={color({ secondary: true })} />
                  <VisBulletLegend items={[
                    { name: 'Duty', color: color({ secondary: true })() },
                    { name: 'Flight', color: color()() },
                    { name: 'Sim', color: color({ accent: true })() },
                  ]} />
                  <!-- <VisScatter {x} y={yFlight} cursor="pointer" size={6} color={scatterPointColors} strokeColor={scatterPointStrokeColors} strokeWidth={2} /> -->
                </VisXYContainer>
              </Card.Content>
            </Card.Root>
            <Card.Root class="col-span-5 lg:col-span-2 xl:col-span-1">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Flight & Duty Hours Summed</Card.Title>
                <Timer class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{data.times.period.flight.toFixed(1)} hr <span class="text-sm text-foreground/50">over</span> {pluralize('day', data.dutyDays.num, true)} <span class="text-sm text-muted-foreground"></span></div>
                <p class="text-xs text-muted-foreground">{data.times.period.duty.toFixed(1)} duty hours
                  {#if data.times.period.duty !== 0}
                    - {(data.times.period.flight / data.times.period.duty * 100).toFixed(1)}% utilization
                  {/if}
                </p>
              </Card.Content>
            </Card.Root>
          </div>
          <Card.Root class="-mb-3 h-[calc(100vh-var(--nav-height)-2rem)] md:h-[calc(100vh-var(--nav-height)-3rem)] relative z-1 transition-all overflow-hidden">
            <Card.Content class="p-0 relative h-full flex">
              <Deck.Core padding={50}  >
                <Deck.Airports airports={data.visitedAirports} highlight={airportHighlight}/>
                <Deck.Legs legs={data.deckSegments} autoHighlight={true} pickable={true} onclick={(id: string) => { goto(`/entry/leg/${id}?active=form`)}}  >
                  <!-- onhover={(id) => {
                  if (id === null) airportHighlight = [];
                  else {
                    const h = [get.from(id), get.to(id)];
                    if (airportHighlight[0] !== h[0] || airportHighlight[1] !== h[1]) airportHighlight = [get.from(id), get.to(id)];
                  }
                }} -->
                  {#snippet tooltip(id)}
                    <div class="translate-x-3 translate-y-2 whitespace-nowrap flex flex-row gap-1 items-center py-1 px-2 rounded-lg bg-zinc-100/70 border border-zinc-200 dark:bg-zinc-900/70 dark:border-zinc-950/50 backdrop-blur-sm text-xxs">
                      {get.from(id)}
                      <ArrowRight class="w-3 h-3" />
                      {get.to(id)}
                    </div>
                  {/snippet}
                </Deck.Legs>
              </Deck.Core>
            </Card.Content>
          </Card.Root>
        </Tabs.Content>
        <Tabs.Content value="duty" class="space-y-2">
          <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Average Duty Day</Card.Title>
                <Timer class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{(data.dutyDays.duration.avg / 60 / 60).toFixed(1)} hr</div>
                <p class="text-xs text-muted-foreground">Longest day was {(data.dutyDays.duration.longest / 60 / 60).toFixed(1)} hr</p>
              </Card.Content>
            </Card.Root>
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Flight-Duty Ratio</Card.Title>
                <Timer class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                {#if data.dutyDays.ratio.sum.duty === 0}
                  <div class="text-2xl font-bold">Unknown</div>
                  <p class="text-xs text-muted-foreground">No duty during this window</p>
                {:else}
                  <div class="text-2xl font-bold">{(data.dutyDays.ratio.sum.flight / data.dutyDays.ratio.sum.duty * 100).toFixed(0)}%</div>
                  <p class="text-xs text-muted-foreground">Best day was {(data.dutyDays.ratio.best * 100).toFixed(0)}%</p>
                {/if}
              </Card.Content>
            </Card.Root>
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Flight Time in 7 days</Card.Title>
                <Timer class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{(data.times.seven).toFixed(1)} hr</div>
                <p class="text-xs text-muted-foreground">{(data.times.seven / 7).toFixed(1)} hr / day avg.</p>
              </Card.Content>
            </Card.Root>
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Flight Time in 30 days</Card.Title>
                <Timer class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{(data.times.thirty).toFixed(1)} hr</div>
                <p class="text-xs text-muted-foreground">{(data.times.thirty / 7).toFixed(1)} hr / day avg.</p>
              </Card.Content>
            </Card.Root>
          </div>
          <div class="grid gap-4 grid-cols-8">
            <Card.Root class="col-span-8 lg:col-span-8">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-semibold">Flight and Duty Hours</Card.Title>
                <Table2 class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content class="p-4 pt-0">
                <VisXYContainer data={data.dutyDays.statistics} height="80" padding={{left: 5, right: 5, top: 5, bottom: 5}}>
                  <VisAxis gridLine={false} type="x" minMaxTicksOnly={true} {tickFormat} />
                  <VisCrosshair template={dualTemplate} color={crosshairColor}/>
                  <VisTooltip verticalPlacement={'top'} horizontalPlacement={'right'} verticalShift={25} container={tooltipContainer}/>
                  <VisLine {x} y={yFlight} color={color({secondary: false})} />
                  <VisLine {x} y={yDuty} color={color({ secondary: true })} />
                  <!-- <VisArea curveType="linear" {x} y={yTourAreaFlight} color={color('0.2')} excludeFromDomainCalculation={true} /> -->
                  <!-- <VisScatter {x} y={yFlight} {events} cursor="pointer" size={6} color={scatterPointColors} strokeColor={scatterPointStrokeColors} strokeWidth={2} /> -->
                  <VisBulletLegend items={[
                    { name: 'Flight', color: color()() },
                    { name: 'Duty', color: color({ secondary: true })() },
                  ]} />
                </VisXYContainer>
              </Card.Content>
            </Card.Root>
          </div>
        </Tabs.Content>
      </Tabs.Root>
      
    </div>
  </div>

</OneColumn>