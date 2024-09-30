<script lang="ts">
  import type * as Types from '@prisma/client';
  import { writable } from 'svelte/store';
  import { LocalStorageManager } from './localStorage';
  import icons from '../icons';
  import { EscapeOrClickOutside } from '../events';
  import { Switch } from '../buttons';
  import AirportPicker from './AirportPicker.svelte';
  import type { API } from '$lib/types';
  import { onMount } from 'svelte';
  import * as Popover from "$lib/components/ui/popover";
  import { Pencil } from 'lucide-svelte';



  export let name: string;
  export let id: string;
  export let defaultValue: Types.Approach | null;

  export let airports: API.Types.Airport[];
  export let defaultAirport: string | null;

  export let value: Types.Approach | null;

  export let onDelete = (id: string) => {};
  export let update = () => {};

  let airport: string;
  let approachID: number;
  let type: string = 'ILS';
  let runway: string = '';
  let tag: string = '';
  let circleToLand: boolean;
  let notes: string

  const _reverseUpdate = async () => {
    if (value !== null) {
      airport = value.airportId;
      circleToLand = value.circleToLand;
      notes = value.notes ?? '';
      type = value.type;
      runway = value.runway ?? '';
      tag = value.tag ?? '';
      await refreshApproachOptions();
      const appOption = approachOptions.find((o) => o.composite === value?.composite);
      // Find an approach option that best matches the approach loaded. If one doesn't exist 
      // (perhaps because it was deleted in a DB update), assign it as a custom approach
      approachID = appOption?.id ?? -1;
    }
    update();
    return;
  }

  /**
   * An approach update has occurred.
   */
  const _update = async () => {
    if (approachID !== undefined && airport !== undefined) {
      let app: typeof approachOptions[0] | undefined;
      // Check to see if the user has entered a custom approach (-1 ID)
      if (approachID !== -1) {
        // The user has not entered a custom approach
        app = approachOptions.find((v) => v.id === approachID);
        if (app !== undefined) {
          // We need to set the values for the approach, however, so the custom approach defaults to this value
          type = app.type;
          runway = app.runway ?? '';
          tag = app.tag ?? '';
        }
      } else {
        // The user has entered a custom approach
        app = {
          id: -1,
          airportId: airports.find((a) => a.name === airport)?.id ?? '',
          type: type,
          runway: runway,
          tag: tag,
          // TODO: Break this into a shared function. Also used in settings/data/+page.server.ts
          composite: `${type}${tag === '' ? '' : ' ' + tag}${runway === '' ? '' : ' Rwy ' + runway}`,
          custom: true
        }
      }
      if (app !== undefined) {
        value = {
          id: id,
          type: app.type,
          runway: app.runway === '' ? null : app.runway,
          tag: app.tag === '' ? null : app.tag,
          airportId: airport,
          circleToLand: circleToLand ?? false,
          composite: app.composite,
          notes: notes === '' ? null : (notes ?? null),
          legId: null,
        }
        update();
        return;
      }
    }
    value = null;
    update();
  }

  const _delete = () => {
    closeMenu();
    local.clear();
    onDelete(id);
  }

  const _clear = () => {
    local.clear(true);
  }

  let menuOpen = false;
  const openMenu = () => {
    menuOpen = true;
  }
  const closeMenu = () => menuOpen = false;


  let approachOptions: API.Types.ApproachOption[] = [];
  let mounted = false;

  /**
   * Get approach options from the server. Used for when the airport changes.
   */
  const refreshApproachOptions = async () => {
    if (!mounted || airport === '') return;
    const a = await fetch('/api/approaches/' + airport);
    const approaches = (await a.json()) as API.Approach;
    if (approaches.ok === true) {
      approachOptions = approaches.options;
    }
  }
  $: {
    airport;
    refreshApproachOptions();
  }

  /**
   * Update the airport when the approach value changes
   */
  const updateAirport = () => {
    airport = value?.airportId ?? defaultAirport ?? '';
  }
  $: {
    value;
    updateAirport()
  }

  // Start by refreshing approach options for the current airport
  onMount(() => {
    mounted = true;
    refreshApproachOptions();
  })


  // ----------------------------------------------------------------------------
  // Local Storage Support
  // ----------------------------------------------------------------------------
  // Create a writable for the name
  const nameStore = writable(name + '-' + id);
  $: nameStore.set(name);
  $: name = $nameStore;
  // Initialize the local storage manager
  const local = new LocalStorageManager(nameStore, JSON.stringify(defaultValue), (v) => {
    value = v === null ? defaultValue : (JSON.parse(v) as Types.Approach | null);
    _reverseUpdate();
  });
  const unsaved = local.getUnsavedStore();
  // Attach the local storage manager to value and default value
  $: local.setDefault(JSON.stringify(defaultValue));
  $: local.set(JSON.stringify(value));

