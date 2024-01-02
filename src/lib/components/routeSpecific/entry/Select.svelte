<script lang="ts">
  import type { API } from '$lib/types';
  import Frame from './framing/Frame.svelte';

  export let value: string | null = '';
  export let options: ({ title: string; value: string; unset?: boolean } | string)[];
  export let mono = true;
  export let placeholder: string | null = null;
  export let required: boolean = true;
  export let action: string = '?/default';
  export let form: null | API.Form.Type = null


	export let name: string;
  export let title: string;
	export let disabled: boolean = false;

  export let update = () => {};

  let select: HTMLSelectElement;
  const _focus = () => {
    select.focus();
  }

</script>

<Frame {name} {action} {form} bind:title bind:disabled focus={_focus}>
  <select {required} bind:this={select} on:change={update} {disabled} {name} class="absolute invalid:text-gray-400 right-0 opacity-100 text-right {mono ? 'font-mono' : ''} font-bold text-sm bg-transparent disabled:option:text-gray-300 border-0 py-1.5 pl-3 pr-10 focus:ring-0 disabled:cursor-not-allowed select:disabled:text disabled:text-gray-500">
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