<script lang="ts">
  import type { API } from '$lib/types';
	import Frame from './Frame.svelte';

	export let value: string;
	export let options: ({ title: string; value: string; unset?: boolean } | string)[];
	export let name: string;
	export let title: string;
	export let hoverTitle: string = '';
	export let disabled: boolean = false;
	export let mono: boolean = false;
	export let badge: boolean | null = null;
	export let form: API.Form.Type | null = null;

	export let update = () => {};
</script>

<Frame {title} {hoverTitle} {badge} error={form?.ok === false && form?.name === name ? form.message ?? null : null}>
	<div class="-my-2 w-full xs:w-auto">
		<select on:change={update} {disabled} {name} title={hoverTitle} class="block w-full min-w-[16em] {mono ? 'font-mono' : ''} shadow-sm select:disabled:text rounded-md border-0 py-1.5 pl-3 pr-10 dark:bg-transparent text-gray-900 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:dark:bg-zinc-700 disabled:text-gray-500 disabled:ring-gray-200 disabled:dark:ring-zinc-400 sm:text-sm sm:leading-6">
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
	</div>
</Frame>

<style>
	select:has(option:disabled:checked) {
		color: #9da3ae;
	}
</style>
