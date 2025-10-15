<script lang="ts">
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Download, Filter } from "lucide-svelte";

  interface Props {
    data: import('./$types').PageData;
  }

  let { data }: Props = $props();

  let startDate = $state(data.defaultRange.start ?? "");
  let endDate = $state(data.defaultRange.end ?? "");
  let aircraftSearch = $state("");
  let airportSearch = $state("");
  let selectedAircraft = $state<string[]>([]);
  let selectedAirports = $state<string[]>([]);

  let filteredAircraft = $derived.by(() => {
    const search = aircraftSearch.trim().toLowerCase();
    if (search.length === 0) return data.aircraft;
    return data.aircraft.filter((entry) => entry.label.toLowerCase().includes(search));
  });

  let filteredAirports = $derived.by(() => {
    const search = airportSearch.trim().toLowerCase();
    if (search.length === 0) return data.airports;
    return data.airports.filter((entry) => entry.label.toLowerCase().includes(search));
  });

  let selectedAircraftDetails = $derived.by(() =>
    data.aircraft.filter((entry) => selectedAircraft.includes(entry.id))
  );

  let selectedAirportDetails = $derived.by(() =>
    data.airports.filter((entry) => selectedAirports.includes(entry.id))
  );

  let downloadUrl = $derived.by(() => {
    const params = new URLSearchParams();
    if (startDate && startDate.length > 0) params.set('start', startDate);
    if (endDate && endDate.length > 0) params.set('end', endDate);
    for (const id of selectedAircraft) params.append('aircraft', id);
    for (const id of selectedAirports) params.append('airport', id);
    const query = params.toString();
    return query.length > 0 ? `/logbook/export/excel?${query}` : '/logbook/export/excel';
  });

  let hasFilters = $derived(
    (startDate && startDate !== (data.defaultRange.start ?? "")) ||
    (endDate && endDate !== (data.defaultRange.end ?? "")) ||
    selectedAircraft.length > 0 ||
    selectedAirports.length > 0
  );

  const resetFilters = () => {
    startDate = data.defaultRange.start ?? "";
    endDate = data.defaultRange.end ?? "";
    selectedAircraft = [];
    selectedAirports = [];
    aircraftSearch = "";
    airportSearch = "";
  };
</script>

