<script lang="ts">
    import icons from '$lib/components/icons';
	import Frame from '$lib/components/routeSpecific/settings/Frame.svelte';
  import type { API } from '$lib/types';
    import { onMount } from 'svelte';
  
  export let value: API.Types.Airport | null = null;
  export let tz: string | null = null;
  export let airports: API.Types.Airport[];


	export let name: string;
	export let title: string;
	export let hoverTitle: string = '';
	export let disabled: boolean = false;
	export let badge: boolean | null = null;


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

  // Set initial values
  tz = value?.timezone ?? null;
</script>

<input type="hidden" name={name} bind:value={hiddenValue} />

<!-- Utilize a form wrapper with no submit to allow the enter key to trigger an airport search, but not submit the form -->
<form on:submit|preventDefault={() => {}} class="">
  <Frame {title} {hoverTitle} {badge} error={warningMessage !== '' ? warningMessage : null}>
      <button type="button" title="{value !== null ? `${value.id} - ${value.name} (${value.timezone})` : ''}" on:click={() => select.focus()} class="-my-2 px-2 h-10 gap-2 flex-grow xs:flex-grow-0 max-w-full inline-flex items-center rounded-md shadow-sm ring-1 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500 ring-gray-200' : 'ring-gray-300'} focus-within:ring-2 focus-within:ring-indigo-600 sm:max-w-md">
        <input bind:this={select} disabled={disabled} maxlength="4" on:change={update} type="text" value={value?.id ?? ''} placeholder="----" name="airport-visible" list="airport"
          class="px-0 text-sm font-mono text-left flex-shrink border-0 w-16 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
        <datalist id="airport">
          {#each airports as airport (airport.id)}
            <option selected={airport.id.toLocaleUpperCase() === value?.id.toLocaleUpperCase()} value="{airport.id.toLocaleUpperCase()}">{airport.name} - ({airport.timezone})</option>
          {/each}
        </datalist>
        <div class="flex-grow xs:flex-grow-0"></div>
        {#if value !== null}
          <div class="flex flex-col flex-grow items-end overflow-hidden">
            <span class="text-xs text-gray-400 whitespace-nowrap inline-flex items-center gap-1">
              {value.name}
              <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                {@html icons.globe}
              </svg>
            </span>
            <span class="text-xs text-gray-400 whitespace-nowrap inline-flex items-center gap-1">
              {value.timezone}
              <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                {@html icons.clock}
              </svg>
            </span>
          </div>
        {:else}
          <span class="text-xs text-gray-400 whitespace-nowrap">No Selection</span>
        {/if}
      </button>
  </Frame>
</form>

<style>
  /* Make sure the datalist arrow always shows */
	input::-webkit-calendar-picker-indicator {
    opacity: 100;
  }
</style>
