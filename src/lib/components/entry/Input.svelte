<script lang="ts">
  import type { API } from "$lib/types";
  import { onMount } from "svelte";
  import Frame from "./Frame.svelte";
  import { browser } from "$app/environment";
  import id from "date-fns/locale/id";

  import { LocalStorageManager } from "./localStorage";
  import { writable } from "svelte/store";
  import { form } from "./entryStore";

  
  export let action: string = '?/default';
  export let error='';
  export let title: string;
	export let disabled: boolean = false;
  export let uppercase: boolean = false;

  export let validator: ((text: string) => boolean) | null = null;

  export let useNumberPattern = false;
  export let required: boolean = false;
  export let placeholder = '';

  export let update: () => void = () => {};

  export let defaultValue: string | null;
  export let value: string | null = defaultValue;
	export let name: string;

  let lastValue = value;
  export let _update = () => {
    if (validator !== null && value !== null) {
      if (!validator(value)) {
        value = lastValue ?? '';
      }
    }
    lastValue = value;
    value = lastValue;
    update();
  }

  let input: HTMLInputElement;
  let focus = () => input.focus();


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
  $: local.setDefault(uppercase ? defaultValue?.toUpperCase() ?? null : defaultValue);
  $: local.set(uppercase ? value?.toUpperCase() ?? null : value);
  

</script>


<Frame {name} {action} unsaved={$unsaved} restore={() => local.clear(true)} form={$form} {error} {required} bind:title focus={focus} bind:disabled>
  <input bind:this={input} bind:value {required} disabled={disabled} on:input={_update} pattern={useNumberPattern ? '[0-9]*' : undefined} type="text" style="{uppercase ? 'text-transform:uppercase' : ''}" placeholder={placeholder} name={name}
    class="w-full text-ellipsis px-0 text-sm font-mono font-bold text-right flex-shrink border-0 bg-transparent py-1.5 placeholder:text-gray-300 placeholder:text-xs focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
</Frame>