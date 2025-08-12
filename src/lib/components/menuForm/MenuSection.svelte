<script lang="ts">
  // import icons from "$lib/components/icons";
  export let title: string;
  export let subtitle: string | null = null;
  export let error: string | null = null;
  export let visible: boolean = true;

</script>

<div class="select-none -mt-[0.5px] py-1 sticky -top-px z-1 border-y border-gray-200! dark:border-zinc-700/65! inline-flex w-full gap-2 items-center cursor-default text-left px-2 uppercase font-medium tracking-wider text-xs bg-gray-50 dark:bg-zinc-800 text-gray-900/65 dark:text-gray-200/65">
  <span class="inline-flex items-center gap-2">
    {title}
    {#if subtitle !== null}
      <span class="text-gray-400 text-xs">{subtitle}</span>
    {/if}
  </span>
  {#if error !== null}
    <span class="grow text-red-500 ml-2">{error}</span>
  {/if}
</div>
<ul role="list" class="divide-y divide-gray-100 dark:divide-zinc-800 {!visible ? 'hidden' : ''} {$$restProps.class}">
  <slot />
</ul>
