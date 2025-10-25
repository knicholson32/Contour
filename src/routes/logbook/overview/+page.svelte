<script lang='ts'>
    import { goto } from '$app/navigation';
    import * as Deck from '$lib/components/map/deck';
    import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
    import * as Card from "$lib/components/ui/card";
    import { SwitchSmall } from "$lib/components/ui/switchSmall";
    import type { Position } from "deck.gl";
    import { BedDouble, Gauge, Plane, Route, Table2, Timer, ChevronLeft } from "lucide-svelte";

    export let data: import('./$types').PageData;

    let mobileOpen = false;
    const toggleDrawer = () => {
      mobileOpen = !mobileOpen;
    }


</script>

{#snippet titleCard()}
  <div class="p-4 rounded-lg text-zinc-200 bg-zinc-900/80 backdrop-blur-sm flex flex-row items-center gap-4">
    <img class="w-16" src="/logo.png" alt="Contour logo">
    <div class="flex flex-col gap-0 items-start justify-center w-full text-sm">
      <div class="text-lg font-medium tracking-wider">Contour Logbook Overview</div>
      <div class="text-xs opacity-70">Generated for {data.settings['general.name']}</div>
    </div>
  </div>
{/snippet}

<OneColumn>

  <Deck.Core corePadding={{left: 50, right: 450, top: 50, bottom: 50}} startCenteredOn={[data.startAirport?.latitude ?? 0, data.startAirport?.longitude ?? 0]} customControlPositioning="left-4 top-4 md:top-auto md:bottom-4">

    <Deck.Airports airports={data.visitedAirports} />
    <Deck.Legs legs={`/api/legs?v=${data.dataVersion}`} triggerCameraMove={false} pickable={true} onclick={(id: string) => { goto(`/entry/leg/${id}?active=form`)}} />
  </Deck.Core>

  

  <!-- <div class="absolute z-10 top-4 left-4 p-4 rounded-lg bg-zinc-100/70 dark:bg-black/40 backdrop-blur-xs flex flex-col gap-2">
    Logbook Overview
  </div> -->


  <div class="absolute left-4 right-4 bottom-4 {mobileOpen ? 'opacity-0' : ''} transition-opacity duration-200 md:hidden">
    {@render titleCard()}
  </div>


  <div class="absolute z-10 top-4 text-zinc-100 {mobileOpen ? 'right-4' : '-right-[min(24rem,calc(100vw_-_2rem))]'} md:right-4 w-96 max-w-[calc(100vw_-_2rem)] transition-all duration-600 ease-in-out">
    
    <!-- Mobile Pull -->
    <button onclick={toggleDrawer} class="absolute {mobileOpen ? '-left-3 w-3' : '-left-6 w-6'} md:-left-6 md:w-6 md:hidden top-1/2 h-14 bg-zinc-900 border-zinc-800 border-l border-t border-b cursor-pointer rounded-l-md hover:w-7 transition-all duration-600" type="button" >
      <ChevronLeft class="{mobileOpen ? 'rotate-180 w-3' : 'w-5'}"/>
    </button>

    <div class="flex flex-col gap-4 max-h-[calc(100vh_-_9rem_-_env(safe-area-inset-bottom))] rounded-lg overflow-y-scroll">
      <div class="p-4 rounded-lg bg-zinc-900/80 backdrop-blur-sm grid grid-cols-2 gap-4">
        <!-- Flights -->
        <div class="bg-gradient-to-br shadow-lg from-indigo-600 to-sky-400 flex flex-col gap-4 p-3 items-center overflow-hidden rounded-lg aspect-1 md:w-42">
          <div class="uppercase text-xs w-full opacity-80">Flights</div>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" class="hidden xs:block lucide lucide-plane-icon lucide-plane grow"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
          <div class="flex flex-col gap-0 w-full">
            <div class="w-full xs:text-xl font-bold">{data.summary.numFlights.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
            <div class="w-full text-xxs opacity-80 hidden xs:block">{data.summary.numFlightsLast12Months.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} in the last year</div>
          </div>
        </div>
        <!-- Distance -->
        <div class="bg-gradient-to-br from-teal-600 to-yellow-400 flex flex-col gap-4 p-3 items-center overflow-hidden rounded-lg aspect-1 md:w-42">
          <div class="uppercase text-xs w-full opacity-80">Distance</div>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden xs:block lucide lucide-earth-icon lucide-earth grow"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/><path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"/><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/><circle cx="12" cy="12" r="10"/></svg>
          <div class="flex flex-col gap-0 w-full">
            <div class="w-full xs:text-xl font-bold">{data.summary.totalDistanceMiles.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}<span class="text-xs pl-1">mi</span></div>
            <div class="w-full text-xxs opacity-80 hidden xs:block">Around the world {(data.summary.totalDistanceMiles / 24902).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} times</div>
          </div>
        </div>
        <!-- Time -->
        <div class="bg-gradient-to-br from-orange-400 to-rose-400 flex flex-col gap-4 p-3 items-center overflow-hidden rounded-lg aspect-1 md:w-42">
          <div class="uppercase text-xs w-full opacity-80">Time</div>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="hidden xs:block lucide lucide-timer-icon lucide-timer grow"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>
          <div class="flex flex-col gap-0 w-full">
            <div class="w-full xs:text-xl font-bold">{data.summary.totalHours.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}<span class="text-xs pl-1">hr</span></div>
            <div class="w-full text-xxs opacity-80 hidden xs:block">{(data.summary.totalHoursLast12Months).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} hr in the last year</div>
          </div>
        </div>
        <!-- Landings -->
        <div class="bg-gradient-to-br from-sky-300 to-teal-300 text-zinc-800 flex flex-col content-between h-full p-3 items-center overflow-hidden rounded-lg aspect-1 md:w-42">
          <div class="uppercase text-xs w-full opacity-80">Landings</div>
          <div class="flex flex-row gap-2 pl-4 items-center w-full grow h-10 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 lucide lucide-sun-icon lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <div class="w-full xs:text-xl font-bold">{data.summary.dayLandings.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
          </div>
          <div class="flex flex-row gap-2 pl-4 items-center w-full grow h-10 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 lucide lucide-moon-icon lucide-moon"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>
            <div class="w-full xs:text-xl font-bold">{data.summary.nightLandings.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
          </div>
          <div class="flex flex-col gap-0 w-full">
            <div class="w-full xs:text-xl font-bold">{data.summary.totalLandings.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}<span class="text-xs pl-1"> total</span></div>
            <div class="w-full text-xxs opacity-80 hidden xs:block">{(data.summary.totalHoursLast12Months).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} in the last year</div>
          </div>
        </div>
        <!-- Summary -->
        <div class="col-span-2 grid grid-cols-2 gap-4 items-center p-4">
          <div class="flex flex-col gap-4">
            <div class="uppercase text-xs text-slate-300/50">Top Airports</div>
            <div class="grid grid-cols-2 gap-1 text-xs opacity-90">
              {#each data.summary.topAirports as airport}
                <span title="{airport.visits} visit{airport.visits === 1 ? '' : 's'}">{airport.id}</span>
              {/each}  
            </div>
          </div>
          <div class="flex flex-col gap-4">
            <div class="uppercase text-xs text-slate-300/50">Top Aircraft Types</div>
            <div class="grid grid-cols-2 gap-1 text-xs opacity-90">
              {#each data.summary.topAircraftTypes as type}
                <span title="{type.legs} leg{type.legs === 1 ? '' : 's'}">{type.id}</span>
              {/each}  
            </div>
          </div>
        </div>
      </div>
      <div class="hidden md:block">
        {@render titleCard()}
      </div>
    </div>

  </div>

</OneColumn>