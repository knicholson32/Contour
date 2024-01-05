<script lang="ts">
  import type { API } from '$lib/types';
  import type { Prisma } from '@prisma/client';
  import Frame from './framing/Frame.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';  
  
  export let value: string | null = null;
  export let aircraft: Prisma.AircraftGetPayload<{ select: { registration: true, type: { select: { typeCode: true, make: true, model: true }}}}>[];

  export let required: boolean = false;
  export let action: string = '?/default';
  export let form: null | API.Form.Type = null

	export let name: string;
  export let title: string;
	export let disabled: boolean = false;

  export let update = () => {};


  // Variables to hold various pieces of info
  let hiddenValue = '';


  // The selection input element
  let select: HTMLInputElement;

  /**
   * This function assigns the hidden input element so this component works in a form
   * @param a the airport selected
   * @param message an optional error message
   */
  // let assignNewAirport = (a: API.Types.Airport | null, message: string = 'Airport not found') => {
  //   // Check if the airport exists
  //   if (a === null) {
  //     // The airport does not exist. Clear the values and issue the message
  //     value = null;
  //     tz = null;
  //     hiddenValue = '';
  //     warningMessage = message;
  //   } else {
  //     // The airport does exist. Assign it and clear the message
  //     value = a;
  //     tz = a.timezone;
  //     hiddenValue = value.id;
  //     warningMessage = '';
  //   }
  //   update();
  // }


  let error = '';

  /**
   * This function runs every time the input is changed
   */
	let _update = async () => {
    update();
    // Get the value input by the user
    const v = select.value.toLocaleUpperCase().trim();
    // Assign it back so the airport is capital and trimmed
    select.value = v;
    // Loop through the airports we have access to and check if this is one we know about
    for (const a of aircraft) {
      if (a.registration.toLocaleUpperCase() === v) {
        // It is, that is the new selected airport
        // assignNewAirport(a);
        return;
      }
    }

    // It isn't. This plane does not exist.
    // Ask the user if they want to create it real quick

    error = 'Plane does not exist'

    if (confirm('This aircraft does not exist. Do you want to create it?')) {
      // Save it!
      goto('/aircraft/new?reg=' + v + '&ref=' + $page.url.pathname);
    }

    // if (v.length > 4 || v.length < 3) {
    //   // Error if the airport code isn't 3 or 4 characters
    //   assignNewAirport(null, 'Airport must have 3 or 4 characters');
    //   return;
    // }
    // // Issue a post request to add the airport to the DB
    // const r = await fetch('/api/airports/' + v, { method: 'POST' });
    // // Get the resulting airport
    // const airport = (await r.json()) as API.Airport;
    // // Check if the API request was successful
    // if (airport.ok === true) {
    //   // It was. Add the airport and sort the option list
    //   airports.push(airport.airport);
    //   airports.sort((a, b) => a.id.localeCompare(b.id));
    //   // Assign the new airport
    //   assignNewAirport(airport.airport);
    //   airports = airports;
    // } else {
    //   // The API request was not successful. Can't find the airport.
    //   assignNewAirport(null);
    // }

  };

  const focus = () => {
    select.focus();
  }

  // Set initial values
  // tz = value?.timezone ?? null;
</script>

<input type="hidden" name={name} bind:value />
<form on:submit|preventDefault={() => {}} class="w-full">
  <Frame {name} {action} {form} {required} {error} bind:title={title} focus={focus} bind:disabled>
    <input tabindex="0" bind:this={select} disabled={disabled} on:change={_update} type="text" style="text-transform:uppercase" bind:value placeholder="" name="aircraft-visible" list="aircraft"
      class="w-full text-right px-0 text-sm font-mono text-sky-400 font-bold flex-shrink border-0 bg-transparent py-1.5 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
    <datalist id="aircraft">
      {#each aircraft as plane (plane.registration)}
        <option selected={plane.registration === value} value="{plane.registration}">{plane.type.typeCode} ({plane.type.make} {plane.type.model})</option>
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
