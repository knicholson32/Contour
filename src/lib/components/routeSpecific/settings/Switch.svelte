<script lang="ts">
	import { Switch } from '$lib/components/buttons';
	import Frame from './Frame.svelte';
	import type { API } from '$lib/types';


	interface Props {
		value: boolean;
		name: string;
		title: string;
		disabled?: boolean;
		hoverTitle?: string;
		form?: API.Form.Type | null;
		indent?: boolean;
		titleImg?: string | null;
		titleLink?: string | null;
		update?: any;
	}

	let {
		value = $bindable(),
		name,
		title,
		disabled = false,
		hoverTitle = '',
		form = null,
		indent = false,
		titleImg = null,
		titleLink = null,
		update = () => {}
	}: Props = $props();
</script>

<Frame {title} {hoverTitle} {indent} {titleImg} {titleLink} error={form?.ok === false && form?.name === name ? form.message ?? null : null}>
	<div class="w-full xs:w-auto flex">
		<Switch changed={(b) => { update(); }} type="button" forceHiddenInput={true} {disabled} {hoverTitle} valueName={name} bind:value/>
	</div>
</Frame>
