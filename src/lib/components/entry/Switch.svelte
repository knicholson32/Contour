<script lang="ts">
  import Frame from "./Frame.svelte";
  import { LocalStorageManager } from "./localStorage";
  import { writable } from "svelte/store";
  import { form } from "./entryStore";

  export let defaultValue: boolean;
  export let value: boolean = defaultValue;
	export let name: string;
  export let noLocalStorage = false;
  export let title: string;
	export let disabled: boolean = false;
  export let action: string = '?/default';
  export let required: boolean = true;

  export let update: () => void = () => {};
  const _update = () => update();


  // ----------------------------------------------------------------------------
  // Local Storage Support
  // ----------------------------------------------------------------------------
  // Create a writable for the name
  const nameStore = writable(name);
  $: nameStore.set(name);
  $: name = $nameStore;
  // Initialize the local storage manager
  const local = new LocalStorageManager(nameStore, defaultValue ? 'true' : 'false', (v) => {
    if (noLocalStorage) return _update();
    if (v === null) value = defaultValue;
    else value = v === 'true';
    _update();
  });
  const unsaved = local.getUnsavedStore();

  // Attach the local storage manager to value and default value
  $: local.setDefault(noLocalStorage ? null : defaultValue ? 'true' : 'false');
  $: local.set(noLocalStorage ? null : value ? 'true' : 'false');

	export const click = () => {
		value = !value;
    _update();
	}


</script>

<Frame {name} {action} unsaved={$unsaved} restore={noLocalStorage ? null : () => local.clear(true)} form={$form} {required} bind:title focus={click} bind:disabled>
  <div class="flex items-center cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 focus:mr-1" tabindex="0" role="switch" aria-checked={value}>
    <input {disabled} {required} type="hidden" bind:value name={name} />
    <div class="touch-manipulation shadow-sm rounded-full {value ? disabled ? 'bg-gray-200 dark:bg-zinc-900' : 'bg-sky-600' : 'bg-gray-200 dark:bg-zinc-700'} disabled:cursor-not-allowed relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2" role="switch" aria-checked="false" aria-labelledby="annual-billing-label">
      <span aria-hidden="true" class="{value ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"/>
    </div>
  </div>
</Frame>