<script lang="ts">
  import Frame from './Frame.svelte';
  import { writable } from 'svelte/store';
  import { LocalStorageManager } from './localStorage';
  import { form } from './entryStore';

  export let defaultValue: string | null;
  export let value: string | null = defaultValue;
  export let options: ({ title: string; value: string; unset?: boolean } | string)[];
  export let mono = true;
  export let error = '';
  export let placeholder: string | null = null;
  export let required: boolean = true;
  export let action: string = '?/default';


	export let name: string;
  export let title: string;
	export let disabled: boolean = false;

  export let update = () => {};

  const _update = () => {
    update();
  }

  let select: HTMLSelectElement;
  const _focus = () => {
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

</script>
<Frame {name} {action} unsaved={$unsaved} restore={() => local.clear(true)} form={$form} bind:error {required} bind:title bind:disabled focus={_focus}>
  <select {required} bind:this={select} bind:value on:change={_update} {disabled} {name} class="absolute z-0 invalid:text-gray-300 invalid:text-xs right-0 opacity-100 text-right {mono ? 'font-mono' : ''} font-bold text-sm bg-transparent disabled:option:text-gray-300 border-0 py-1.5 pl-3 pr-10 focus:ring-0 disabled:cursor-not-allowed select:disabled:text disabled:text-gray-500">
    {#if placeholder !== null}
      <option disabled selected={value === '' || value === null} value="">{placeholder}</option>
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