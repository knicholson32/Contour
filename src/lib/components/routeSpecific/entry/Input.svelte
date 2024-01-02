<script lang="ts">
  import type { API } from "$lib/types";
  import Frame from "./framing/Frame.svelte";

  export let value: string | null = null;
  export let action: string = '?/default';
  export let form: null | API.Form.Type = null
	export let name: string;
  export let title: string;
	export let disabled: boolean = false;
  export let uppercase: boolean = false;
  export let required: boolean = false;
  export let placeholder = '';

  export let update: () => void = () => {};

  let input: HTMLInputElement;
  let focus = () => input.focus();

</script>


<Frame {name} {action} {form} bind:title focus={focus} bind:disabled>
  <input bind:this={input} {required} disabled={disabled} on:change={update} type="text" style="{uppercase ? 'text-transform:uppercase' : ''}" bind:value={value} placeholder={placeholder} name={name}
        class="w-full text-ellipsis px-0 text-sm font-mono font-bold text-right flex-shrink border-0 bg-transparent py-1.5 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
</Frame>