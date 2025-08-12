<script lang="ts">
  import type { API } from '$lib/types';
  import { onMount } from 'svelte';
  import Frame from './Frame.svelte';
  import { writable } from 'svelte/store';
  import { form } from './entryStore';
  import { LocalStorageManager } from './localStorage';

  let findAirportTimezone = (icao: string | null) => {
    if (icao === null || icao === undefined) return null
    icao = icao.trim().toUpperCase();
    for (const airport of airports) if (airport.id === icao) return airport.timezone;
    return null;
  }

  let findAirport = (icao: string | null) => {
    if (icao === null || icao === undefined) return null
    icao = icao.trim().toUpperCase();
    for (const airport of airports) if (airport.id === icao) return airport;
    return null;
  }
  
  export let defaultValue: string | null;
  export let value: string | null = defaultValue;
  export let airports: API.Types.Airport[];
  export let tz: string | null = findAirportTimezone(value);

  export let required: boolean = false;
  export let action: string = '?/default';

	export let name: string | null;
  export let title: string;
	export let disabled: boolean = false;

  let clazz: string = '';
	export { clazz as class };

  let mounted = false;

  export let update = () => {};


  // Variables to hold various pieces of info
  let warningMessage = '';


  // The selection input element
  let select: HTMLInputElement;

  let _update = async () => {
    if (!mounted || value === null) return;
    // _updateContinuous();
    // It isn't. We'll have to add a new airport.
    const v = value.toLocaleUpperCase().trim();
    if (v.length > 4 || v.length < 3) {
      // Error if the airport code isn't 3 or 4 characters
      warningMessage = 'Airport must have 3 or 4 characters';
      update();
    } else {
      if (findAirport(v) !== null) return;
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
        warningMessage = '';
        airports = airports;
        tz = findAirportTimezone(v);
      } else {
        // The API request was not successful. Can't find the airport.
        warningMessage = 'Error finding airport';
        tz = null;
      }
      update();
    }
  }

  /**
   * This function runs every time the input is changed
   */
	let _updateContinuous = async () => {
    if (value === null) {
      update();
      return;
    }
    // Get the value input by the user
    const v = value.toLocaleUpperCase().trim();
    console.log(v);
    // Assign it back so the airport is capital and trimmed
    // Loop through the airports we have access to and check if this is one we know about
    for (const a of airports) {
      if (a.id.toLocaleUpperCase() === v) {
        // It is, that is the new selected airport
        warningMessage = '';
        update();
        return;
      }
    }
    // It isn't. We'll have to add a new airport.
    if (v.length > 4 || v.length < 3) {
      // Error if the airport code isn't 3 or 4 characters
      warningMessage = 'Airport must have 3 or 4 characters';
    } else {
      warningMessage = '';
    }

    update();
    // return;
  };

  const focus = () => {
    value = '';
    select.focus();
  }

  // Set initial values
  $: tz = findAirportTimezone(value);

  // ----------------------------------------------------------------------------
  // Local Storage Support
  // ----------------------------------------------------------------------------
  // Create a writable for the name
  const nameStore = writable(name ?? '');
  $: nameStore.set(name ?? '');
  $: {
    if (name !== null) name = $nameStore;
  }
  // Initialize the local storage manager
  const local = new LocalStorageManager(nameStore, defaultValue, (v) => {
    value = v ?? defaultValue;
    _update();
  });
  const unsaved = local.getUnsavedStore();
  // Attach the local storage manager to value and default value
  $: {
    if (name !== null) local.setDefault(defaultValue);
  }
  $: {
    if (name !== null) local.set(value);
  }

  onMount(() => {
    mounted = true;
    tz = findAirportTimezone(value);
    _update();
  });

</script>

<Frame name={name ?? ''} class={clazz} {action} unsaved={$unsaved} restore={() => local.clear(true)} form={$form} {required} bind:title={title} focus={focus} bind:disabled error={warningMessage}>
  <input type="hidden" name={name} bind:value />
  <input type="hidden" name={name+'-tz'} bind:value={tz} />
  <!-- <form on:submit|preventDefault={() => {}} class="w-full"> -->
    <input tabindex="0" bind:this={select} {required} disabled={disabled} maxlength="4" bind:value on:input={_updateContinuous} on:change={_update} type="text" style="text-transform:uppercase" placeholder="" name="airport-visible" list="airport"
      class="w-full text-right px-0 text-sm font-mono text-sky-400 font-bold shrink border-0 bg-transparent py-1.5 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
    <datalist id="airport">
      {#each airports as airport (airport.id)}
        <option selected={airport.id.toLocaleUpperCase() === value?.toLocaleUpperCase()} value="{airport.id.toLocaleUpperCase()}">{airport.name} - ({airport.timezone})</option>
      {/each}
    </datalist>
  <!-- </form> -->
</Frame>

<style>
  /* Make sure the datalist arrow always shows */
	input::-webkit-calendar-picker-indicator {
    opacity: 100;
    margin-left: 5px;
  }
</style>
