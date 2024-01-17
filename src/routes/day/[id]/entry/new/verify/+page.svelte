<script lang="ts">
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import * as Entry from '$lib/components/entry';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { enhance } from '$app/forms';
  import * as Map from '$lib/components/map';
  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let submitting = false;
	
  let startAirportTZ: string | null;
  let endAirportTZ: string | null;

</script>

<OneColumn>

  <div class="flex-shrink">

    <Map.Airports airports={data.airportList} />

    <form method="post" enctype="multipart/form-data" use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        submitting = false;
      };
    }}>

      {#if data.entry.progressPercent !== null && data.entry.progressPercent !== 100}
        <div class="p-3">
          NOTICE: The cache entry is NOT complete. The flight is still in progress. Make sure the flight has finished, and reload with "No Cache" enabled.
        </div>
      {/if}

      {#if data.entry.inaccurateTiming === true}
        <div class="p-3">
          NOTICE: This entry has inaccurate timing. Verify the start and end times.
        </div>
      {/if}

      {#if data.existingEntry === true}
        <div class="p-3 text-red-500">
          NOTICE: An entry with this FlightAware ID already exists
        </div>
      {/if}

      {data.entry.faFlightId}

      <Section title="General">
        <Entry.Input disabled={true} title="Flight ID" name="" defaultValue={data.entry.ident} />
        <Entry.Input disabled={true} title="Registration" name="" defaultValue={data.entry.registration} />
        <Entry.Input disabled={true} title="Type" name="" defaultValue={data.entry.aircraftType} />
      </Section>

      <Section title="Airports">
        <Entry.Input disabled={true} title="Origin" name="" defaultValue="{data.entry.originAirportId} at {data.startTime}" />
        {#if data.entry.diversionAirportId === null}
          <Entry.Input disabled={true} title="Origin" name="" defaultValue="{data.entry.destinationAirportId} at {data.endTime}" />
        {:else}
          <Entry.Input disabled={true} title="Origin" name="" defaultValue="{data.entry.destinationAirportId} -> DIVERT" />
          <Entry.Input disabled={true} title="Origin" name="" defaultValue="{data.entry.diversionAirportId} at {data.endTime}" />
        {/if}
        <Entry.FlightTime disabled={true} title="Total Time" name="" defaultValue={data.totalTime} />
      </Section>

      <Section title="Diversion">
        <!-- <Entry.Switch disabled={true} title="Diverted" name="" defaultValue={data.entry.diverted} /> -->
        <Entry.AirportPicker disabled={true} title="Diversion" name="" airports={data.airports} defaultValue={data.entry.diversionAirportId} />
      </Section>

      <Section title="Route">
        <Entry.Input disabled={true} title="Filed Route" name="" defaultValue={data.entry.filedRoute} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        <a href="/day/{data.id}/entry/new/link" class="flex-grow w-full text-center md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-yellow-500 bg-yellow-400 text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Change Link</a>
        <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" {submitting} theme={{primary: 'green'}} actionText="Looks Good" actionTextInProgress="Creating" />
      </div>
    </form>
  </div>

</OneColumn>