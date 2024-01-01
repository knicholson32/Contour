<script lang="ts">
  import AirportPickerNew from '$lib/components/routeSpecific/entry/AirportPicker-New.svelte';
  import FlightTime from '$lib/components/routeSpecific/entry/FlightTime.svelte';
  import Header from '$lib/components/routeSpecific/entry/Header.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';
  import Section from '$lib/components/routeSpecific/entry/Section.svelte';
  import TextField from '$lib/components/routeSpecific/entry/TextField.svelte';
  import Ticker from '$lib/components/routeSpecific/entry/Ticker.svelte';
  import TimePickerNew from '$lib/components/routeSpecific/entry/TimePicker-New.svelte';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let totalTime: number | null = 1.0;
  let comments: string;

</script>


<form>

  <Section title="General">
    <TimePickerNew title="Date" name="date" dateOnly={false} />
    <AirportPickerNew airports={data.airports} title="From" name="from" />
    <AirportPickerNew airports={data.airports} title="To" name="to" />
    <Input title="Route" name="route" uppercase={true} />
    <Ticker title="Passengers" name="pax" />
  </Section>

  <Section title="Times">
    <FlightTime title="Total Time" name="total-time" autoFill={null} bind:value={totalTime} />
    <FlightTime title="PIC" name="pic-time" bind:autoFill={totalTime} />
    <FlightTime title="SIC" name="sic-time" bind:autoFill={totalTime} />
    <FlightTime title="Night" name="night-time" bind:autoFill={totalTime} />
    <FlightTime title="Solo" name="solo-time" bind:autoFill={totalTime} />
  </Section>

  <Section title="Cross Country">
    <FlightTime title="Cross Country" name="xc-time" bind:autoFill={totalTime} />
  </Section>

  <Section title="Takeoffs & Landings">
    <Ticker title="Day Takeoffs" name="day-takeoffs" />
    <Ticker title="Day Landings" name="day-landings" />
    <Ticker title="Night Takeoffs" name="night-takeoffs" />
    <Ticker title="Night Landings" name="night-landings" />
  </Section>

  <Section title="Instrument">
    <FlightTime title="Actual Instrument" name="actual-instrument-time" bind:autoFill={totalTime} />
    <FlightTime title="simulated Instrument" name="simulated-instrument-time" bind:autoFill={totalTime} />
    <Ticker title="Holds" name="holds" />
  </Section>

  <Section title="Training">
    <FlightTime title="Dual Given" name="dual-given-time" bind:autoFill={totalTime} />
    <FlightTime title="Dual Received" name="dual-received-time" bind:autoFill={totalTime} />
    <FlightTime title="Simulated Flight" name="sim-time" bind:autoFill={totalTime} />
  </Section>

  <Section title="Comments">
    <TextField name="comments" placeholder="Enter comments here" bind:value={comments} />
    <FlightTime title="Simulated Flight" name="sim-time" bind:autoFill={totalTime} />
  </Section>

</form>

<div class="inline-flex -mt-[2px] py-2 px-5 gap-4 w-full border-t flex-row justify-center sticky bottom-0 bg-white">
  <button type="submit" class="touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-grey-500">Next</button>
  <button type="submit" class="touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-grey-500">Next</button>
</div>