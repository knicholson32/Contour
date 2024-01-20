<script lang="ts">
  import { timeZonesNames } from '@vvo/tzdb';
  import * as helpers from '$lib/helpers';
	import Frame from './Frame.svelte';
  import Switch from '$lib/components/buttons/Switch.svelte';
  import { EscapeOrClickOutside } from '$lib/components/events';
  import icons from '$lib/components/icons';
  import { form } from "./entryStore";
  import { writable } from 'svelte/store';
  import { LocalStorageManager } from './localStorage';

  const now = new Date();

  export let dateOnly = false;
  export let defaultValue: string | null;
  export let value: string | null = defaultValue;
  
  export let autoTZ: string | null = null;
  export let tz: string | null = null;
  if (defaultValue === null) {
    if (tz === 'UTC') defaultValue = dateOnly ? `${now.getUTCFullYear()}-${helpers.pad(now.getUTCMonth() + 1, 2)}-${helpers.pad(now.getUTCDate(), 2)}` : `${now.getUTCFullYear()}-${helpers.pad(now.getUTCMonth() + 1, 2)}-${helpers.pad(now.getUTCDate(), 2)}T${helpers.pad(now.getUTCHours(), 2)}:${helpers.pad(now.getUTCMinutes(), 2)}`;
    else defaultValue = dateOnly ? `${now.getFullYear()}-${helpers.pad(now.getMonth() + 1, 2)}-${helpers.pad(now.getDate(), 2)}` : `${now.getFullYear()}-${helpers.pad(now.getMonth() + 1, 2)}-${helpers.pad(now.getDate(), 2)}T${helpers.pad(now.getHours(), 2)}:${helpers.pad(now.getMinutes(), 2)}`;
  }
	export let options: string[] = ['UTC'].concat(timeZonesNames);
	export let name: string;
	export let title: string;
  export let required: boolean = false;
  export let action: string = '?/default';
	export let disabled: boolean = false;

	export let update = () => {};

  let _update = () => {
    // if ($uid !== null) {
    //   if (initialValue !== null) {
    //     localStorage.setItem($uid + '.' + name, initialValue);
    //     localStorage.setItem($uid + '.unsaved', 'true');
    //   } else {
    //     localStorage.removeItem($uid + '.' + name);
    //   }
    // }
    update();
  }

  let autoTZSwitch = tz === null;
  // if (tz !== null) autoTZSwitch = false;

  let dialog: HTMLElement;
  let button: HTMLButtonElement;
  let dialogOpen = false;
  let openDialog = () => {
    if (disabled) return;
    button.blur();
    dialogOpen = true;
  }
  let closeDialog = () => {
    dialogOpen = false;
    update();
  }

  let input: HTMLInputElement;

  // Initial values
  $: {
    if (autoTZSwitch || tz === null) tz = autoTZ;
  }

  const convertToUTC = () => {
    if (tz === null || value === null) return;
    const utcTime = helpers.timeStrAndTimeZoneToUTC(value, tz);
    if (utcTime === null) return;
    value = helpers.dateToDateStringForm(utcTime.value, dateOnly, 'UTC');
    tz = 'UTC';
    autoTZSwitch = false;
  }

  const focus = () => input.focus();

  // ----------------------------------------------------------------------------
  // Local Storage Support
  // ----------------------------------------------------------------------------
  // TODO: Save both value and TZ
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

</script>

<Frame {name} unsaved={$unsaved} restore={() => local.clear(true)} {action} form={$form} {required} bind:title bind:disabled focus={focus}>


  {#if dateOnly}
    <input {required} tabindex="0" bind:this={input} type="date" name={name} {disabled} on:change={_update} bind:value class="text-right min-w-10 p-0 disabled:cursor-not-allowed disabled:text-gray-500 border-0 bg-transparent focus:outline-none focus-within:ring-0">
  {:else}
    <input type="hidden" name={name + '-tz'} bind:value={tz} />
    <input {required} tabindex="0" bind:this={input} type="datetime-local" on:change={_update} name={name + '-date'} {disabled} bind:value
      class="border-0 placeholder:text-gray-400 p-0 disabled:cursor-not-allowed bg-transparent disabled:text-gray-500 focus-within:ring-0 focus-within:border-0"/>
  {/if}

  <div slot="outsideButton">
    {#if !dateOnly}
      <button disabled={disabled} bind:this={button} on:click={openDialog} type="button" class="touch-manipulation select-none relative whitespace-nowrap text-xs transition-colors flex justify-center items-center px-3 py-2 rounded-md font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 {(autoTZSwitch && tz !== null) || tz === 'UTC' ? 'ring-gray-300 dark:ring-zinc-600 text-gray-800 dark:text-gray-100 betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-800 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white' : 'ring-orange-700 text-orange-700 betterhover:hover:bg-orange-50 dark:betterhover:hover:bg-orange-900/10'} disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white dark:bg-transparent">
        {autoTZSwitch ? (tz === null ? 'No TZ' : 'Auto TZ') : (tz === 'UTC' ? 'UTC' : 'Custom TZ')}
      </button>
      {#if dialogOpen}
        <div bind:this={dialog} use:EscapeOrClickOutside={{ callback: closeDialog }} class="absolute right-0 top-11 xs:top-10 xs:right-3 z-10 p-3 w-full xs:w-96 origin-top-right xs:rounded-md bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-gray-300 dark:ring-zinc-600 ring-inset focus:outline-none flex flex-col gap-3" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
          <button type="button" on:click={closeDialog} class="absolute top-2 right-2 betterhover:hover:text-gray-800 dark:betterhover:hover:text-white text-gray-400">
            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
              {@html icons.x}
            </svg>
          </button>
          <span class="font-medium text-md text-gray-900 dark:text-gray-100">Configure Timezone</span>
          <hr class="mb-1 border-zinc-700"/>
            <div class="flex flex-row gap-3 items-center relative">
              <!-- TODO: Remove this force disable when I know this component works properly -->
              <Switch bind:value={autoTZSwitch} disabled title="Auto TZ"/>
              {#if tz !== 'UTC'}
                <button disabled={disabled} on:click={convertToUTC} type="button" class="touch-manipulation select-none relative whitespace-nowrap text-xs transition-colors flex justify-center items-center px-3 py-2 rounded-md font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-transparent text-gray-800 dark:text-gray-100 betterhover:hover:bg-gray dark:betterhover:hover:bg-zinc-900 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200">Convert to UTC</button>
              {/if}
            </div>
          <!-- TODO: Remove this force disable when I know this component works properly -->
          <select on:change={_update} disabled={disabled || autoTZSwitch || true} title={"Timezone"} bind:value={tz}
            class="w-full xs:w-auto sm:max-w-md text-sm border-0 rounded-md text-gray-900 dark:text-gray-100 dark:bg-transparent shadow-sm ring-1 placeholder:text-gray-400 disabled:cursor-not-allowed select:disabled:text-red-500 disabled:bg-gray-50 dark:disabled:bg-zinc-900 disabled:text-gray-500 dark:disabled:text-gray-600 disabled:ring-gray-200 ring-gray-300 dark:ring-zinc-500 focus:border-gray-900 focus-within:ring-2 focus-within:ring-sky-600 focus-within:border-0">
            <option selected={tz === null} disabled value={null}>Unset</option>
            {#each options as option}
              <option selected={tz === option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
            {/each}
          </select> 
        </div>
      {/if}
    {/if}
  </div>
</Frame>

<style>
	select:has(option:disabled:checked) {
		color: #9da3ae;
	}
</style>
