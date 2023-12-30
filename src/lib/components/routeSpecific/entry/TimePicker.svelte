<script lang="ts">
  import { timeZonesNames } from '@vvo/tzdb';
  import * as helpers from '$lib/helpers';
	import Frame from '$lib/components/routeSpecific/settings/Frame.svelte';

  const now = new Date();

  export let value: string = `${now.getFullYear()}-${helpers.pad(now.getMonth() + 1, 2)}-${helpers.pad(now.getDate(), 2)}T${helpers.pad(now.getHours(), 2)}:${helpers.pad(now.getMinutes(), 2)}`;
  export let tz: string = 'Local';
	export let options: ({ title: string; value: string; unset?: boolean } | string)[] = ['Local'];
	export let name: string;
	export let title: string;
	export let hoverTitle: string = '';
	export let disabled: boolean = false;
	export let badge: boolean | null = null;
	export let form: { success: boolean; name: string; message: string | undefined } | null = null;

	export let update = () => {};

  let select: HTMLElement;
</script>

<Frame {title} {hoverTitle} {badge} error={form?.success === false && form?.name === name ? form.message ?? null : null}>
  <div class="-my-2 inline-flex items-center rounded-md shadow-sm ring-1 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500 ring-gray-200' : 'ring-gray-300'} focus-within:ring-2 focus-within:ring-indigo-600 sm:max-w-md">

    <input type="datetime-local" on:change={update} name={name + '-date'} {disabled} bind:value={value}
      class="select-none border-0 pr-0 focus-within:border-0 bg-transparent rounded-md shadow-none items-center text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">

    <!-- <input type="time" on:change={update} {name} {disabled} bind:value
      class="select-none border-0 pr-0 focus-within:border-0 bg-transparent rounded-md shadow-none items-center text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500"> -->

    <select bind:this={select} on:change={update} {disabled} name={name + '-tz'} title={"Timezone"}
      class="flex-shrink border-0 text-center bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
			{#each options as option}
				{#if typeof option === 'string'}
					<option selected={tz === option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
				{:else if option.unset !== undefined && option.unset === true}
					<option disabled selected={value === option.value} value={option.value}>{option.title}</option>
				{:else}
					<option selected={tz === option.value} value={option.value}>{option.title}</option>
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
