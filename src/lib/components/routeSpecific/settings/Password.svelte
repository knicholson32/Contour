<script lang="ts">
	import { Password } from '$lib/components/input';
	import Frame from './Frame.svelte';


	interface Props {
		value: string;
		name: string;
		title: string;
		placeholder?: string;
		successMessage?: string | null;
		errorMessage?: string | null;
		hoverTitle?: string;
		mono?: boolean;
		disabled?: boolean;
		form?: { success: boolean; name: string; message: string | undefined } | null;
		update?: any;
		children?: import('svelte').Snippet;
	}

	let {
		value = $bindable(),
		name,
		title,
		placeholder = title,
		successMessage = null,
		errorMessage = null,
		hoverTitle = '',
		mono = false,
		disabled = false,
		form = null,
		update = () => {},
		children
	}: Props = $props();
</script>

<Frame {title} {hoverTitle} error={form?.success === false && form?.name === name ? form.message ?? null : errorMessage !== null ? errorMessage : null} success={successMessage}>
	<div class="-my-2 flex flex-col-reverse gap-2 w-full xs:w-auto sm:flex-row sm:inline-flex sm:items-center">
		{@render children?.()}
		<Password input={update} {disabled} title={hoverTitle} {mono} {name} {placeholder} bind:value />
	</div>
</Frame>
