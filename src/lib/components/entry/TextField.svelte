<script lang="ts">
  import { writable } from "svelte/store";
  import { LocalStorageManager } from "./localStorage";


  export let name: string;
  export let disabled: boolean = false;
  export let placeholder = 'Enter comments';
  export let update: () => void = () => {};
  export let required: boolean = false;
  export let defaultValue: string | null;
  export let value: string | null = defaultValue;

  const _update = () => {
    update();
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

<li class="w-full relative flex-col items-center px-3 py-1 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}">
  <textarea {required} bind:value on:input={_update} disabled={disabled ? true : undefined} {placeholder} {name} class="m-0 p-0 text-sm font-medium w-full border-0 ring-0 outline-none bg-transparent focus-within:outline-none focus-within:ring-0 placeholder:text-gray-400 placeholder:text-xs disabled:cursor-not-allowed disabled:text-gray-500" rows="5"/>
  {#if $unsaved}
    <button tabindex="-1"  on:click={() => local.clear(true)} type="button" class="touch-manipulation select-none font-mono whitespace-nowrap text-xs text-sky-400 h-7 w-[4.5rem] rounded-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-sky-300 dark:ring-sky-600 bg-white dark:bg-transparent betterhover:hover:bg-gray dark:betterhover:hover:bg-zinc-900 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200">
      UNDO
    </button>
  {/if}
</li>