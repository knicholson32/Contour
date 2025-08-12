<script lang="ts">
  import icons from "../icons";

  export let href: string;
  export let text: string;
  export let icon: string | null = null;
  export let noIcon: boolean = false;
  export let selected = false;
  export let type: 'left' | 'right' = 'left';
  export let theme: 'default' | 'FormHeader' = 'default';

</script>

{#if theme === 'default'}
  {#if type === 'left'}
    <!-- hidden md:flex  -->
    <a href={href} class="flex border-b select-none h-11 relative flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 betterhover:hover:bg-gray-200 dark:betterhover:hover:bg-zinc-800 betterhover:hover:text-black dark:betterhover:hover:text-white">
      <div class="h-7 w-12 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
        <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
          {@html icons.chevronLeft}
        </svg>
      </div>
      <div class="flex flex-col gap-1 overflow-hidden flex-initial">
        <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">{text}</div>
      </div>
    </a>
  {:else}
    <a href={href} class="relative border-b select-none flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 {selected ? 'bg-gray-200 dark:bg-zinc-800' : 'dark:betterhover:hover:bg-zinc-800 betterhover:hover:text-black dark:betterhover:hover:text-white'}">
      {#if noIcon !== true}
        <div class="h-7 w-12 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
          <div class="h-7 w-7 shrink-0 rounded-full bg-gray-600 text-black uppercase font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
            <slot>
              <svg class="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                {@html icon}
              </svg>
            </slot>
          </div>
        </div>
      {/if}
      <div class="flex flex-col gap-1 overflow-hidden flex-initial">
        <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">{text}</div>
      </div>
      <div class="absolute right-1">
        <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
          {@html icons.chevronRight}
        </svg>
      </div>
    </a>
  {/if}
{:else}
  <a href={href} class="border-t border-sky-800 dark:border-sky-800/30 relative select-none flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 {selected ? 'bg-sky-800' : 'betterhover:hover:bg-sky-800 dark:betterhover:hover:bg-sky-800/20'}">
    <div class="h-7 w-12 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
      <div class="h-7 w-7 shrink-0 rounded-full bg-sky-600 text-black uppercase font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
        <slot>
          <svg class="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
            {@html icon}
          </svg>
        </slot>
      </div>
    </div>
    <div class="flex flex-col gap-1 overflow-hidden flex-initial">
      <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">{text}</div>
    </div>
    <div class="absolute right-1">
      <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
        {@html icons.chevronRight}
      </svg>
    </div>
  </a>
{/if}