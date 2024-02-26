<script lang="ts">
	import {Activity, CreditCard, DollarSign, Plane, Table2, Users, Timer, Route, Gauge } from "lucide-svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import * as Tabs from "$lib/components/ui/tabs";
  import pluralize from 'pluralize';
  import { pad, weekDaysShort } from '$lib/helpers';
	import { DateRangePicker } from "$lib/components/ui/date-range-picker";
  import { VisXYContainer, VisLine, VisScatter, VisAxis, VisCrosshair, VisTooltip, VisArea } from "@unovis/svelte";
  import { Line, Scatter } from '@unovis/ts'
	import { color, scatterPointColors, scatterPointStrokeColors } from "$lib/components/ui/helpers";
  import { CalendarDate } from "@internationalized/date";
  import { page } from "$app/stores";
  import { afterNavigate, goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  import { Label } from "$lib/components/ui/label";
  import * as Popover from "$lib/components/ui/popover";

  export let data: import('./$types').PageData;

  // Calculate some details about the last tour
  const lastTourStart = (data.lastTour?.startTime_utc !== undefined ? new Date((data.lastTour.startTime_utc - 86400) * 1000) : null);
  const lastTourStartStr = lastTourStart === null ? null : lastTourStart.getFullYear() + '-' + pad(lastTourStart.getMonth() + 1, 2) + '-' + pad(lastTourStart.getDate() + 1, 2);
  const lastTourEnd = (data.lastTour?.endTime_utc !== undefined && data.lastTour?.endTime_utc !== null ? new Date((data.lastTour.endTime_utc + 86400) * 1000) : null);
  const lastTourEndStr = lastTourEnd === null ? null : lastTourEnd.getFullYear() + '-' + pad(lastTourEnd.getMonth() + 1, 2) + '-' + pad(lastTourEnd.getDate() + 1, 2);

  let dateRange: { start: CalendarDate | undefined, end: CalendarDate | undefined } | undefined = undefined;

  let currentPreset: string | null = 'lastTour'
  let presetOpen = false;

  let skipReact = false;

  afterNavigate(() => {

    // Get the start and end params
    let start: CalendarDate | null = null; // = $page.url.searchParams.get('start') === null ? lastTourStart : new Date(Date.UTC(($page.url.searchParams.get('start') as string).substring));
    let end: CalendarDate | null = null; // = $page.url.searchParams.get('end') === null ? lastTourEnd : new Date(Date.UTC(($page.url.searchParams.get('end') as string).substring));

    if ($page.url.searchParams.get('start') === null) {
      if (lastTourStart !== null) start = new CalendarDate(lastTourStart.getFullYear(), lastTourStart.getMonth() + 1, lastTourStart.getDate());
    } else {
      const s = $page.url.searchParams.get('start') as string;  // Eg: 2024-04-10
      start = new CalendarDate(parseInt(s.substring(0, 4)), parseInt(s.substring(5, 7)), parseInt(s.substring(8, 10)));
      console.log(start);
    }

    if ($page.url.searchParams.get('end') === null) {
      if (lastTourEnd !== null) end = new CalendarDate(lastTourEnd.getFullYear(), lastTourEnd.getMonth() + 1, lastTourEnd.getDate());
    } else {
      const s = $page.url.searchParams.get('end') as string;  // Eg: 2024-04-10
      end = new CalendarDate(parseInt(s.substring(0, 4)), parseInt(s.substring(5, 7)), parseInt(s.substring(8, 10)));
      console.log(end);
    }

    if ($page.url.searchParams.get('end') !== null && $page.url.searchParams.get('start') !== null) currentPreset = $page.url.searchParams.get('preset');
    else currentPreset = 'lastTour';


    // Initialize the date range object
    dateRange = undefined;

    // console.log(start, end);

    // If start and end are assigned, set the date range directly
    if (start !== null && end !== null) {
      skipReact = true;
      dateRange = { start, end };
      // console.log('After nav range', dateRange, start, end);
    }
  });

  // Update the data range when the range selector is updated
  const updateRange = () => {
    // Only goto if in the browser, not skipped, and the data range is valid
    if (browser && !skipReact && dateRange !== undefined && dateRange.start !== undefined && dateRange.end !== undefined && !(dateRange.start.toString() === lastTourStartStr && dateRange.end.toString() === lastTourEndStr)) {
      $page.url.searchParams.set('start', dateRange.start.toString());
      $page.url.searchParams.set('end', dateRange.end.toString());
      $page.url.searchParams.delete('preset');
      console.log('range', $page.url.pathname + '?' + $page.url.searchParams.toString());
      goto($page.url.pathname + '?' + $page.url.searchParams.toString(), { replaceState: false, noScroll: false, invalidateAll: true  });
    } else  if(dateRange !== undefined && dateRange.start !== undefined && dateRange.end !== undefined) {
      console.log(dateRange.start.toString(), dateRange.end.toString())
    }
    // Reset skip if it was active
    if (skipReact) skipReact = false;
  }
  $: {
    dateRange;
    // console.log('new Range', dateRange);
    updateRange();
  }

  const navigateNoRange = () => {
    skipReact = true;
    $page.url.searchParams.delete('start');
    $page.url.searchParams.delete('end');
    $page.url.searchParams.delete('preset');
    presetOpen = false;
    goto($page.url.pathname + '?' + $page.url.searchParams.toString(), { replaceState: false, noScroll: false, invalidateAll: true });
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
    $page.url.searchParams.set('start', startStr);
    $page.url.searchParams.set('end', endStr);
    $page.url.searchParams.set('preset', range);
    presetOpen = false;
    goto($page.url.pathname + '?' + $page.url.searchParams.toString(), { replaceState: false, noScroll: false, invalidateAll: true });
  }

  type DayStat = { id: number | null, index: number, dateString: string, onTour: boolean, startTime: number, flight: number | null, distance: number | null, duty: number | null };

	const x = (d: DayStat) => d.index;

  const tickFormat = (i: number) => {
    const d = data.dutyDays.statistics[i].startTime;
    if (d === undefined) return '';
    const date = new Date(d * 1000);
    return weekDaysShort[date.getDay()] + ' ' + pad(date.getMonth() + 1, 2) + '/' + pad(date.getDate(), 2);
  }

  let maxFlight = 0;
  let maxDuty = 0;
  for (const d of data.dutyDays.statistics) {
    if (d.flight !== null && d.flight > maxFlight) maxFlight = d.flight;
    if (d.duty !== null && d.duty > maxDuty) maxDuty = d.duty;
  }

  const yTourAreaDuty = (d: DayStat) => d.onTour === true ? maxDuty : 0;
  const yTourAreaFlight = (d: DayStat) => d.onTour === true ? maxFlight : 0;

	const yDist = (d: DayStat) => d.distance;
  const yFlight = (d: DayStat) => (d.flight ?? 0) / 60 / 60;
  const flightTemplate = (d: DayStat) => (d.flight ?? 0).toFixed(1) + ' hr<br/><span class="text-xs">' + tickFormat(d.index) + '</span>';
  const yDuty = (d: DayStat) => (d.duty ?? 0) / 60 / 60;
  const dutyTemplate = (d: DayStat) =>  ((d.duty ?? 0) / 60 / 60).toFixed(1) + ' hr<br/><span class="text-xs">' + tickFormat(d.index) + '</span>';


  const events = {
    [Scatter.selectors.point]: {
        click: (d: DayStat) => {
          console.log('click', d.id)
        },
    },
  }

</script>

<OneColumn>

  <div class="flex-col md:flex">
    <div class="flex-1 space-y-4 p-3 md:p-6 pt-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div class="flex flex-col md:flex-row items-start sm:items-center gap-4">
          <DateRangePicker bind:value={dateRange} highlights={data.dutyDays.highlightDates} />
          <Popover.Root portal={null} bind:open={presetOpen}>
            <Popover.Trigger asChild let:builder>
              <Button builders={[builder]} variant="outline">Presets</Button>
            </Popover.Trigger>
            <Popover.Content class="w-64 mt-2" collisionPadding={0} align="start">
              <div class="grid gap-4">
                <div class="space-y-2">
                  <h4 class="font-medium leading-none">Duration Presets</h4>
                  <p class="text-sm text-muted-foreground">
                    Select some common date ranges
                  </p>
                </div>
                <Button variant={currentPreset === 'lastTour' ? 'default' : 'outline'}  on:click={navigateNoRange} size="sm">
                  Last Tour
                </Button>
                <Button variant={currentPreset === 'currentMonth' ? 'default' : 'outline'} on:click={() => setRange('currentMonth')} size="sm">
                  Current Month
                </Button>
                <Button variant={currentPreset === 'lastMonth' ? 'default' : 'outline'} on:click={() => setRange('lastMonth')} size="sm">
                  Last Month
                </Button>
                <Button variant={currentPreset === 'ytd' ? 'default' : 'outline'} on:click={() => setRange('ytd')} size="sm">
                  Year to Date
                </Button>
                <Button variant={currentPreset === 'lastYear' ? 'default' : 'outline'} on:click={() => setRange('lastYear')} size="sm">
                  Last Year
                </Button>
                <Button variant={currentPreset === '12months' ? 'default' : 'outline'} on:click={() => setRange('12months')} size="sm">
                  Last 12 Months
                </Button>
              </div>
            </Popover.Content>
          </Popover.Root>
        </div>
      </div>
      <Tabs.Root value="overview" class="space-y-4">
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <!-- <Tabs.Trigger value="overview2">Overview</Tabs.Trigger> -->
        </Tabs.List>
        <Tabs.Content value="overview" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Average Duty Day</Card.Title>
                <Timer class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{(data.dutyDays.duration.avg / 60 / 60).toFixed(1)} hr <span class="text-sm text-muted-foreground">over</span> {pluralize('day', data.dutyDays.num, true)}</div>
                <p class="text-xs text-muted-foreground">Longest day was {(data.dutyDays.duration.longest / 60 / 60).toFixed(1)} hr</p>
              </Card.Content>
            </Card.Root>
            <Card.Root>
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-medium">Primary Aircraft</Card.Title>
                <Plane class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                {#if data.mostCommonAC.ac === null}
                  <div class="text-2xl font-bold">None</div>
                  <p class="text-xs text-muted-foreground">No aircraft activity during this window of time</p>
                {:else}
                  <div class="text-2xl font-bold">{data.mostCommonAC.ac.typeCode}</div>
                  <p class="text-xs text-muted-foreground">{data.mostCommonAC.ac.make} {data.mostCommonAC.ac.model} - {data.mostCommonAC.time.toFixed(1)} hr</p>
                {/if}
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
                <Card.Title class="text-sm font-medium">Average Groundspeed</Card.Title>
                <Gauge class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{data.groundSpeed.toFixed(0)} kts</div>
                <p class="text-xs text-muted-foreground">{((data.groundSpeed) * 1.15).toFixed(0)} mph</p>
              </Card.Content>
            </Card.Root>
          </div>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
            <Card.Root class="col-span-4">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-semibold">Flight Hours per Day</Card.Title>
                <Table2 class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content class="p-4 pt-0">
                <VisXYContainer data={data.dutyDays.statistics} height="80" padding={{left: 5, right: 5, top: 5, bottom: 5}}>
                  <VisAxis gridLine={false} type="x" minMaxTicksOnly={true} {tickFormat} />
                  <VisCrosshair template={flightTemplate}/>
                  <VisTooltip verticalPlacement={'top'}/>
                  <VisLine {x} y={yFlight} color={color()} />
                  <VisArea curveType="linear" {x} y={yTourAreaFlight} color={color('0.2')} excludeFromDomainCalculation={true} />
                  <!-- <VisScatter {x} y={yFlight} {events} cursor="pointer" size={6} color={scatterPointColors} strokeColor={scatterPointStrokeColors} strokeWidth={2} /> -->
                </VisXYContainer>
              </Card.Content>
            </Card.Root>
            <Card.Root class="col-span-4">
              <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Card.Title class="text-sm font-semibold">Duty Hours per Day</Card.Title>
                <Timer class="h-4 w-4 text-muted-foreground" />
              </Card.Header>
              <Card.Content class="p-4 pt-0">
                <VisXYContainer data={data.dutyDays.statistics} height="80" padding={{left: 5, right: 5, top: 5, bottom: 5}}>
                  <VisAxis gridLine={false} type="x" minMaxTicksOnly={true} {tickFormat} />
                  <VisCrosshair template={dutyTemplate}/>
                  <VisTooltip verticalPlacement={'top'}/>
                  <VisLine {x} y={yDuty} color={color()} />
                  <VisArea curveType="linear" {x} y={yTourAreaDuty} color={color('0.2')} excludeFromDomainCalculation={true} />
                  <!-- <VisScatter {x} y={yDuty} {events} cursor="pointer" size={6} color={scatterPointColors} strokeColor={scatterPointStrokeColors} strokeWidth={2} /> -->
                </VisXYContainer>
              </Card.Content>
            </Card.Root>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  </div>
</OneColumn>