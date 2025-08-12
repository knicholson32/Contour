<script lang="ts">
	export let value: boolean;
	export let valueName = 'value';
	export let type: 'button' | 'submit' | 'reset' | null | undefined = 'button';
	export let title = '';
	export let hoverTitle: string | undefined = undefined;
	export let disabled = false;
	export let disableClick = false;

	export let forceHiddenInput = false;

	export let changed = (b: boolean) => {};

	let button: HTMLButtonElement;
	export const click = () => {
		value = !value;
		changed(value);
	}

	let _click = () => {
		if (disableClick) return;
		click();
	};
</script>

<div class="flex items-center">
	{#if title !== ''}
		<span class="mr-2 text-sm" id="annual-billing-label">
			<span class="text-gray-600 dark:text-gray-200">{title}</span>
		</span>
	{/if}
	<!-- Enabled: "bg-indigo-600", Not Enabled: "bg-gray-200" -->
	{#if type === 'submit' || forceHiddenInput === true}
		<input {disabled} type="hidden" bind:value name={valueName} />
	{/if}
	{#if disableClick}
		<div title={hoverTitle} class="touch-manipulation shadow-xs rounded-full {value ? disabled ? 'bg-gray-200 dark:bg-zinc-900' : 'bg-sky-600' : 'bg-gray-200 dark:bg-zinc-700'} disabled:cursor-not-allowed relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-sky-600 focus:ring-offset-2" role="switch" aria-checked="false" aria-labelledby="annual-billing-label">
			<!-- Enabled: "translate-x-5", Not Enabled: "translate-x-0" -->
			<span aria-hidden="true" class="{value ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"></span>
		</div>
	{:else}
		<button bind:this={button} {disabled} on:click={_click} {type} title={hoverTitle} class="touch-manipulation shadow-xs rounded-full {value ? disabled ? 'bg-gray-200 dark:bg-zinc-900' : 'bg-sky-600' : 'bg-gray-200 dark:bg-zinc-700'} disabled:cursor-not-allowed relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-sky-600 focus:ring-offset-2" role="switch" aria-checked="false" aria-labelledby="annual-billing-label">
			<!-- Enabled: "translate-x-5", Not Enabled: "translate-x-0" -->
			<span aria-hidden="true" class="{value ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"></span>
		</button>
	{/if}
</div>
