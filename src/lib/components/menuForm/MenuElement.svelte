<script lang="ts">
  export let element: HTMLAnchorElement | null = null;
  export let href: string;
  export let selected: boolean = false;
  export let includePadding: boolean = true;
</script>

<a data-sveltekit-preload-data="tap" bind:this={element} href={href} class="relative scroll-mt-24 select-none flex flex-row justify-left items-center gap-2 {includePadding ? 'px-2 py-2' : 'px-2 py-0'} {selected ? 'bg-gray-50 dark:bg-zinc-900' : 'bg-white dark:bg-zinc-950 betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-900 betterhover:hover:text-black dark:betterhover:hover:text-white'}">
  <slot/>
</a>