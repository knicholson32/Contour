<script lang="ts">
    import { dateToDateStringFormMonthDayYear } from "$lib/helpers";
  import { Check, X } from "lucide-svelte";


  interface Props {
    isCurrent: boolean;
    catClass: string;
    type: 'General' | 'Night' | 'IFR' | 'FAA';
    currencyExpiry: number;
    nowSeconds: number;
    selected: null | {
      currencyExpiry: number,
      title: string
    };
  }

  let {
    isCurrent,
    catClass,
    type,
    currencyExpiry,
    nowSeconds,
    selected = $bindable()
  }: Props = $props();

  let isSelected = $derived(selected !== null && selected.title.startsWith(catClass));

  const onClick: (() => void) = () => {
    selected = {
      currencyExpiry: currencyExpiry,
      title: `${catClass} General`
    }
  };

</script>

<button onclick={onClick} class="col-span-1 flex flex-col justify-center items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-925 w-full xs:w-24 border transition-colors {isSelected ? 'border-sky-500' : ''} overflow-hidden select-none" title="{currencyExpiry - nowSeconds > 0 ? `Expires on ${dateToDateStringFormMonthDayYear(currencyExpiry)}` : 'Currency expired'}">
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
    <div class="font-mono text-xxs text-gray-500"><span class="text-gray-600 dark:text-gray-300">{Math.floor((currencyExpiry - nowSeconds) / (60 * 60 * 24))}</span> days rem</div>
  {/if}
  </button>