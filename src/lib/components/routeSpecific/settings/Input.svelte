<script lang="ts">
	import Frame from './Frame.svelte';

	interface Props {
		value: string;
		name: string;
		title: string;
		placeholder?: string;
		hoverTitle?: string;
		small?: boolean;
		uppercase?: boolean;
		leadingText?: { t: string; error: boolean } | null;
		link?: { href: string; title: string; icon?: string } | null;
		disabled?: boolean;
		mono?: boolean;
		error?: boolean;
		form?: { success: boolean; name: string; message: string | undefined } | null;
		update?: any;
		updatedContents?: any; // const _update = (e: Event & { currentTarget: EventTarget & HTMLInputElement; }) => {
	}

	let {
		value = $bindable(),
		name,
		title,
		placeholder = title,
		hoverTitle = '',
		small = false,
		uppercase = false,
		leadingText = null,
		link = null,
		disabled = false,
		mono = false,
		error = false,
		form = null,
		update = () => {},
		updatedContents = (e: string) => {}
	}: Props = $props();

	
	//   update();
	// }
</script>

<Frame {title} {hoverTitle} {link} error={form?.success === false && form?.name === name ? form.message ?? null : null}>
	<div class="-my-2 grow xs:grow-0 flex flex-col-reverse sm:flex-row sm:inline-flex sm:items-center">
		{#if leadingText !== null}
			<p class="mr-2 text-xxs font-mono select-none text-right {leadingText.error ? 'text-red-400' : 'text-gray-400'}">
				{leadingText.t}
			</p>
		{/if}
		<input {disabled} title={hoverTitle} style="{uppercase ? 'text-transform:uppercase' : ''}" oninput={update} onkeyup={() => { updatedContents(value); }} type="text" {name} class="block {small ? 'w-[12em]' : 'min-w-[16em]'} {mono 	? 'font-mono' 	: ''} rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-200 dark:bg-transparent shadow-xs placeholder:text-gray-400 ring-1 ring-inset {error ? 'ring-red-300 focus:ring-red-600' : 'ring-gray-300 dark:ring-zinc-600 focus:ring-sky-500'}  focus:ring-2 focus:ring-inset disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 sm:text-sm sm:leading-6" {placeholder} bind:value />
	</div>
</Frame>
