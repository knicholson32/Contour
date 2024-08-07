<script lang="ts">
  import { dateToDateStringFormMonthDayYear } from "$lib/helpers";
  import { Check, X } from "lucide-svelte";

  export let title: string;

  export let data: {
    general: {
      isCurrent: boolean,
      currencyExpiry: number
    },
    night: {
      isCurrent: boolean,
      currencyExpiry: number
    }
  };

  export let selected: null | {
    currencyExpiry: number,
    title: string
  };

  $: isSelectedGeneral = selected !== null && selected.title === `${title} General`;
  $: isSelectedNight = selected !== null && selected.title === `${title} Night`;

  const onClickGeneral: (() => void) = () => {
    selected = {
      currencyExpiry: data.general.currencyExpiry,
      title: `${title} General`
    }
  };

  const onClickNight: (() => void) = () => {
    selected = {
      currencyExpiry: data.general.currencyExpiry,
      title: `${title} Night`
    }
  };


  export let nowSeconds: number

</script>

<div class="col-span-2 flex flex-col justify-center items-center p-1 w-full xs:w-48 rounded-lg bg-zinc-925 transition-colors border {isSelectedGeneral || isSelectedNight ? 'border-sky-500' : ''} overflow-hidden select-none">
  <div class="text-xs font-mono tracking-widest text-center">{title}</div>
  <div class="grid grid-cols-2 w-full">
    <button on:click={onClickGeneral} class="flex flex-col text-center items-center" title="{data.general.currencyExpiry - nowSeconds > 0 ? `Expires on ${dateToDateStringFormMonthDayYear(data.general.currencyExpiry)}` : 'Currency expired'}">
      <div class="relative">
        <div class="text-xxs font-mono text-center uppercase transition-colors {isSelectedGeneral ? 'text-sky-500' : 'text-gray-500'}">General</div>
      </div>
      {#if data.general.isCurrent}
        <div class="m-auto inline-flex items-center bg-green-600 rounded-lg p-1">
          <Check class="w-7 h-7 text-white" />
        </div>
      {:else}
        <div class="m-auto inline-flex items-center bg-red-500 rounded-lg p-1">
          <X class="w-7 h-7 text-white" />
        </div>
      {/if}
      {#if data.general.currencyExpiry - nowSeconds < 0}
        <div class="font-mono text-xxs text-center">none</div>
      {:else}
        <div class="font-mono text-xxs text-center text-gray-500"><span class="text-gray-300">{Math.floor((data.general.currencyExpiry - nowSeconds) / (60 * 60 * 24))}</span> days rem</div>
      {/if}
    </button>
    <button on:click={onClickNight} class="flex flex-col text-center items-center" title="{data.night.currencyExpiry - nowSeconds > 0 ? `Expires on ${dateToDateStringFormMonthDayYear(data.night.currencyExpiry)}` : 'Currency expired'}">
      <div class="relative">
        <div class="text-xxs font-mono text-center uppercase transition-colors {isSelectedNight ? 'text-sky-500' : 'text-gray-500'}">Night</div>
      </div>
      {#if data.night.isCurrent}
        <div class="m-auto inline-flex items-center bg-green-600 rounded-lg p-1">
          <Check class="w-7 h-7 text-white" />
        </div>
      {:else}
        <div class="m-auto inline-flex items-center bg-red-500 rounded-lg p-1">
          <X class="w-7 h-7 text-white" />
        </div>
      {/if}
      {#if data.night.currencyExpiry - nowSeconds < 0}
        <div class="font-mono text-xxs text-center text-gray-500">not current</div>
      {:else}
        <div class="font-mono text-xxs text-center text-gray-500"><span class="text-gray-300">{Math.floor((data.night.currencyExpiry - nowSeconds) / (60 * 60 * 24))}</span> days rem</div>
      {/if}
    </button>
  </div>
</div>