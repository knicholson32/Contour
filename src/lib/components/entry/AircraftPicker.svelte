<script lang="ts">
  import type { API } from '$lib/types';
  import type { Prisma } from '@prisma/client';
  import Frame from './Frame.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';  
  import { writable } from 'svelte/store';
  import { LocalStorageManager } from './localStorage';
  import { browser } from '$app/environment';
  import { form } from './entryStore';
  
  export let defaultValue: string | null;
  export let value: string | null = defaultValue;
  export let aircraft: Prisma.AircraftGetPayload<{ select: { registration: true, type: { select: { typeCode: true, make: true, model: true }}}}>[];

  export let required: boolean = false;
  export let action: string = '?/default';

	export let name: string;
  export let title: string;
	export let disabled: boolean = false;

  export let update = () => {};

  // The selection input element
  let select: HTMLInputElement;

  /**
   * This function assigns the hidden input element so this component works in a form
   * @param a the airport selected
   * @param message an optional error message
   */

  let error = '';

  /**
   * This function runs every time the input is changed
   */
	let _update = async () => {
    // Get the value input by the user
    value = value?.toLocaleUpperCase().trim() ?? null;
    if (value === null || value === '') return;
    // Loop through the airports we have access to and check if this is one we know about
    let found = false;
    for (const a of aircraft) {
      if (a.registration.toLocaleUpperCase() === value) {
        // It is, that is the new selected airport
        found = true;
        break;
      }
    }

    // if ($uid !== null) {
    //   if (initialValue !== null) {
    //     localStorage.setItem($uid + '.' + name, initialValue);
    //     localStorage.setItem($uid + '.unsaved', 'true');
    //   } else {
    //     localStorage.removeItem($uid + '.' + name);
    //   }
    // }
    update();

    if (found === true) return;

    // It isn't. This plane does not exist.
    // Ask the user if they want to create it real quick

    error = 'Plane does not exist'

    if (!browser) return;

    // TODO: Defer this question to when the browser exists
    if (confirm('This aircraft does not exist. Do you want to create it?')) {
      // Save it!
      const u = new URLSearchParams();
      u.set('reg', value);
      u.set('ref', `${$page.url.pathname}?${$page.url.searchParams.toString()}`);
      u.set('active', 'form');
      goto(`/aircraft/entry/new?${u.toString()}`);
    }

  };

  const focus = () => {
    select.focus();
  }

  // ----------------------------------------------------------------------------
  // Local Storage Support
  // ----------------------------------------------------------------------------
  // Create a writable for the name
  const nameStore = writable(name);
  $: nameStore.set(name);
  $: name = $nameStore;
  // Initialize the local storage manager
  const local = new LocalStorageManager(nameStore, defaultValue, (v) => {
    value = v ?? defaultValue;
    _update();
  });
  const unsaved = local.getUnsavedStore();
  // Attach the local storage manager to value and default value
  $: local.setDefault(defaultValue);
  $: local.set(value);

  // // ----------------------------------------------------------------------------
  // // Local Storage Support
  // // ----------------------------------------------------------------------------
  // import { uid } from '$lib/components/entry/entryStore';
  // /**
  //  * Check local storage. If it exists and is not null, use that value
  //  */
  // const checkLocalStorage = () => {
  //   if (!browser) return;
  //   const savedValue = localStorage.getItem($uid + '.' + name);
  //   if (savedValue !== null) {
  //     initialValue = savedValue;
  //     value = value;
  //   }
  // }

  // /**
  //  * Check for a storage update. If the update matches the key and is not null,
  //  * use that value
  //  */
  // const checkStorageUpdate = (e: StorageEvent) => {
  //   if ($uid === null) return;
  //   if (e.key !== $uid + '.' + name || e.newValue === null) return;
  //   initialValue = e.newValue;
  //   value = initialValue;
  // }

  // /**
  //  * Transfer the contents of value to updatedValue whenever it changes
  //  */
  // $: {
  //   value = initialValue;
  // }

  // /**
  //  * If $uid or name changes, the entry element has been re-assigned. Check local
  //  * storage and assign if required
  //  */
  // $:{
  //   name;
  //   form;
  //   if ($uid !== null) checkLocalStorage();
  // }

  // /**
  //  * Attach a handler to listen for the storage event, which is emitted when
  //  * local storage changes. Remove if off mount.
  //  */
  // onMount(() => {
  //   // aircraft = aircraft.sort((a, b) => a.registration.localeCompare(b.registration));
  //   window.addEventListener('storage', checkStorageUpdate)
  //   return () => window.removeEventListener('storage', checkStorageUpdate)
  // });

  // // Set initial values
  // // tz = value?.timezone ?? null;
</script>

<Frame {name} {action} form={$form} unsaved={$unsaved} restore={() => local.clear(true)} {required} {error} bind:title={title} focus={focus} bind:disabled>
  <input type="hidden" name={name} bind:value />
  <input tabindex="0" bind:this={select} disabled={disabled} on:change={_update} type="text" style="text-transform:uppercase" bind:value placeholder="" name="aircraft-visible" list="aircraft"
    class="w-full text-right px-0 text-sm font-mono text-sky-400 font-bold flex-shrink border-0 bg-transparent py-1.5 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
  <datalist id="aircraft">
    {#each aircraft as plane (plane.registration)}
      <option selected={plane.registration === value} value="{plane.registration}">{plane.type.typeCode} ({plane.type.make} {plane.type.model})</option>
    {/each}
  </datalist>
</Frame>

<style>
  /* Make sure the datalist arrow always shows */
	input::-webkit-calendar-picker-indicator {
    opacity: 100;
    margin-left: 5px;
  }
</style>
