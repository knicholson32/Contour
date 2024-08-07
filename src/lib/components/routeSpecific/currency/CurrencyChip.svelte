<script lang="ts">
    import { dateToDateStringFormMonthDayYear } from "$lib/helpers";
  import { Check, X } from "lucide-svelte";

  export let isCurrent: boolean;
  export let catClass: string;
  export let type: 'General' | 'Night' | 'IFR' | 'FAA';
  export let currencyExpiry: number;
  export let nowSeconds: number

  export let selected: null | {
    currencyExpiry: number,
    title: string
  };

  $: isSelected = selected !== null && selected.title.startsWith(catClass);

  const onClick: (() => void) = () => {
    selected = {
      currencyExpiry: currencyExpiry,
      title: `${catClass} General`
    }
  };

</script>

<button on:click={onClick} class="col-span-1 flex flex-col justify-center items-center p-1 rounded-lg bg-zinc-925 w-full xs:w-24 border transition-colors {isSelected ? 'border-sky-500' : ''} overflow-hidden select-none" title="{currencyExpiry - nowSeconds > 0 ? `Expires on ${dateToDateStringFormMonthDayYear(currencyExpiry)}` : 'Currency expired'}">
  <div class="relative">
    <div class="text-xs font-mono tracking-widest text-center">{catClass}</div>
    <div class="text-xxs font-mono text-center uppercase transition-colors {isSelected ? 'text-sky-500' : 'text-gray-500'}">{type}</div>
  </div>
  {#if isCurrent}
    <div class="inline-flex items-center bg-green-600 rounded-lg p-1">
      <Check class="w-7 h-7 text-white" />
    </div>
  {:else}
    <div class="inline-flex items-center bg-red-500 rounded-lg p-1">
      <X class="w-7 h-7 text-white" />
    </div>
  {/if}
  {#if currencyExpiry - nowSeconds < 0}
    <div class="font-mono text-xxs">not current</div>
  {:else}
    <div class="font-mono text-xxs text-gray-500"><span class="text-gray-300">{Math.floor((currencyExpiry - nowSeconds) / (60 * 60 * 24))}</span> days rem</div>
  {/if}
  </button>