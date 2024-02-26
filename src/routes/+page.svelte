<!-- <script lang="ts">
  import { Calendar } from "$lib/components/calendar";
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  import Stats from '$lib/components/decorations/Stats.svelte';
  import { Calendar as Cal } from "$lib/components/ui/calendar";
  import { today, getLocalTimeZone } from "@internationalized/date";
 
  let value = today(getLocalTimeZone());

  export let data: import('./$types').PageData;

</script>
<OneColumn>
  <Stats values={[
    {title: 'Total Legs', value: data.numLegs.toFixed(0)},
    {title: 'Avg. Leg Length', value: data.avgLegLength.toFixed(1) + ' hr'},
    {title: 'Total Tours', value: data.numTours.toFixed(0)},
    {title: 'Avg. Duty Day', value: (data.avgDutyDayLength / 60 / 60).toFixed(1) + ' hr'}
  ]}/>
  <div class="flex items-center justify-center w-full mt-4">
    <div class="max-w-96 w-full">
      <Calendar />
    </div>
  </div>
  
  <div>
    <div class="w-auto">
      <Cal bind:value class="w-72 rounded-md border" />
    </div>
  </div>
</OneColumn> -->

<script lang="ts">
	import {Activity, CreditCard, DollarSign, Plane, Table2, Users } from "lucide-svelte";
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

  export let data: import('./$types').PageData;

  // console.log(data.lastTour.startTime_utc)

  // Calculate some details about the last tour
  const lastTourStart = (data.lastTour?.startTime_utc !== undefined ? new Date(data.lastTour.startTime_utc * 1000) : null);
  const lastTourStartStr = lastTourStart === null ? null : lastTourStart.getFullYear() + '-' + pad(lastTourStart.getMonth() + 1, 2) + '-' + pad(lastTourStart.getDate(), 2);
  const lastTourEnd = (data.lastTour?.endTime_utc !== undefined && data.lastTour?.endTime_utc !== null ? new Date(data.lastTour.endTime_utc * 1000) : null);
  const lastTourEndStr = lastTourEnd === null ? null : lastTourEnd.getFullYear() + '-' + pad(lastTourEnd.getMonth() + 1, 2) + '-' + pad(lastTourEnd.getDate(), 2);

  let dateRange: { start: CalendarDate | undefined, end: CalendarDate | undefined } | undefined = undefined;

  let skipReact = false;

  afterNavigate(() => {

    // Get the start and end params
    let start = $page.url.searchParams.get('start') === null ? lastTourStart : new Date($page.url.searchParams.get('start') as string);
    let end = $page.url.searchParams.get('end') === null ? lastTourEnd : new Date($page.url.searchParams.get('end') as string);

    // Initialize the date range object
    dateRange = undefined;

    // If start and end are assigned, set the date range directly
    if (start !== null && end !== null) {
      skipReact = true;
      dateRange = {
        start: new CalendarDate(start.getFullYear(), start.getMonth() + 1, start.getDate() + 1),
        end: new CalendarDate(end.getFullYear(), end.getMonth() + 1, end.getDate() + 1)
      }
      console.log(dateRange);
    }
  });

  // Update the data range when the range selector is updated
  const updateRange = () => {
    // Only goto if in the browser, not skipped, and the data range is valid
    if (browser && !skipReact && dateRange !== undefined && dateRange.start !== undefined && dateRange.end !== undefined && !(dateRange.start.toString() === lastTourStartStr && dateRange.end.toString() === lastTourEndStr)) {
      $page.url.searchParams.set('start', dateRange.start.toString());
      $page.url.searchParams.set('end', dateRange.end.toString());
      goto($page.url.pathname + '?' + $page.url.searchParams.toString(), { replaceState: false, noScroll: false, invalidateAll: true  });
    }
    // Reset skip if it was active
    if (skipReact) skipReact = false;
  }
  $: {
    dateRange;
    updateRange();
  }

  const navigateNoRange = () => {
    skipReact = true;
    $page.url.searchParams.delete('start');
    $page.url.searchParams.delete('end');
    console.log($page.url.pathname + '?' + $page.url.searchParams.toString());
    goto($page.url.pathname + '?' + $page.url.searchParams.toString(), { replaceState: false, noScroll: false, invalidateAll: true });
  }

  type DayStat = { id: number, startTime: number, flight: number, distance: number, duty: number };


	// const d = [
	// 	{ id: 1, revenue: 10400 },
	// 	{ id: 2, revenue: 14405 },
	// 	{ id: 3, revenue: 9400 },
	// 	{ id: 4, revenue: 8200 },
	// 	{ id: 5, revenue: 7000 },
	// 	{ id: 6, revenue: 9600 },
	// 	{ id: 7, revenue: 11244 },
	// 	{ id: 8, revenue: 26475 },
	// ];
	const x = (d: DayStat) => d.startTime;

  const tickFormat = (d: number) => {
    const date = new Date(d * 1000);
    return weekDaysShort[date.getDay()] + ' ' + pad(date.getMonth() + 1, 2) + '/' + pad(date.getDate(), 2);
  }

  let maxFlight = 0;
  let maxDuty = 0;
  if (data.async.data !== null) {
    for (const d of data.async.data.dutyDays.statistics) {
      if (d.flight !== null && d.flight > maxFlight) maxFlight = d.flight;
      if (d.duty !== null && d.duty > maxDuty) maxDuty = d.duty;
    }
  }

  const yTourAreaDuty = (d: DayStat) => d.duty !== null ? maxDuty : 0;
  const yTourAreaFlight = (d: DayStat) => d.duty !== null ? maxFlight : 0;

	const yDist = (d: DayStat) => d.distance;
  const yFlight = (d: DayStat) => d.flight / 60 / 60;
  console.log(data.async.data?.dutyDays.statistics);
  const flightTemplate = (d: DayStat) => tickFormat(d.startTime) + ' | ' + (d.flight / 60 / 60).toFixed(1) + ' hr';
  const yDuty = (d: DayStat) => d.duty / 60 / 60;
  const dutyTemplate = (d: DayStat) => tickFormat(d.startTime) + ' | ' + (d.duty / 60 / 60).toFixed(1) + ' hr';


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
    <div class="flex-1 space-y-4 p-8 pt-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div class="flex items-center space-x-2">
          <DateRangePicker bind:value={dateRange} />
          <Button on:click={navigateNoRange} size="sm">
            <Plane class="mr-2 h-4 w-4" />
            Last Tour
          </Button>
          <!-- <Button size="sm">
            <Table2 class="mr-2 h-4 w-4" />
            Logbook
          </Button> -->
        </div>
      </div>
      <Tabs.Root value="overview" class="space-y-4">
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <!-- <Tabs.Trigger value="overview2">Overview</Tabs.Trigger> -->
        </Tabs.List>
        <Tabs.Content value="overview" class="space-y-4">
          {#if data.async.data !== null}
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card.Root>
                <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Card.Title class="text-sm font-medium">Average Duty Day</Card.Title>
                  <Activity class="h-4 w-4 text-muted-foreground" />
                </Card.Header>
                <Card.Content>
                  <div class="text-2xl font-bold">{(data.async.data.dutyDays.duration.avg / 60 / 60).toFixed(1)} hr <span class="text-sm text-muted-foreground">over</span> {pluralize('day', data.async.data.dutyDays.num, true)}</div>
                  <p class="text-xs text-muted-foreground">Longest day was {(data.async.data.dutyDays.duration.longest / 60 / 60).toFixed(1)} hr</p>
                </Card.Content>
              </Card.Root>
              <Card.Root>
                <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Card.Title class="text-sm font-medium">Primary Aircraft</Card.Title>
                  <CreditCard class="h-4 w-4 text-muted-foreground" />
                </Card.Header>
                <Card.Content>
                  {#if data.async.data.mostCommonAC.ac === null}
                    <div class="text-2xl font-bold">None</div>
                    <p class="text-xs text-muted-foreground">No aircraft activity during this window of time</p>
                  {:else}
                    <div class="text-2xl font-bold">{data.async.data.mostCommonAC.ac.typeCode}</div>
                    <p class="text-xs text-muted-foreground">{data.async.data.mostCommonAC.ac.make} {data.async.data.mostCommonAC.ac.model} - {data.async.data.mostCommonAC.time.toFixed(1)} hr</p>
                  {/if}
                </Card.Content>
              </Card.Root>
              <Card.Root>
                <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Card.Title class="text-sm font-medium">Total Distance</Card.Title>
                  <DollarSign class="h-4 w-4 text-muted-foreground" />
                </Card.Header>
                <Card.Content>
                  <div class="text-2xl font-bold">{data.async.data.miles.toFixed(0)} nmi</div>
                  <p class="text-xs text-muted-foreground">{((data.async.data.miles) * 1.15).toFixed(0)} mi</p>
                </Card.Content>
              </Card.Root>
              <Card.Root>
                <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Card.Title class="text-sm font-medium">Average Groundspeed</Card.Title>
                  <Users class="h-4 w-4 text-muted-foreground" />
                </Card.Header>
                <Card.Content>
                  <div class="text-2xl font-bold">{data.async.data.groundSpeed.toFixed(0)} kts</div>
                  <p class="text-xs text-muted-foreground">{((data.async.data.groundSpeed) * 1.15).toFixed(0)} mph</p>
                </Card.Content>
              </Card.Root>
            </div>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
              <Card.Root class="col-span-4">
                <Card.Header>
                  <Card.Title>Flight Hours per Day</Card.Title>
                </Card.Header>
                <Card.Content class="p-4 pt-0">
                  <VisXYContainer data={data.async.data.dutyDays.statistics} height="80" padding={{left: 5, right: 5, top: 5, bottom: 5}}>
                    <VisAxis gridLine={false} type="x" {tickFormat} minMaxTicksOnly={false} />
                    <VisCrosshair template={flightTemplate}/>
                    <VisTooltip/>
                    <VisLine {x} y={yFlight} color={color()} />
                    <VisArea curveType="basis" {x} y={yTourAreaFlight} color={color('0.2')} excludeFromDomainCalculation={true} />
                    <!-- <VisScatter {x} y={yFlight} {events} cursor="pointer" size={6} color={scatterPointColors} strokeColor={scatterPointStrokeColors} strokeWidth={2} /> -->
                  </VisXYContainer>
                </Card.Content>
              </Card.Root>
              <Card.Root class="col-span-4">
                <Card.Header>
                  <Card.Title>Duty Hours per Day</Card.Title>
                </Card.Header>
                <Card.Content class="p-4 pt-0">
                  <VisXYContainer data={data.async.data.dutyDays.statistics} height="80" padding={{left: 5, right: 5, top: 5, bottom: 5}}>
                    <VisAxis gridLine={false} type="x" {tickFormat} minMaxTicksOnly={false} />
                    <VisCrosshair template={dutyTemplate}/>
                    <VisTooltip/>
                    <VisLine {x} y={yDuty} color={color()} />
                    <VisArea curveType="basis" {x} y={yTourAreaDuty} color={color('0.2')} excludeFromDomainCalculation={true} />
                    <!-- <VisScatter {x} y={yDuty} {events} cursor="pointer" size={6} color={scatterPointColors} strokeColor={scatterPointStrokeColors} strokeWidth={2} /> -->
                  </VisXYContainer>
                </Card.Content>
              </Card.Root>
            </div>
          {/if}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  </div>
</OneColumn>