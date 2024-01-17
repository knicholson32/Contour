<script lang="ts">
  import Frame from "./Frame.svelte";
  import { LocalStorageManager } from "./localStorage";
  import { writable } from "svelte/store";
  import { form } from "./entryStore";

  export let defaultValue: boolean;
  export let value: boolean = defaultValue;
	export let name: string;
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
    if (v === null) value = defaultValue;
    else value = v === 'true';
    if (name === 'taa') {
      console.log('TAA UPDATE', v, value);
    }
    _update();
  });
  const unsaved = local.getUnsavedStore();

  // Attach the local storage manager to value and default value
  $: local.setDefault(defaultValue ? 'true' : 'false');
  $: local.set(value ? 'true' : 'false');

	export const click = () => {
		value = !value;
    _update();
	}


</script>

<Frame {name} {action} unsaved={$unsaved} restore={() => local.clear(true)} form={$form} {required} bind:title focus={click} bind:disabled>
  <div class="flex items-center">
    <input {disabled} {required} type="hidden" bind:value name={name} />
    <div class="touch-manipulation shadow-sm rounded-full {value ? disabled ? 'bg-gray-200' : 'bg-indigo-600' : 'bg-gray-200'} disabled:cursor-not-allowed relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2" role="switch" aria-checked="false" aria-labelledby="annual-billing-label">
      <span aria-hidden="true" class="{value ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"/>
    </div>
  </div>
</Frame>