<script lang="ts">
  import { timeZonesNames } from '@vvo/tzdb';
  import * as helpers from '$lib/helpers';
	import Frame from '$lib/components/routeSpecific/settings/Frame.svelte';
  import Switch from '$lib/components/buttons/Switch.svelte';
  import { EscapeOrClickOutside } from '$lib/components/events';
  import icons from '$lib/components/icons';

  const now = new Date();


  interface Props {
    value?: string;
    autoTZ: string | null;
    tz?: string | null;
    options?: string[];
    name: string;
    title: string;
    hoverTitle?: string;
    disabled?: boolean;
    badge?: boolean | null;
    form?: { success: boolean; name: string; message: string | undefined } | null;
    update?: any;
  }

  let {
    value = $bindable(`${now.getFullYear()}-${helpers.pad(now.getMonth() + 1, 2)}-${helpers.pad(now.getDate(), 2)}T${helpers.pad(now.getHours(), 2)}:${helpers.pad(now.getMinutes(), 2)}`),
    autoTZ,
    tz = $bindable(null),
    options = ['UTC'].concat(timeZonesNames),
    name,
    title,
    hoverTitle = '',
    disabled = false,
    badge = null,
    form = null,
    update = () => {}
  }: Props = $props();

  let autoTZSwitch = $state(true);
  if (tz !== null) autoTZSwitch = false;

  let dialog: HTMLElement | null = $state(null);
  let button: HTMLButtonElement | null = $state(null);
  let dialogOpen = $state(false);
  let openDialog = () => {
    if (button === null) return;
    button.blur();
    dialogOpen = true;
  }
  let closeDialog = () => dialogOpen = false;

  let input: HTMLInputElement | null = $state(null);

  // Initial values
  $effect(() => {
    if (autoTZSwitch || tz === null) tz = autoTZ;
  });

</script>

<Frame {title} {hoverTitle} {badge} error={form?.success === false && form?.name === name ? form.message ?? null : null}>


  <input bind:this={input} type="datetime-local" onchange={update} name={name + '-date'} {disabled} bind:value={value}
      class="-my-2 w-full xs:w-auto inline-flex sm:max-w-md text-sm border-0 rounded-md text-gray-900 shadow-xs ring-1 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 ring-gray-300 focus:border-gray-900 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-0">
  <input type="hidden" name={name + '-tz'} bind:value={tz} />

  <button bind:this={button} onclick={openDialog} type="button" class="select-none relative whitespace-nowrap text-xs h-9 transition-colors ml-2 flex justify-center items-center px-3 py-2 rounded-md font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 {autoTZSwitch && tz !== null ? 'ring-gray-300 text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900' : 'ring-orange-700 text-orange-700 betterhover:hover:bg-orange-50'} disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white  focus-visible:outline-grey-500">
    {autoTZSwitch ? tz === null ? 'No' : 'Auto' : 'Custom'} TZ
  </button>


  {#if dialogOpen}
    <div> 
        <div bind:this={dialog} use:EscapeOrClickOutside={{ callback: closeDialog }} class="absolute right-0 z-10 p-3 mt-8 w-full xs:w-96 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-hidden flex flex-col gap-3" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
          <button type="button" onclick={closeDialog} class="absolute top-2 right-2 betterhover:hover:text-gray-800 text-gray-400">
            <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
				      {@html icons.x}
			      </svg>
          </button>
          <span class="font-medium text-md text-gray-900">Configure Timezone</span>
          <hr class="mb-1"/>
          <div class="flex flex-row items-center relative">
            <Switch bind:value={autoTZSwitch} title="Auto TZ"/>
          </div>
          <select onchange={update} disabled={disabled || autoTZSwitch} title={"Timezone"} bind:value={tz}
            class="w-full xs:w-auto sm:max-w-md text-sm border-0 rounded-md text-gray-900 shadow-xs ring-1 placeholder:text-gray-400 disabled:cursor-not-allowed select:disabled:text-red-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 ring-gray-300 focus:border-gray-900 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-0">
            <option selected={tz === null} disabled value={null}>Unset</option>
            {#each options as option}
              <option selected={tz === option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
            {/each}
          </select> 
        </div>
    </div>
  {/if}
</Frame>

<style>
	select:has(:global(option:disabled:checked)) {
		color: #9da3ae;
	}
</style>
