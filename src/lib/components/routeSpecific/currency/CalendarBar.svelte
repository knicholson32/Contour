<script lang="ts">
  interface Props {
    selected: null | {
      currencyExpiry: number,
      title: string
    };
  }

  let { selected }: Props = $props();

</script>

<div class="relative w-full h-full inline-flex items-center justify-center">
  {#if selected !== null}
    <div class="absolute -top-1 left-0 font-mono text-sm">{selected.title}</div>
    <div class="rounded-l-full h-2 w-[20%] font-mono text-xxs bg-green-600 relative overflow-visible">
      <div class="absolute top-2 left-1">Now</div>
    </div>
    <div class="h-2 w-[30%] font-mono text-xxs bg-yellow-500 relative overflow-visible">
      <div class="absolute top-2 left-1">Date 1</div>
    </div>
    <div class="rounded-r-full h-2 w-[50%] font-mono text-xxs bg-red-500 relative overflow-visible">
      <div class="absolute top-2 left-1">Date 2</div>
    </div>
  {:else}
    <div class="rounded-full h-2 w-full font-mono text-xxs bg-gray-300 dark:bg-gray-400 relative overflow-visible">
      <div class="absolute top-2 left-1 hidden xs:block">No Currency Selected</div>
    </div>
  {/if}
</div>