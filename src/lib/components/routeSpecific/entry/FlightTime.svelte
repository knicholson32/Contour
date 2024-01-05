<script lang="ts">
  import { onMount } from "svelte";
  import Frame from "./Frame.svelte";
  import type { API } from "$lib/types";

  export let value: number | null = null;
	export let name: string;
  export let title: string;
	export let disabled: boolean = false;
  export let required: boolean = false;
  export let autoFill: number | null = null;
  export let action: string = '?/default';
  export let form: null | API.Form.Type = null

  export let update: () => void = () => {};

  
  let lastValue = value !== null ? value.toFixed(2) : '';
  /**
   * Each time the user enters a character, check the input
   */
  let _updateContinuous = () => {
    console.log('input');
    // Check for some basic issues
    if (input.value.length > 5 || !(/^[0-9]*\.?[0-9]*$/.test(input.value))) {
      input.value = lastValue;
      return;
    }
    // We need to move the period to before the last value
    let c = input.value.replaceAll('.', '');
    if (c.length >= 2) c = c.substring(0, c.length - 1) + '.' + c.charAt(c.length - 1);
    input.value = c;
    // If we get here, the input was valid. Save it for later in case we need to go back to it.
    lastValue = input.value;
    update();
  }


  /**
   * Run this function to format the input string if the user is not focused on the input
   */
  export const format = () => {
    if (!_focus && input !== undefined) {
      setTimeout(() => input.value = parseFloat(input.value).toFixed(1), 1);
    }
  }

  /**
   * This function will run every time the contents of value is updated
   */
  $: {
    value;
    format();
  }

  /**
   * Each time the user is done with the input, clean it up
   */
  let _update = () => {
    input.value = parseFloat(input.value).toFixed(1);
    update();
  }

  let input: HTMLInputElement;
  let focus = () => input.focus();
  let _focus = false;

  /**
   * When the auto fill button is pressed, fill the value
   */
  let autoFillFunc = () => {
    if (autoFill !== null) {
      value = autoFill;
      input.value = autoFill.toFixed(1);
      update();
    }
    input.blur();
  }

  const enterFocus = () => {
    _focus = true;
    input.type = "text";
    input.selectionStart = 0;
    input.selectionEnd = 10;
    input.type = "number";
  }
  // When mounted, format the default input
  onMount(() => {
    if (value !== null) input.value = value.toFixed(1);
  });

</script>


<Frame {name} {action} {form} {required} bind:title focus={focus} bind:disabled>
  <div slot="outsideButton">
    {#if autoFill !== null}
      <button tabindex="-1" disabled={disabled} on:click={autoFillFunc} type="button" class="touch-manipulation absolute right-24 top-2 select-none font-mono whitespace-nowrap text-xs text-sky-400 h-7 w-[4.5rem] rounded-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-sky-300 betterhover:hover:bg-sky-50 betterhover:hover:text-sky-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white focus-visible:outline-grey-500">
        USE {autoFill.toFixed(1)}
      </button>
    {/if}
  </div>
  <input {required} tabindex="0" maxlength="4" on:focus={enterFocus} on:blur={() => _focus = false} bind:this={input} disabled={disabled} on:change={_update} on:input={_updateContinuous} pattern="[0-9]*" type="number" bind:value placeholder="0.0" name={name}
    class="text-ellipsis px-0 w-14 text-sm font-mono font-bold text-right flex-shrink border-0 bg-transparent py-1.5 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
</Frame>