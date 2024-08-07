<script lang="ts">
  
  /**
   * Specifies whether to treat the zone around the bottom of the screen as a pure safe-zone,
   * or whether to treat it as an area that should be seen through (scroll)
   */
  export let type: 'safe' | 'scroll' = 'scroll';
  export let white = false;

</script>

{#if type === 'safe'}
  
  <div class="h-full w-full overflow-hidden pb-[env(safe-area-inset-bottom)]">
    <div class="h-full w-full {white === true ? 'bg-white dark:bg-zinc-950' : 'bg-gray-100 dark:bg-zinc-950'} flex flex-col relative overflow-y-auto">
      <slot />    
    </div>
  </div>
{:else}
  
  <div style="-webkit-transform: translateZ(0);" class="h-full w-full {white === true ? 'bg-white' : 'bg-gray-100'} dark:bg-zinc-950 flex flex-col relative overflow-y-auto pb-[env(safe-area-inset-bottom)]">
    <slot />    
  </div>
{/if}