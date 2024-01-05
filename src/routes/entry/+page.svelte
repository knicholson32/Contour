<script lang="ts">
  import AirportPickerNew from '$lib/components/routeSpecific/entry/AirportPicker.svelte';
  import FlightTime from '$lib/components/routeSpecific/entry/FlightTime.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';
  import Section from '$lib/components/routeSpecific/entry/framing/Section.svelte';
  import TextField from '$lib/components/routeSpecific/entry/TextField.svelte';
  import Ticker from '$lib/components/routeSpecific/entry/Ticker.svelte';
  import TimePickerNew from '$lib/components/routeSpecific/entry/TimePicker.svelte';
  import type { API } from '$lib/types';
  import { onMount } from 'svelte';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  import { persisted } from 'svelte-persisted-store'
    import AircraftPicker from '$lib/components/routeSpecific/entry/AircraftPicker.svelte';
    import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
    import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';

  const LOCAL_STORAGE = 'entry';

  type LocalStoreValues = {
    date: string | null,
    aircraft: string | null,
    from: API.Types.Airport | null,
    to: API.Types.Airport | null,
    route: string | null,
    pax: number | null,
    totalTime: number | null,
    picTime: number | null,
    sicTime: number | null,
    nightTime: number | null,
    soloTime: number | null,
    xcTime: number | null,
    dayTakeoffs: number | null,
    dayLandings: number | null,
    nightTakeoffs: number | null,
    nightLandings: number | null,
    actualInstTime: number | null,
    simulatedInstTime: number | null,
    holds: number | null,
    dualGivenTime: number | null,
    dualReceivedTime: number | null,
    simTime: number | null,
    comments: string | null,
  }

  type LocalStore = {
    version: string,
    values: LocalStoreValues
  }

  let localStore: LocalStore = {
    version: '1',
    values: {
      date: null,
      aircraft: null,
      from: null,
      to: null,
      route: null,
      pax: 7,
      totalTime: 1,
      picTime: null,
      sicTime: null,
      nightTime: null,
      soloTime: null,
      xcTime: null,
      dayTakeoffs: null,
      dayLandings: null,
      nightTakeoffs: null,
      nightLandings: null,
      actualInstTime: null,
      simulatedInstTime: null,
      holds: null,
      dualGivenTime: null,
      dualReceivedTime: null,
      simTime: null,
      comments: null,
    }
  }

  // First param `preferences` is the local storage key.
  // Second param is the initial value.
  export const entry = persisted(LOCAL_STORAGE, localStore);

  let skipNext = false;
  let firstUpdate = true;

  onMount(() => {
    const u = entry.subscribe((store) => {
      if (firstUpdate) {
        firstUpdate = false;

        // Create a backup of the initial values just in-case we need to restore
        const localBackup = JSON.parse(JSON.stringify(localStore)) as LocalStore;

        // Check that the version is the same. Otherwise delete the store and just use defaults
        if (store.version !== localStore.version) {
          localStorage.removeItem(LOCAL_STORAGE);
          localStore = localBackup;
          console.log('RESTORE 1')
          return;
        }

        // We need to default to using local storage values ~unless~ they are null, then we use the server-provided
        // default values (which are already in `localStore`)
        for (const k of Object.keys(localStore.values)) {
          const key = k as keyof LocalStoreValues;
          // If the matching key is not in the store, delete the store and just use defaults
          if (!(key in store.values)) {
            localStorage.removeItem(LOCAL_STORAGE);
            localStore = localBackup;
            console.log('RESTORE 2', key, store);
            return;
          }
          console.log(key, store.values[key], localStore.values[key]);
          if (store.values[key] !== null) localStore.values[key] = store.values[key] as any;
        }

        return;
      }
      if (skipNext) {
        skipNext = false;
        return;
      }
      console.log('set');
      // We have an update that was not from this application. We need to go through our values and update the ones
      localStore = store;
    });
    return u;
  });



  const update = () => {
    console.log('update!', localStore.values.route);
    skipNext = true;
    entry.set(localStore);
  }

