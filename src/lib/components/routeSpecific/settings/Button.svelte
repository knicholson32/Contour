<script lang="ts">
	import { Submit } from '$lib/components/buttons';
  import { Button } from '$lib/components/ui/button';
	import type { API } from '$lib/types';
	import Frame from './Frame.svelte';


	interface Props {
		name: string;
		title: string;
		buttonText?: string;
		disabled?: boolean;
		hoverTitle?: string;
		form?: API.Form.Type | null;
		indent?: boolean;
		titleImg?: string | null;
		titleLink?: string | null;
		onClick?: any;
	}

	let {
		name,
		title,
		buttonText = title,
		disabled = false,
		hoverTitle = '',
		form = null,
		indent = false,
		titleImg = null,
		titleLink = null,
		onClick = () => {}
	}: Props = $props();
</script>

<Frame {title} {hoverTitle} {indent} {titleImg} {titleLink} error={form?.ok === false && form?.name === name ? form.message ?? null : null}>
	<div class="w-full xs:w-auto flex">
		<button disabled={disabled} onclick={onClick} type="button" class="touch-manipulation select-none relative whitespace-nowrap transition-colors flex justify-center items-center px-3 py-2 rounded-md font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-gray-300 dark:ring-zinc-600 text-gray-800 dark:text-gray-100 betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-800 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white dark:bg-transparent">
			{buttonText}
		</button>
	</div>
</Frame>
