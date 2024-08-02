<script lang='ts'>
    import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
    import * as Tabs from "$lib/components/ui/tabs";
    import * as Card from "$lib/components/ui/card";
    import { BedDouble, Gauge, Plane, Route, Table2, Timer, TowerControl } from "lucide-svelte";


</script>

<OneColumn>

  <div class="flex-1 space-y-4 p-3 md:p-6 pt-6">

    <!-- <div class="w-full px-2 sm:hidden gap-1 items-center h-12 grid justify-center place-items-center" style="grid-template-columns: repeat({Object.keys(data.acList).length}, minmax(0, 1fr));">
      {#each data.acList as ac (ac.id)}
        <AircraftHoverCard id={ac.id} time={ac.time} compress={false} />
      {/each}
    </div> -->

    <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-4">

      <Card.Root class="row-span-3 sm:row-span-4 md:row-span-2 lg:col-span-2 lg:col-start-4 lg:row-start-1 xl:col-span-1 xl:col-start-4">
        <Card.Content class="p-0 border-0 ring-0">
          <!-- <RangeCalendar
            bind:value={dateRange}
            bind:highlights={data.dutyDays.highlightDates}
            numberOfMonths={1}
            placeholder={dateRange?.start}
          /> -->
          Calendar
        </Card.Content>
      </Card.Root>

      <Card.Root class="">
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Average Duty Day</Card.Title>
          <Timer class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <!-- <div class="text-2xl font-bold">{(data.dutyDays.duration.avg / 60 / 60).toFixed(1)} hr</div>
          <p class="text-xs text-muted-foreground">Longest day was {(data.dutyDays.duration.longest / 60 / 60).toFixed(1)} hr</p> -->
        </Card.Content>
      </Card.Root>

      <Card.Root class="lg:row-start-2">
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Primary Aircraft</Card.Title>
          <Plane class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <!-- {#if data.mostCommonAC.ac === null}
            <div class="text-2xl font-bold">None</div>
            <p class="text-xs text-muted-foreground">No aircraft activity during this window</p>
          {:else}
            <a href="/aircraft/type/{data.mostCommonAC.ac.id}?active=form">
              <div class="text-2xl font-bold">{data.mostCommonAC.ac.typeCode}</div>
              <p class="text-xs text-muted-foreground">{data.mostCommonAC.ac.make} {data.mostCommonAC.ac.model} - {data.mostCommonAC.time.toFixed(1)} hr</p>
            </a>
          {/if} -->
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Average Rest</Card.Title>
          <BedDouble class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <!-- {#if isNaN(data.rest.shortest)}
            <div class="text-2xl font-bold">None</div>
            <p class="text-xs text-muted-foreground">No rest during this window</p>
          {:else}
            <div class="text-2xl font-bold">{(data.rest.avg / 60 / 60).toFixed(1)} hr</div>
            <p class="text-xs text-muted-foreground">Shortest rest was {(data.rest.shortest / 60 / 60).toFixed(1)} hr</p>
          {/if} -->
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Unique Airports</Card.Title>
          <TowerControl class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <!-- <div class="text-2xl font-bold">{data.airports.length}</div>
          <p class="text-xs text-muted-foreground">{data.operations} operations</p> -->
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Total Distance</Card.Title>
          <Route class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <!-- <div class="text-2xl font-bold">{data.miles.toFixed(0)} nmi</div>
          <p class="text-xs text-muted-foreground">{((data.miles) * 1.15).toFixed(0)} mi</p> -->
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Average Speed</Card.Title>
          <Gauge class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <!-- <div class="text-2xl font-bold">{data.groundSpeed.toFixed(0)} kts</div>
          <p class="text-xs text-muted-foreground">{((data.groundSpeed) * 1.15).toFixed(0)} mph</p> -->
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
          <!-- <VisXYContainer data={data.dutyDays.statistics} height="80" padding={{left: 5, right: 5, top: 5, bottom: 5}} yDomainMinConstraint={[0,0]}>
            <VisAxis gridLine={false} type="x" minMaxTicksOnly={true} {tickFormat} />
            <VisCrosshair template={dualTemplate} color={crosshairColor}/>
            <VisTooltip verticalPlacement={'top'} horizontalPlacement={'right'} verticalShift={25} container={tooltipContainer} />
            <VisArea curveType="linear" {x} y={yTourAreaFlight} color={color({ opacity: '0.2'})} excludeFromDomainCalculation={true} />
            <VisLine {x} y={yFlight} color={color({secondary: false})} />
            <VisLine {x} y={yDuty} color={color({ secondary: true })} />
            <VisBulletLegend items={[
              { name: 'Flight', color: color()() },
              { name: 'Duty', color: color({ secondary: true })() },
            ]} />
          </VisXYContainer> -->
        </Card.Content>
      </Card.Root>
      <Card.Root class="col-span-5 lg:col-span-2 xl:col-span-1">
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Flight & Duty Hours Summed</Card.Title>
          <Timer class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <!-- <div class="text-2xl font-bold">{data.times.period.flight.toFixed(1)} hr <span class="text-sm text-foreground/50">over</span> {pluralize('day', data.dutyDays.num, true)} <span class="text-sm text-muted-foreground"></span></div>
          <p class="text-xs text-muted-foreground">{data.times.period.duty.toFixed(1)} duty hours
            {#if data.times.period.duty !== 0}
              - {(data.times.period.flight / data.times.period.duty * 100).toFixed(1)}% utilization
            {/if}
          </p> -->
        </Card.Content>
      </Card.Root>
      <Card.Root class="col-span-5 xl:col-span-4">
        <Card.Content class="p-0 relative">
          <!-- {#key mapKey}
            <Map.Bulk bind:this={map} class="rounded-md bg-transparent border-red-500 ring-0 bg-red-500" pos={data.positions} legIDs={data.legIDs} airports={data.airports} />
          {/key} -->
        </Card.Content>
      </Card.Root>
    </div>
  </div>

</OneColumn>