</script>

<li class="w-full h-[44px] relative px-3 bg-white dark:bg-zinc-900 betterhover:hover:bg-gray-50 dark:betterhover:hover:bg-zinc-950 transition-colors py-1 gap-2 font-bold">
  <input type="hidden" name="approach" value={JSON.stringify(value)} />
  <Popover.Root bind:open={menuOpen} >
    <Popover.Trigger class="flex flex-row items-center w-full h-full">
      {#if value === null}
        <div class="text-gray-400 dark:text-gray-600">No Approach
          {#if $unsaved === true}
            *
          {/if}
        </div>
        <div class="flex-grow"></div>
      {:else}
          <div class="font-bold text-sky-500 font-mono text-sm">{value.airportId}
            {#if $unsaved === true}
              *
            {/if}
          </div>
          <div class="flex-grow"></div>
          <div class="font-bold text-sky-500 font-mono text-sm inline-flex items-center gap-2">
            {#if approachID === -1}
              <span title="Custom Approach" class="text-gray-800 dark:text-white"><Pencil class="w-3 h-3" /></span>
            {/if}
            <span>
              {value.composite}
              {#if value.circleToLand === true}
                Circle to Land
              {/if}
            </span>
          </div>
      {/if}
      <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
        {@html icons.chevronRight}
      </svg>
    </Popover.Trigger>
    <Popover.Content class="w-[calc(100%-16px)] xs:w-auto p-0 m-0" align="end" fitViewport={true}>
      <div use:EscapeOrClickOutside={{ callback: closeMenu }} class="z-10 p-3 w-full xs:w-96 xs:rounded-md bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-gray-300 dark:ring-zinc-600 ring-inset focus:outline-none flex flex-col gap-3" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
        <button type="button" on:click={closeMenu} class="absolute top-2 right-2 betterhover:hover:text-gray-800 dark:betterhover:hover:text-white text-gray-400">
          <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
            {@html icons.x}
          </svg>
        </button>
        <span class="font-medium text-md text-gray-900 dark:text-gray-100">
          Approach
          {#if $unsaved === true}
            <button tabindex="-1"  on:click={_clear} type="button" class="touch-manipulation select-none font-mono whitespace-nowrap text-xs text-sky-400 h-7 w-[4.5rem] rounded-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-sky-300 dark:ring-sky-600 bg-white dark:bg-transparent betterhover:hover:bg-gray dark:betterhover:hover:bg-zinc-900 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200">
              UNDO
            </button>
          {/if}
        </span>
        <AirportPicker title="Airport" class="rounded-lg" name={null} bind:defaultValue={airport} airports={airports} bind:value={airport} />
        <hr class="mb-1 border-gray-200 dark:border-zinc-700"/>
        <select bind:value={approachID} on:change={_update} title={"Approach"}
          class="w-full xs:w-auto sm:max-w-md text-sm border-0 rounded-md text-gray-900 dark:text-gray-100 dark:bg-transparent shadow-sm ring-1 placeholder:text-gray-400 disabled:cursor-not-allowed select:disabled:text-red-500 disabled:bg-gray-50 dark:disabled:bg-zinc-900 disabled:text-gray-500 dark:disabled:text-gray-600 disabled:ring-gray-200 ring-gray-300 dark:ring-zinc-500 focus:border-gray-900 focus-within:ring-2 focus-within:ring-sky-600 focus-within:border-0">
          <option disabled value={null}>Unset</option>
          {#each approachOptions as option}
            <option selected={false} value={option.id}>{option.composite}</option>
          {/each}
          <option value={-1}>Custom</option>
        </select>
        {#if approachID === -1 && value !== null}
          <select bind:value={type} on:change={_update} title={"Type"}
            class="w-full xs:w-auto sm:max-w-md text-sm border-0 rounded-md text-gray-900 dark:text-gray-100 dark:bg-transparent shadow-sm ring-1 placeholder:text-gray-400 disabled:cursor-not-allowed select:disabled:text-red-500 disabled:bg-gray-50 dark:disabled:bg-zinc-900 disabled:text-gray-500 dark:disabled:text-gray-600 disabled:ring-gray-200 ring-gray-300 dark:ring-zinc-500 focus:border-gray-900 focus-within:ring-2 focus-within:ring-sky-600 focus-within:border-0">
            <option selected={false} value={'ILS'}>{'ILS'}</option>
            <option selected={false} value={'RNAV (GPS)'}>{'RNAV (GPS)'}</option>
            <option selected={false} value={'RNAV (RNP)'}>{'RNAV (RNP)'}</option>
            <option selected={false} value={'LOC'}>{'LOC'}</option>
            <option selected={false} value={'LOC BC'}>{'LOC BC'}</option>
            <option selected={false} value={'LDA'}>{'LDA'}</option>
            <option selected={false} value={'VOR'}>{'VOR'}</option>
            <option selected={false} value={'VOR/DME'}>{'VOR/DME'}</option>
            <option selected={false} value={'DME/DME'}>{'DME/DME'}</option>
            <option selected={false} value={'NDB'}>{'NDB'}</option>
            <option selected={false} value={'GPS'}>{'GPS'}</option>
            <option selected={false} value={'SDF'}>{'SDF'}</option>
            <option selected={false} value={'ASR'}>{'ASR'}</option>
            <option selected={false} value={'PAR'}>{'PAR'}</option>
            <option selected={false} value={'SRA'}>{'SRA'}</option>
          </select>
          <input bind:value={runway} on:change={_update} type="text" placeholder="Runway (IE: 18C)"
            class="w-full xs:w-auto sm:max-w-md text-sm border-0 rounded-md text-gray-900 dark:text-gray-100 dark:bg-transparent shadow-sm ring-1 placeholder:text-gray-400 disabled:cursor-not-allowed select:disabled:text-red-500 disabled:bg-gray-50 dark:disabled:bg-zinc-900 disabled:text-gray-500 dark:disabled:text-gray-600 disabled:ring-gray-200 ring-gray-300 dark:ring-zinc-500 focus:border-gray-900 focus-within:ring-2 focus-within:ring-sky-600 focus-within:border-0">
          <input bind:value={tag} on:change={_update} type="text" placeholder="Tag (IE: Y)"
            class="w-full xs:w-auto sm:max-w-md text-sm border-0 rounded-md text-gray-900 dark:text-gray-100 dark:bg-transparent shadow-sm ring-1 placeholder:text-gray-400 disabled:cursor-not-allowed select:disabled:text-red-500 disabled:bg-gray-50 dark:disabled:bg-zinc-900 disabled:text-gray-500 dark:disabled:text-gray-600 disabled:ring-gray-200 ring-gray-300 dark:ring-zinc-500 focus:border-gray-900 focus-within:ring-2 focus-within:ring-sky-600 focus-within:border-0">
        {/if}
        <div class="flex flex-row gap-3 items-center relative">
          <Switch bind:value={circleToLand} changed={(b) => _update()} title="Circle to Land"/>
        </div>
        <div class="flex flex-row gap-3 items-center relative">
          <textarea bind:value={notes} on:input={_update} placeholder="Notes" class="m-0 p-2 text-sm font-medium w-full ring-1 ring-gray-300 dark:ring-zinc-600 ring-inset focus:outline-none outline-none bg-transparent border-0 rounded-md border-gray-100 placeholder:text-gray-400 placeholder:text-xs disabled:cursor-not-allowed disabled:text-gray-500" rows="5"/>
        </div>
        <button on:click={_delete} type="button" class="touch-manipulation select-none relative whitespace-nowrap text-xs transition-colors flex justify-center items-center px-3 py-2 rounded-md font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-red-500 dark:ring-red-600 bg-white dark:bg-transparent text-red-500 dark:text-red-100 betterhover:hover:bg-red-500 dark:betterhover:hover:bg-red-900 betterhover:hover:text-white dark:betterhover:hover:text-white">Delete Approach</button>
      </div>
    </Popover.Content>
  </Popover.Root>
</li>