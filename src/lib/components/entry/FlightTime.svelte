<script lang="ts">
  import { onMount } from "svelte";
  import Frame from "./Frame.svelte";
  import type { API } from "$lib/types";
  import { writable } from "svelte/store";
  import { LocalStorageManager } from "./localStorage";
  import { form } from "./entryStore";
  import { browser } from "$app/environment";

  export let defaultValue: number | null;
  export let value: string | null = defaultValue?.toFixed(1) ?? null;
	export let name: string;
  export let title: string;
	export let disabled: boolean = false;
  export let required: boolean = false;
  export let autoFill: string | null = null;
  export let action: string = '?/default';

  let userValue: string | null;

  export let update: () => void = () => {};

  
  let lastValue = defaultValue !== null ? defaultValue.toFixed(1) : null;
  /**
   * Each time the user enters a character, check the input
   */
  let _updateContinuous = () => {
    console.log('input', userValue);

    if (userValue !== null) {
      if (userValue.length >= 2) value = userValue.substring(0, userValue.length - 1) + '.' + userValue.charAt(userValue.length - 1);
      else if (userValue.length === 1) value = userValue + '.0';
      else if (userValue.length === 0) value = '0.0';
    } else value = userValue;

    if (value === null) {
      value = lastValue;
      return;
    }
    // Check for some basic issues
    if (value.length > 5 || !(/^[0-9]*\.?[0-9]*$/.test(value))) {
      value = lastValue;
      return;
    }
    // We need to move the period to before the last value
    let c = value.replaceAll('.', '');
    if (c.length >= 2) c = c.substring(0, c.length - 1) + '.' + c.charAt(c.length - 1);
    value = c;
    // If we get here, the input was valid. Save it for later in case we need to go back to it.
    lastValue = value;
    update();
  }


  /**
   * Run this function to format the input string if the user is not focused on the input
   */
  export const format = () => {
    if (!_focus && input !== undefined) {
      setTimeout(() => {
        if (value === 'NaN' || value === '' || value === null) value= '';
        else value = parseFloat(value).toFixed(1);
      }, 1);
    }
  }

  /**
   * This function will run every time the contents of value is updated
   */
  $: {
    defaultValue;
    format();
  }

  /**
   * Each time the user is done with the input, clean it up
   */
  let _update = () => {
    if (!browser || value === null) return;
    value = parseFloat(value).toFixed(1);
    update();
  }

  let input: HTMLInputElement;
  let userInput: HTMLInputElement;

  let focus = () => {
    input.focus();
  }
  let _focus = false;

  /**
   * When the auto fill button is pressed, fill the value
   */
  let autoFillFunc = () => {
    if (autoFill !== null) {
      value = autoFill;
      update();
    }
    input.blur();
  }

  const enterFocus = () => {
    _focus = true;
    input.blur();
    userInput.value = value?.replaceAll('.', '') ?? '';
    userInput.focus();
    userInput.selectionStart = 0;
    userInput.selectionEnd = 10;
  }

  // When mounted, format the default input
  onMount(() => {
    if (defaultValue !== null) value = defaultValue.toFixed(1);
  });

  // ----------------------------------------------------------------------------
  // Local Storage Support
  // ----------------------------------------------------------------------------
  // Create a writable for the name
  const nameStore = writable(name);
  $: nameStore.set(name);
  $: name = $nameStore;
  // Initialize the local storage manager
  const local = new LocalStorageManager(nameStore, defaultValue?.toFixed(1) ?? null, (v) => {
    if (v === null) value = defaultValue?.toFixed(1) ?? null;
    else value = v;

    // format();
    _update();
  });
  const unsaved = local.getUnsavedStore();
  // Attach the local storage manager to value and default value
  $: local.setDefault(defaultValue?.toFixed(1) ?? null);
  $: local.set(value);

</script>


<Frame {name} {action} form={$form} unsaved={$unsaved} restore={() => local.clear(true)} {required} bind:title focus={focus} bind:disabled>
  <div slot="outsideButton">
    {#if autoFill !== null && autoFill !== undefined && autoFill !== '' && autoFill !== 'NaN'}
      <button tabindex="-1" disabled={disabled} on:click={autoFillFunc} type="button" class="touch-manipulation absolute right-24 top-2 select-none font-mono whitespace-nowrap text-xs text-sky-400 h-7 w-18 rounded-sm font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-sky-300 dark:ring-sky-600 bg-white dark:bg-transparent betterhover:hover:bg-gray dark:betterhover:hover:bg-zinc-900 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200">
        USE {autoFill}
      </button>
    {/if}
  </div>
  <!-- pattern="[0-9]*" -->
  <input {required} type="text" tabindex="0" maxlength="4" on:focus={enterFocus} bind:this={input} disabled={disabled} bind:value={value} on:change={_update} on:input={_updateContinuous} placeholder="0.0" name={name}
    class="text-ellipsis px-0 w-14 text-sm font-mono font-bold text-right {_focus ? 'text-gray-500' : ''}  shrink border-0 bg-transparent py-1.5 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">

  <input type="text" disabled={disabled} bind:value={userValue} on:change={_update} on:blur={() => _focus = false} on:input={_updateContinuous} bind:this={userInput} pattern="[0-9]*"
    class="opacity-0 absolute text-red-500 text-ellipsis px-0 w-14 text-sm font-mono font-bold text-right shrink border-0 bg-transparent py-1.5 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
</Frame>