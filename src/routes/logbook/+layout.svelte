<script lang="ts">
  import { page } from "$app/state";
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  const logbookLinks = [
    { href: '/logbook/overview', title: 'Overview' },
    { href: '/logbook/currency', title: 'Currency Summary' },
    { href: '/logbook/reports', title: 'Reports' },
    { href: '/logbook/export', title: 'Export' },
  ]
  
</script>

<div class="print:hidden flex-col md:flex print:md:hidden">
  <div class="flex-1 space-y-4 p-0 bg-zinc-50 dark:bg-zinc-900">
    <div class="flex flex-row justify-center text-xs md:text-sm lg:justify-start divide-x dark:divide-zinc-800 border-b border-zinc-200 dark:border-zinc-700 lg:px-6 select-none text-zinc-500">
      {#each logbookLinks as m}
        {#if (page.url.pathname.startsWith(m.href))}
          <a href="{m.href}" class="hidden sm:inline-flex px-3 lg:px-10 py-3 w-1/4 lg:w-auto text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 items-center justify-center text-center font-medium whitespace-nowrap" aria-current="page">{m.title}</a>
          <a href="{m.href}" class="inline-flex sm:hidden px-3 lg:px-10 py-3 w-1/4 lg:w-auto text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 items-center justify-center text-center font-medium whitespace-nowrap" aria-current="page">{m.title.split(' ')[0]}</a>  
        {:else}
          <a href="{m.href}" class="hidden sm:inline-flex px-3 lg:px-10 py-3 w-1/4 lg:w-auto text-zinc-700 dark:text-zinc-400  betterhover:hover:text-black betterhover:dark:hover:text-white items-center justify-center text-center font-medium whitespace-nowrap">{m.title}</a>
          <a href="{m.href}" class="inline-flex sm:hidden px-3 lg:px-10 py-3 w-1/4 lg:w-auto text-zinc-700 dark:text-zinc-400  betterhover:hover:text-black betterhover:dark:hover:text-white items-center justify-center text-center font-medium whitespace-nowrap">{m.title.split(' ')[0]}</a>  
        {/if}
      {/each}
    </div>
  </div>
</div>

{@render children?.()}