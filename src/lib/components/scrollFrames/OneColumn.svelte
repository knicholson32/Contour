<script lang="ts">

  /**
   * Specifies whether to treat the zone around the bottom of the screen as a pure safe-zone,
   * or whether to treat it as an area that should be seen through (scroll)
   */
  export let type: 'safe' | 'scroll' = 'scroll';

</script>

{#if type === 'safe'}
  <div class="h-full w-full overflow-hidden pb-[env(safe-area-inset-bottom)]">
    <div class="h-full w-full flex flex-col relative overflow-y-scroll">
      <slot />    
    </div>
  </div>
{:else}
  <div class="h-full w-full flex flex-col relative overflow-y-scroll pb-[env(safe-area-inset-bottom)]">
    <slot />    
  </div>
{/if}