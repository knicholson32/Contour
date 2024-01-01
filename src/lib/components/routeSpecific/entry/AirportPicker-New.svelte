<script lang="ts">
  import icons from '$lib/components/icons';
  import type { API } from '$lib/types';
  import Frame from './Frame.svelte';
  
  export let value: API.Types.Airport | null = null;
  export let tz: string | null = null;
  export let airports: API.Types.Airport[];


	export let name: string;
  export let title: string;
	export let disabled: boolean = false;


  // Variables to hold various pieces of info
  let hiddenValue = '';
  let warningMessage = '';


  // The selection input element
  let select: HTMLInputElement;

  /**
   * This function assigns the hidden input element so this component works in a form
   * @param a the airport selected
   * @param message an optional error message
   */
  let assignNewAirport = (a: API.Types.Airport | null, message: string = 'Airport not found') => {
    // Check if the airport exists
    if (a === null) {
      // The airport does not exist. Clear the values and issue the message
      value = null;
      tz = null;
      hiddenValue = '';
      warningMessage = message;
    } else {
      // The airport does exist. Assign it and clear the message
      value = a;
      tz = a.timezone;
      hiddenValue = value.id;
      warningMessage = '';
    }
  }

  /**
   * This function runs every time the input is changed
   */
	let update = async () => {
    // Get the value input by the user
    const v = select.value.toLocaleUpperCase().trim();
    // Assign it back so the airport is capital and trimmed
    select.value = v;
    // Loop through the airports we have access to and check if this is one we know about
    for (const a of airports) {
      if (a.id.toLocaleUpperCase() === v) {
        // It is, that is the new selected airport
        assignNewAirport(a);
        return;
      }
    }
    // It isn't. We'll have to add a new airport.
    if (v.length > 4 || v.length < 3) {
      // Error if the airport code isn't 3 or 4 characters
      assignNewAirport(null, 'Airport must have 3 or 4 characters');
      return;
    }
    // Issue a post request to add the airport to the DB
    const r = await fetch('/api/airports/' + v, { method: 'POST' });
    // Get the resulting airport
    const airport = (await r.json()) as API.Airport;
    // Check if the API request was successful
    if (airport.ok === true) {
      // It was. Add the airport and sort the option list
      airports.push(airport.airport);
      airports.sort((a, b) => a.id.localeCompare(b.id));
      // Assign the new airport
      assignNewAirport(airport.airport);
      airports = airports;
    } else {
      // The API request was not successful. Can't find the airport.
      assignNewAirport(null);
    }

  };

  const focus = () => {
    select.focus();
  }

  // Set initial values
  tz = value?.timezone ?? null;
</script>

<input type="hidden" name={name} bind:value={hiddenValue} />
<form on:submit|preventDefault={() => {}} class="w-full">
  <Frame bind:title={title} focus={focus} bind:disabled error={warningMessage}>
    <input tabindex="0" bind:this={select} disabled={disabled} maxlength="4" on:change={update} type="text" style="text-transform:uppercase" value={value?.id ?? ''} placeholder="" name="airport-visible" list="airport"
      class="w-full text-right px-0 text-sm font-mono text-sky-400 font-bold flex-shrink border-0 bg-transparent py-1.5 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
    <datalist id="airport">
      {#each airports as airport (airport.id)}
        <option selected={airport.id.toLocaleUpperCase() === value?.id.toLocaleUpperCase()} value="{airport.id.toLocaleUpperCase()}">{airport.name} - ({airport.timezone})</option>
      {/each}
    </datalist>
  </Frame>
</form>

<style>
  /* Make sure the datalist arrow always shows */
	input::-webkit-calendar-picker-indicator {
    opacity: 100;
    margin-left: 5px;
  }
</style>