<OneColumn white>
  <div class="w-full max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-10 space-y-6 text-zinc-900 dark:text-zinc-100">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight">Logbook Export</h1>
      <p class="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Build a filtered Excel export of your logbook data. Fine-tune the date range, aircraft, and airports to include exactly what you need.
      </p>
      <p class="text-xs text-zinc-500 dark:text-zinc-500">
        Total legs available: {data.totalLegs.toLocaleString()}
      </p>
    </header>

    <section class="flex flex-wrap items-center gap-3">
      <div class="inline-flex items-center gap-2 rounded-full bg-sky-50 dark:bg-sky-900/20 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-200">
        <Filter class="size-3.5" />
        {#if hasFilters}
          <span>Custom filters active</span>
        {:else}
          <span>Using default dataset</span>
        {/if}
      </div>
      {#if hasFilters}
        <Button variant="ghost" size="sm" onclick={resetFilters}>
          Reset filters
        </Button>
      {/if}
    </section>

    <section class="space-y-6">
      <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-sm backdrop-blur">
        <div class="p-5 space-y-4">
          <div>
            <h2 class="text-lg font-semibold">Date range</h2>
            <p class="text-sm text-zinc-600 dark:text-zinc-400">
              Limit the export to a specific period. Leave either field blank to keep it open-ended.
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-sm">
              <span class="font-medium text-zinc-700 dark:text-zinc-300">Start</span>
              <input
                type="date"
                name="start"
                bind:value={startDate}
                class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <label class="flex flex-col gap-1 text-sm">
              <span class="font-medium text-zinc-700 dark:text-zinc-300">End</span>
              <input
                type="date"
                name="end"
                bind:value={endDate}
                class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-sm backdrop-blur">
        <div class="p-5 space-y-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold">Aircraft</h2>
              <p class="text-sm text-zinc-600 dark:text-zinc-400">
                Only include legs flown in the selected aircraft. Leave empty to include all registrations.
              </p>
            </div>
            {#if selectedAircraftDetails.length > 0}
              <p class="text-xs text-zinc-500 dark:text-zinc-500">
                {selectedAircraftDetails.length} selected
              </p>
            {/if}
          </div>
          <div class="flex flex-col gap-3">
            <input
              type="search"
              placeholder="Search registrations or types…"
              bind:value={aircraftSearch}
              class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <div class="max-h-64 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
              {#if filteredAircraft.length === 0}
                <p class="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-500">No aircraft found.</p>
              {:else}
                {#each filteredAircraft as aircraft}
                  <label class="flex items-start gap-3 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/70">
                    <input
                      type="checkbox"
                      name="aircraft"
                      value={aircraft.id}
                      bind:group={selectedAircraft}
                      class="mt-1 h-4 w-4 rounded border border-zinc-400 text-sky-600 focus:ring-sky-500"
                    />
                    <span class="leading-relaxed">
                      <span class="font-medium text-zinc-800 dark:text-zinc-100">{aircraft.registration}</span>
                      <span class="block text-xs text-zinc-500 dark:text-zinc-400">{aircraft.label.replace(`${aircraft.registration} · `, '')}</span>
                    </span>
                  </label>
                {/each}
              {/if}
            </div>
            {#if selectedAircraftDetails.length > 0}
              <div class="flex flex-wrap gap-2 text-xs">
                {#each selectedAircraftDetails as aircraft}
                  <span class="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
                    {aircraft.registration}
                    <button
                      type="button"
                      class="ml-1 text-xs text-sky-600 hover:text-sky-800 dark:text-sky-200 dark:hover:text-sky-100"
                      on:click={() => selectedAircraft = selectedAircraft.filter((id) => id !== aircraft.id)}
                    >
                      ✕
                    </button>
                  </span>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-sm backdrop-blur">
        <div class="p-5 space-y-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold">Airports</h2>
              <p class="text-sm text-zinc-600 dark:text-zinc-400">
                Filter by origin, destination, or diversion airports. Selected airports will match any leg that references them.
              </p>
            </div>
            {#if selectedAirportDetails.length > 0}
              <p class="text-xs text-zinc-500 dark:text-zinc-500">
                {selectedAirportDetails.length} selected
              </p>
            {/if}
          </div>
          <div class="flex flex-col gap-3">
            <input
              type="search"
              placeholder="Search airport identifier or name…"
              bind:value={airportSearch}
              class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <div class="max-h-64 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
              {#if filteredAirports.length === 0}
                <p class="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-500">No airports found.</p>
              {:else}
                {#each filteredAirports as airport}
                  <label class="flex items-start gap-3 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/70">
                    <input
                      type="checkbox"
                      name="airport"
                      value={airport.id}
                      bind:group={selectedAirports}
                      class="mt-1 h-4 w-4 rounded border border-zinc-400 text-sky-600 focus:ring-sky-500"
                    />
                    <span class="leading-relaxed">
                      <span class="font-medium text-zinc-800 dark:text-zinc-100">{airport.id}</span>
                      {#if airport.label !== airport.id}
                        <span class="block text-xs text-zinc-500 dark:text-zinc-400">{airport.label.replace(`${airport.id} · `, '')}</span>
                      {/if}
                    </span>
                  </label>
                {/each}
              {/if}
            </div>
            {#if selectedAirportDetails.length > 0}
              <div class="flex flex-wrap gap-2 text-xs">
                {#each selectedAirportDetails as airport}
                  <span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                    {airport.id}
                    <button
                      type="button"
                      class="ml-1 text-xs text-amber-600 hover:text-amber-800 dark:text-amber-200 dark:hover:text-amber-100"
                      on:click={() => selectedAirports = selectedAirports.filter((id) => id !== airport.id)}
                    >
                      ✕
                    </button>
                  </span>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <footer class="flex flex-col gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4 md:flex-row md:items-center md:justify-between">
      <div class="text-sm text-zinc-600 dark:text-zinc-400">
        {#if hasFilters}
          Exporting with {selectedAircraftDetails.length} aircraft and {selectedAirportDetails.length} airports filtered.
        {:else}
          Ready to export entire logbook.
        {/if}
      </div>
      <div class="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onclick={resetFilters}>
          Clear all
        </Button>
        <Button href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <Download class="size-4" />
          Download Excel
        </Button>
      </div>
    </footer>
  </div>
</OneColumn>
