<script lang="ts">
	import { Switch } from '$lib/components/buttons';
	import Frame from './Frame.svelte';
	import type { API } from '$lib/types';

	export let value: boolean;
	export let name: string;
	export let title: string;
	export let disabled: boolean = false;
	export let hoverTitle: string = '';
	export let form: API.Form.Type | null = null;
	export let indent = false;
	export let titleImg: string | null = null;
	export let titleLink: string | null = null;

	export let update = () => {};
</script>

<Frame {title} {hoverTitle} {indent} {titleImg} {titleLink} error={form?.ok === false && form?.name === name ? form.message ?? null : null}>
	<div class="w-full xs:w-auto flex">
		<Switch changed={(b) => { update(); }} type="button" forceHiddenInput={true} {disabled} {hoverTitle} valueName={name} bind:value/>
	</div>
</Frame>
