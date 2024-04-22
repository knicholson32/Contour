<script lang="ts">
	import { Submit } from '$lib/components/buttons';
  import { Button } from '$lib/components/ui/button';
	import type { API } from '$lib/types';
	import Frame from './Frame.svelte';

	export let name: string;
	export let title: string;
	export let buttonText: string = title;
	export let disabled: boolean = false;
	export let hoverTitle: string = '';
	export let form: API.Form.Type | null = null;
	export let indent = false;
	export let titleImg: string | null = null;
	export let titleLink: string | null = null;

	export let onClick = () => {};
</script>

<Frame {title} {hoverTitle} {indent} {titleImg} {titleLink} error={form?.ok === false && form?.name === name ? form.message ?? null : null}>
	<div class="w-full xs:w-auto flex">
		<button disabled={disabled} on:click={onClick} type="button" class="touch-manipulation select-none relative whitespace-nowrap transition-colors flex justify-center items-center px-3 py-2 rounded-md font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-gray-300 dark:ring-zinc-600 text-gray-800 dark:text-gray-100 betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-800 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white dark:bg-transparent">
			{buttonText}
		</button>
	</div>
</Frame>
