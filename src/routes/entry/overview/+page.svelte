<script lang="ts">
  import * as Settings from '$lib/components/routeSpecific/settings';
  import TimePicker from '$lib/components/routeSpecific/tour/TimePicker.svelte';
  import { v4 as uuidv4 } from 'uuid';
  import * as helpers from '$lib/helpers';
  import { beforeNavigate } from '$app/navigation';
  import List from '$lib/components/routeSpecific/tour/List.svelte';
  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  // create a new Date object
  let now = new Date();

  // Day
	let dayUpdate: () => {};
	let dayUnsavedChanges = false;
	let startTime = `${helpers.pad(now.getHours(), 2)}:${helpers.pad(now.getMinutes(), 2)}`;
  let startTimeTZ = 'UTC';
  let endTime = `${helpers.pad(now.getHours(), 2)}:${helpers.pad(now.getMinutes(), 2)}`;
  let endTimeTZ = 'UTC';

  // Flight Set
	let setUpdate: () => {};
	let setUnsavedChanges = false;

  // Utilities
	beforeNavigate(({ cancel }) => {
		if (dayUnsavedChanges || setUnsavedChanges) {
			if (!confirm( 'Are you sure you want to leave this page? You have unsaved changes that will be lost.')) {
				cancel();
			}
		}
	});

  let flightSets: {
    id: string, 
    flightID: string,
    update: () => void, 
    flights: {
      id: string,
      value: string
    }[]
  }[] = [];


  const addFlightSet = () => {
    const id = uuidv4();
    flightSets.push({
      id: id,
      flightID: '',
      update: () => {
        for (const s of flightSets) if (s.id === id) for (const f of s.flights) if (f.value === '') return;
        addFlight(id);
      },
      flights: []
    });
    addFlight(id);
    flightSets = flightSets;
  };

  const addFlight = (id: string) => {
    for (let i = 0; i < flightSets.length; i++) {
      const s = flightSets[i];
      if (s.id === id) {
        s.flights.push({
          id: uuidv4(),
          value: '' 
        });
        flightSets[i] = s;
        flightSets = flightSets;
        break;
      }
    }
    flightSets = flightSets;
  }

  const tourOptions: { title: string; value: string; unset?: boolean }[] = [];

  tourOptions.push({
    value: 'unset',
    title: 'Create New Tour',
    unset: true
  });

  for (const opt of data.tourOptions) {
    let title = 'Empty Tour';
    if (opt.days.length !== 0) {
      let startTime = opt.days[0].startTime_utc;
      let endTime = opt.days[0].endTime_utc;
      for (const day of opt.days) {
        if (day.startTime_utc < startTime) startTime = day.startTime_utc;
        if (day.endTime_utc > endTime) endTime = day.endTime_utc;
      }
      title = `${helpers.timeConverter(startTime)} - ${helpers.timeConverter(endTime)}`;
    }
    tourOptions.push({
      value: opt.id.toString(),
      title
    });
  }

  addFlightSet();

  const removeFlightSet = (id: string) => {
    flightSets = flightSets.filter((e) => e.id !== id);
  };

</script>

<form class="m-4 space-y-10" method="post">

  <!-- Day -->
  <List class="" {form} action="?/day" bind:unsavedChanges={dayUnsavedChanges} bind:update={dayUpdate} >
    <span slot="title">Day</span>
    <span slot="description">Define parameters of this work day</span>

    <Settings.Select {form} name="tourAttach" title="Tour" update={dayUpdate} value={data.currentTour?.id.toString() ?? 'unset'} options={tourOptions}/>

    <TimePicker {form} name="startTime" title="Start Time" update={dayUpdate} bind:value={startTime} bind:tz={startTimeTZ}/>
    <TimePicker {form} name="endTime" title="End Time" update={dayUpdate} bind:value={endTime} bind:tz={endTimeTZ}/>

  </List>

  <!-- Flight Set -->
  {#each flightSets as set (set.id)}
    <List class="" {form} id={set.id} remove={removeFlightSet} action="?/flightSet" bind:unsavedChanges={setUnsavedChanges} >
      <span slot="title">Flight ID 
        {#if set.flightID !== ''}
          <span class="ml-2 font-mono text-sky-500">'{set.flightID}'</span>
        {:else}
          <span class="ml-2 font-mono text-gray-400">Unset</span>
        {/if}
      </span>
      <span slot="description">Legs that share a common flight ID</span>

      <Settings.Input name="flightID" title="Flight ID" bind:value={set.flightID} placeholder={data.entrySettings['entry.defaultFlightID'] + '123'} bind:update={setUpdate} />

      {#each set.flights as flight (flight.id)}
        <Settings.Input bind:name={set.flightID} title="Leg" bind:value={flight.value} placeholder={"https://www.flightaware.com/live/flight/EJA762/history/20231228/1430Z/KJFK/KFWA"} bind:update={setUpdate} bind:updatedContents={set.update} />
      {/each}

    </List>
  {/each}

  <div class="inline-flex gap-4 flex-row-reverse w-full">
    <button type="submit" class="select-none transition-colors flex justify-center px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-grey-500">Next</button>
    <button type="button" class="select-none transition-colors flex justify-center px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-grey-500" on:click={addFlightSet}>Add Flight Set</button>
  </div>


  <!-- Repeatable
  <input tabindex="0" placeholder="Flight ID">

  <input tabindex="0" placeholder="Leg">
  <input tabindex="0" placeholder="Leg">
  <input tabindex="0" placeholder="Leg">
  <input tabindex="0" placeholder="Leg">
  <input tabindex="0" placeholder="Leg">
  <input tabindex="0" placeholder="Leg">


  <div class="inline-flex">
    <button>Previous Day</button>
    <div class="flex-grow"></div>
    <button>Next Day</button>
  </div> -->
</form>