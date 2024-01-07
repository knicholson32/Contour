<script lang="ts">
  import { browser } from '$app/environment';
  import type { API } from '$lib/types';
  import { onMount } from 'svelte';
  import Frame from './Frame.svelte';

  export let value: string | null = '';
  export let options: ({ title: string; value: string; unset?: boolean } | string)[];
  export let mono = true;
  export let error = '';
  export let placeholder: string | null = null;
  export let required: boolean = true;
  export let action: string = '?/default';
  export let form: null | API.Form.Type = null


	export let name: string;
  export let title: string;
	export let disabled: boolean = false;

  export let update = () => {};

  const _update = () => {
    if (uid !== null) {
      if (value === null) localStorage.removeItem(uid + '.' + name);
      else {
        localStorage.setItem(uid + '.' + name, value);
        localStorage.setItem(uid + '.unsaved', 'true');
      }
    }
    update();
  }

  let select: HTMLSelectElement;
  const _focus = () => {
    select.focus();
  }

  // ----------------------------------------------------------------------------
  // Local Storage Support
  // ----------------------------------------------------------------------------
  export let uid: string | null = null;
  /**
   * Check local storage. If it exists and is not null, use that value
   */
  const checkLocalStorage = () => {
    if (!browser) return;
    const savedValue = localStorage.getItem(uid + '.' + name);
    if (savedValue !== null) value = savedValue;
  }

  /**
   * Check for a storage update. If the update matches the key and is not null,
   * use that value
   */
  const checkStorageUpdate = (e: StorageEvent) => {
    if (uid === null) return;
    if (e.key !== uid + '.' + name || e.newValue === null) return;
    value = e.newValue;

  }

  /**
   * If uid or name changes, the entry element has been re-assigned. Check local
   * storage and assign if required
   */
  $:{
    name;
    if (uid !== null) checkLocalStorage();
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

<Frame {name} {action} {form} bind:error {required} bind:title bind:disabled focus={_focus}>
  <select {required} bind:this={select} bind:value={value} on:change={_update} {disabled} {name} class="absolute z-0 invalid:text-gray-300 invalid:text-xs right-0 opacity-100 text-right {mono ? 'font-mono' : ''} font-bold text-sm bg-transparent disabled:option:text-gray-300 border-0 py-1.5 pl-3 pr-10 focus:ring-0 disabled:cursor-not-allowed select:disabled:text disabled:text-gray-500">
    {#if placeholder !== null}
      <option disabled selected={value === ''} value="">{placeholder}</option>
    {/if}
    {#each options as option}
			{#if typeof option === 'string'}
        <option selected={value === option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
			{:else if option.unset !== undefined && option.unset === true}
        <option disabled selected={value === option.value} value={option.value}>{option.title}</option>
			{:else}
        <option selected={value === option.value} value={option.value}>{option.title}</option>
			{/if}
		{/each}
  </select>
</Frame>

<style>
  /* Bug in safari */
  /* https://stackoverflow.com/questions/11182559/text-align-is-not-working-on-safari-select */
  select {
    text-align-last: right;
  }
</style>