</script>

<OneColumn>
  <form >

    <Section title="General">
      <TimePickerNew required={true} title="Date" name="date" dateOnly={true} bind:value={localStore.values.date} update={update} />
      <AircraftPicker required={true} title="Aircraft" name="aircraft" aircraft={data.aircraft} bind:value={localStore.values.aircraft} update={update} />
      <AirportPickerNew required={true} airports={data.airports} title="From" name="from" bind:value={localStore.values.from} update={update} />
      <AirportPickerNew required={true} airports={data.airports} title="To" name="to" bind:value={localStore.values.to} update={update} />
      <Input title="Route" name="route" uppercase={true} bind:value={localStore.values.route} update={update} />
      <Ticker title="Passengers" name="pax" bind:value={localStore.values.pax} update={update} />
    </Section>

    <Section title="Times">
      <FlightTime required={true} title="Total Time" name="total-time" autoFill={null} bind:value={localStore.values.totalTime} update={update} />
      <FlightTime title="PIC" name="pic-time" bind:autoFill={localStore.values.totalTime} bind:value={localStore.values.picTime} update={update} />
      <FlightTime title="SIC" name="sic-time" bind:autoFill={localStore.values.totalTime} bind:value={localStore.values.sicTime} update={update} />
      <FlightTime title="Night" name="night-time" bind:autoFill={localStore.values.totalTime} bind:value={localStore.values.nightTime} update={update} />
      <FlightTime title="Solo" name="solo-time" bind:autoFill={localStore.values.totalTime} bind:value={localStore.values.soloTime} update={update} />
    </Section>

    <Section title="Cross Country">
      <FlightTime title="Cross Country" name="xc-time" bind:autoFill={localStore.values.totalTime} bind:value={localStore.values.xcTime} update={update} />
    </Section>

    <Section title="Takeoffs & Landings">
      <Ticker title="Day Takeoffs" name="day-takeoffs" bind:value={localStore.values.dayTakeoffs} update={update} />
      <Ticker title="Day Landings" name="day-landings" bind:value={localStore.values.dayLandings} update={update} />
      <Ticker title="Night Takeoffs" name="night-takeoffs" bind:value={localStore.values.nightTakeoffs} update={update} />
      <Ticker title="Night Landings" name="night-landings" bind:value={localStore.values.nightLandings} update={update} />
    </Section>

    <Section title="Instrument">
      <FlightTime title="Actual Instrument" name="actual-instrument-time" bind:autoFill={localStore.values.totalTime} bind:value={localStore.values.actualInstTime} update={update} />
      <FlightTime title="simulated Instrument" name="simulated-instrument-time" bind:autoFill={localStore.values.totalTime} bind:value={localStore.values.simulatedInstTime} update={update} />
      <Ticker title="Holds" name="holds" bind:value={localStore.values.holds} update={update} />
    </Section>

    <Section title="Training">
      <FlightTime title="Dual Given" name="dual-given-time" bind:autoFill={localStore.values.totalTime} bind:value={localStore.values.dualGivenTime} update={update} />
      <FlightTime title="Dual Received" name="dual-received-time" bind:autoFill={localStore.values.totalTime} bind:value={localStore.values.dualReceivedTime} update={update} />
      <FlightTime title="Simulated Flight" name="sim-time" bind:autoFill={localStore.values.totalTime} bind:value={localStore.values.simTime} update={update} />
    </Section>

    <Section title="Comments">
      <TextField name="comments" placeholder="Enter comments here" bind:value={localStore.values.comments} update={update} />
    </Section>

  </form>

  <!-- <div class="inline-flex -mt-[2px] py-2 px-5 gap-4 w-full border-t flex-row justify-center sticky bottom-0 bg-white">
    <button type="submit" class="touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-grey-500">Next</button>
    <button type="submit" class="touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-grey-500">Next</button>
  </div> -->
</OneColumn>