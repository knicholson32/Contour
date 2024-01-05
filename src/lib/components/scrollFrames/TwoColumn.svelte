<!-- <div class="h-full w-full flex flex-col md:flex-row-reverse relative overflow-y-scroll md:overflow-hidden pb-[env(safe-area-inset-bottom)] md:pb-0">
  <div class="md:overflow-y-scroll pb-[env(safe-area-inset-bottom)]">
    <slot name="right"/>    
  </div>
  <div class="md:overflow-y-scroll pb-[env(safe-area-inset-bottom)]">
    <slot name="left"/>
  </div>
</div> -->

<script lang="ts">

  /**
   * Specifies whether to treat the zone around the bottom of the screen as a pure safe-zone,
   * or whether to treat it as an area that should be seen through (scroll)
   */
  export let left: 'safe' | 'scroll' = 'safe';
  export let right: 'safe' | 'scroll' = 'safe';

  export let activeOnSingleCol: 'right' | 'left' = 'right';

</script>

<!-- {#if type === 'safe'}
  <div class="h-full w-full overflow-hidden pb-[env(safe-area-inset-bottom)] md:pb-0">
    <div class="h-full w-full flex flex-col md:flex-row-reverse relative overflow-y-scroll md:overflow-hidden">
      
      <div class="md:mb-[env(safe-area-inset-bottom)] md:overflow-y-scroll">
        <slot name="right"/>    
      </div>
      
      <div class="md:mb-[env(safe-area-inset-bottom)] md:overflow-y-scroll">
        <slot name="left"/>
      </div>

    </div>
  </div>
{:else} -->


<div class="h-full w-full flex flex-col md:flex-row relative overflow-hidden">
  {#if left === 'safe'}
    <div class="mb-[env(safe-area-inset-bottom)] overflow-y-scroll {activeOnSingleCol === 'right' ? 'hidden md:block' : ''}">
      <slot name="left"/>
    </div>
  {:else}
    <div class="pb-[env(safe-area-inset-bottom)] overflow-y-scroll {activeOnSingleCol === 'right' ? 'hidden md:block' : ''}">
      <slot name="left"/>
    </div>
  {/if}
  {#if right === 'safe'}
    <div class="mb-[env(safe-area-inset-bottom)] overflow-y-scroll {activeOnSingleCol === 'left' ? 'hidden md:block' : ''}">
      <slot name="right"/>
    </div>
  {:else}
    <div class="pb-[env(safe-area-inset-bottom)] overflow-y-scroll {activeOnSingleCol === 'left' ? 'hidden md:block' : ''}">
      <slot name="right"/>
    </div>
  {/if}
</div>


<!-- 
{#if type === 'safe'}
  <div class="h-full w-full overflow-hidden pb-[env(safe-area-inset-bottom)] md:pb-0">
    <div class="h-full w-full flex flex-col md:flex-row-reverse relative overflow-y-scroll md:overflow-hidden">
      
      <div class="md:mb-[env(safe-area-inset-bottom)] md:overflow-y-scroll">
        <slot name="right"/>    
      </div>
      
      <div class="md:mb-[env(safe-area-inset-bottom)] md:overflow-y-scroll">
        <slot name="left"/>
      </div>

    </div>
  </div>
{:else}
  <div class="h-full w-full flex flex-col md:flex-row-reverse relative overflow-y-scroll md:overflow-hidden pb-[env(safe-area-inset-bottom)] md:pb-0">
    
    <div class="md:mb-[env(safe-area-inset-bottom)] md:overflow-y-scroll">
      <slot name="right"/>    
    </div>
    
    <div class="md:mb-[env(safe-area-inset-bottom)] md:overflow-y-scroll">
      <slot name="left"/>
    </div>

  </div>
{/if}

 -->