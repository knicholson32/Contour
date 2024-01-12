<script lang="ts">
  import { browser } from '$app/environment';
  import type { API } from '$lib/types';
  import { onMount } from 'svelte';
  import Frame from './Frame.svelte';

  let findAirportOption = (icao: string | null) => {
    if (icao === null || icao === undefined) return null
    icao = icao.trim().toUpperCase();
    for (const airport of airports) if (airport.id === icao) return airport;
    return null;
  }
  
  export let initialValue: string | null = null;
  export let tz: string | null = null;
  export let airports: API.Types.Airport[];
  export let value: API.Types.Airport | null = findAirportOption(initialValue);

  export let required: boolean = false;
  export let action: string = '?/default';
  export let form: null | API.Form.Type = null

	export let name: string;
  export let title: string;
	export let disabled: boolean = false;

  export let update = () => {};


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
      if ($uid !== null) {
        localStorage.removeItem($uid + '.' + name);
      }
    } else {
      // The airport does exist. Assign it and clear the message
      value = a;
      tz = a.timezone;
      hiddenValue = value.id;
      warningMessage = '';
      if ($uid !== null) {
        localStorage.setItem($uid + '.' + name, hiddenValue);
        localStorage.setItem($uid + '.unsaved', 'true');
      }
    }
    update();
  }

  /**
   * This function runs every time the input is changed
   */
	let _update = async () => {
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

  // ----------------------------------------------------------------------------
  // Local Storage Support
  // ----------------------------------------------------------------------------
  import { uid } from '$lib/components/entry/entryStore';
  /**
   * Check local storage. If it exists and is not null, use that value
   */
  const checkLocalStorage = () => {
    if (!browser) return;
    const savedValue = localStorage.getItem($uid + '.' + name);
    if (savedValue !== null) {
      initialValue = savedValue;
      value = findAirportOption(initialValue);
      if (value !== null) {
        hiddenValue = value.id;
        tz = value.timezone;
      } else {
        hiddenValue = '';
        tz = null;
      }
    }
  }

  /**
   * Check for a storage update. If the update matches the key and is not null,
   * use that value
   */
  const checkStorageUpdate = (e: StorageEvent) => {
    if ($uid === null) return;
    if (e.key !== $uid + '.' + name || e.newValue === null) return;
    initialValue = e.newValue;
    value = findAirportOption(initialValue);
    if (value !== null) {
      hiddenValue = value.id;
      tz = value.timezone;
    } else {
      hiddenValue = '';
      tz = null;
    }
  }

  /**
   * Transfer the contents of value to updatedValue whenever it changes
   */
  $: {
    value = findAirportOption(initialValue);
  }

  /**
   * If $uid or name changes, the entry element has been re-assigned. Check local
   * storage and assign if required
   */
  $:{
    name;
    form;
    if ($uid !== null) checkLocalStorage();
  }

  /**
   * Attach a handler to listen for the storage event, which is emitted when
   * local storage changes. Remove if off mount.
   */
  onMount(() => {
    window.addEventListener('storage', checkStorageUpdate)
    return () => window.removeEventListener('storage', checkStorageUpdate)
  });

</script>

<Frame {name} {action} {form} {required} bind:title={title} focus={focus} bind:disabled error={warningMessage}>
  <input type="hidden" name={name} bind:value={hiddenValue} />
  <input type="hidden" name={name+'-tz'} bind:value={tz} />
  <form on:submit|preventDefault={() => {}} class="w-full">
    <input tabindex="0" bind:this={select} {required} disabled={disabled} maxlength="4" on:change={_update} type="text" style="text-transform:uppercase" value={value?.id ?? ''} placeholder="" name="airport-visible" list="airport"
      class="w-full text-right px-0 text-sm font-mono text-sky-400 font-bold flex-shrink border-0 bg-transparent py-1.5 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
    <datalist id="airport">
      {#each airports as airport (airport.id)}
        <option selected={airport.id.toLocaleUpperCase() === value?.id.toLocaleUpperCase()} value="{airport.id.toLocaleUpperCase()}">{airport.name} - ({airport.timezone})</option>
      {/each}
    </datalist>
  </form>
</Frame>

<style>
  /* Make sure the datalist arrow always shows */
	input::-webkit-calendar-picker-indicator {
    opacity: 100;
    margin-left: 5px;
  }
</style>
