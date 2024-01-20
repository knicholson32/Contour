<script lang="ts">
  import { onMount } from "svelte";
  import Frame from "./Frame.svelte";
  import icons from "$lib/components/icons";
  import type { API } from "$lib/types";
    import { writable } from "svelte/store";
    import { LocalStorageManager } from "./localStorage";
    import { form } from "./entryStore";
  
  export let defaultValue: number | null;
  export let value: number | null = defaultValue;
	export let name: string;
  export let title: string;
  export let action: string = '?/default';
	export let disabled: boolean = false;
  export let required: boolean = false;

  export let update: () => void = () => {};

  
  let lastValue = defaultValue !== null ? defaultValue.toFixed(0) : '';
  /**
   * Each time the user enters a character, check the input
   */
  let _updateContinuous = () => {
    // Check for some basic issues
    // console.log(input.value, /^[0-9]*\.?[0-9]*$/.test(input.value));
    if (input.value !== '' && (input.value.length > 5 || !(/^[0-9]+$/.test(input.value)))){
      input.value = lastValue;
      return;
    }
    // If we get here, the input was valid. Save it for later in case we need to go back to it.
    lastValue = input.value;
    // localStorage.setItem($uid + '.' + name, lastValue);
    // localStorage.setItem($uid + '.unsaved', 'true');
    _update();
  }

  /**
   * Each time the user is done with the input, clean it up
   */
  let _update = () => {
    // if ($uid !== null) {
    //   if (initialValue !== null) {
    //     localStorage.setItem($uid + '.' + name, initialValue.toFixed(0));
    //     localStorage.setItem($uid + '.unsaved', 'true');
    //   } else {
    //     localStorage.removeItem($uid + '.' + name);
    //   }
    // }
    update();
  }

  let input: HTMLInputElement;
  let focus = () => input.focus();

  /**
   * When the auto fill button is pressed, fill the value
   */
  let inc = () => {
    let v = parseInt(input.value);
    if (isNaN(v)) v = 0;
    v = v + 1;
    // initialValue = v;
    value = v;
    input.value = v.toFixed(0);
    _update();
    input.blur();
  }
  let dec = () => {
    let v = parseInt(input.value);
    if (isNaN(v)) v = 0;
    v = v - 1;
    if (v < 0) v = 0;
    // initialValue = v;
    value = v;
    input.value = v.toFixed(0);
    _update();
    input.blur();
  }


  // ----------------------------------------------------------------------------
  // Local Storage Support
  // ----------------------------------------------------------------------------
  // Create a writable for the name
  const nameStore = writable(name);
  $: nameStore.set(name);
  $: name = $nameStore;
  // Initialize the local storage manager
  const local = new LocalStorageManager(nameStore, defaultValue?.toFixed(0) ?? null, (v) => {
    if (v === null) value = defaultValue;
    else {
      const parsed = parseInt(v);
      if (!isNaN(parsed)) value = parsed
      else value = defaultValue;
    }
    _update();
  });
  const unsaved = local.getUnsavedStore();
  // Attach the local storage manager to value and default value
  $: local.setDefault(defaultValue?.toFixed(0) ?? null);
  $: local.set(value?.toFixed(0) ?? null);

  // When mounted, format the default input
  onMount(() => {
    if (defaultValue !== null) input.value = defaultValue.toFixed(0);
  });

</script>


<Frame {name} {action} unsaved={$unsaved} restore={() => local.clear(true)} form={$form} {required} bind:title focus={focus} bind:disabled>
  <div slot="outsideButton">
    <div class="absolute right-24 top-2 inline-flex gap-2 w-[4.5rem]">
      <button tabindex="-1" disabled={disabled} on:click={dec} type="button" class="touch-manipulation select-none font-mono whitespace-nowrap text-xs text-sky-400 h-7 px-2 rounded-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-sky-300 dark:ring-sky-600 bg-white dark:bg-transparent betterhover:hover:bg-gray dark:betterhover:hover:bg-zinc-900 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200">
        <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
          {@html icons.minus}
        </svg>
      </button>
      <button tabindex="-1" disabled={disabled} on:click={inc} type="button" class="touch-manipulation select-none font-mono whitespace-nowrap text-xs text-sky-400 h-7 px-2 rounded-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-sky-300 dark:ring-sky-600 bg-white dark:bg-transparent betterhover:hover:bg-gray dark:betterhover:hover:bg-zinc-900 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200">
        <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
          {@html icons.plus}
        </svg>
      </button>
    </div>
  </div>
  <input {required} tabindex="0" maxlength="4" bind:this={input} disabled={disabled} on:change={_update} on:input={_updateContinuous} pattern="[0-9]*" type="number" bind:value placeholder="0" name={name}
    class="text-ellipsis px-0 w-14 text-sm font-mono font-bold text-right flex-shrink border-0 bg-transparent py-1.5 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
</Frame>