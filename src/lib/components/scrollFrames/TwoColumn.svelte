<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { backArrow, backButtonClicked, backText as _backText } from "$lib/stores";
  import { onMount } from "svelte";


  /**
   * Specifies whether to treat the zone around the bottom of the screen as a pure safe-zone,
   * or whether to treat it as an area that should be seen through (scroll)
   */
  export let menu: 'safe' | 'scroll' = 'safe';
  export let form: 'safe' | 'scroll' = 'safe';


  /**
   * Specifies which side should be active in single-column mode
   */
  let activeOnSingleCol: 'menu' | 'form' = $page.url.searchParams.get('active') as 'menu' | 'form';
  if (activeOnSingleCol !== 'menu' && activeOnSingleCol !== 'form') activeOnSingleCol = 'menu';
  export let urlActiveParam = 'active=' + (activeOnSingleCol === 'form' ? 'menu' : 'form');

  export let isMobileSize = true;

  $: {
    $page.url.pathname;
    $page.url.search;
    let active = $page.url.searchParams.get('active');
    if (active === null) active = (new URLSearchParams($page.url.search)).get('active');
    if (active === 'menu' || active === 'form') activeOnSingleCol = active;
    urlActiveParam = 'active=' + (activeOnSingleCol === 'form' ? 'menu' : 'form');
    // console.log($page.url.pathname, $page.url.search, active, activeOnSingleCol);
  }

  let innerWidth: number;
  $:{
    $backArrow = activeOnSingleCol === 'form' && innerWidth < 768;
    isMobileSize = innerWidth < 768;
  }

  /**
   * Whether or not the columns should be resizable
   */
  export let resizable = true;

  /**
   * Sizes for each column
   */
  export let minSizes = { menu: 200, form: 475 };
  export let defaultRatio = 0.33;
  // TODO: Save this ratio so when the user loads it defaults to that (no layout shifting though)
  export let ratio = defaultRatio;

  /**
   * Adjust what the back text should be for this form
   */
  export let backText = 'Back';
  $:{
    $_backText = backText;
  }

  let wrapper: HTMLDivElement;
  let _menu: HTMLDivElement;
  let dragging = false;


  $backButtonClicked = () => {
    console.log('Back button')
    if (activeOnSingleCol === 'form') $page.url.searchParams.set('active', 'menu');
    else $page.url.searchParams.set('active', 'form');
    console.log($page.url.pathname + '?' + $page.url.searchParams.toString())
    goto($page.url.pathname + '?' + $page.url.searchParams.toString(), { replaceState: true, noScroll: false });
    activeOnSingleCol = activeOnSingleCol;
  };


  const dragStart = () => {
    dragging = true;
    wrapper.ontouchend = dragEnd;
    wrapper.ontouchmove = mouseMove;
  }
  const dragEnd = () => {
    dragging = false;
    wrapper.ontouchend = undefined;
    wrapper.ontouchmove = undefined;
  }
  const mouseMove = (e: MouseEvent | TouchEvent) => {
    if (!dragging) return false;

    // Get offset
    const containerOffsetLeft = wrapper.offsetLeft;
    const containerOffsetWidth = wrapper.offsetWidth;

    // Get x-coordinate of pointer relative to container
    const pointerRelativeXpos = (e instanceof MouseEvent ? e.clientX : (e as any).pageX) - containerOffsetLeft;
    
    // Arbitrary minimum width set on box A, otherwise its inner content will collapse to width of 0
    const boxAminWidth = minSizes.menu;
    const boxBminWidth = minSizes.form;

    // --------------------------- 850
    // --- 125 -- X --- (850-375) ----

    // Resize box A
    // * 8px is the left/right spacing between .handler and its inner pseudo-element
    const w = (Math.min(Math.max(boxAminWidth, pointerRelativeXpos - 4), containerOffsetWidth - boxBminWidth));
    ratio = w / containerOffsetWidth;
  }

  onMount(() => {
    if (!browser) return;
    if (!resizable) return;

    // Only attach these listeners if we need them
    wrapper.onmousemove = mouseMove;
    wrapper.onmouseup = dragEnd;
    wrapper.onmouseleave = dragEnd;
    wrapper.ontouchcancel = dragEnd;
  })


</script>

<svelte:window bind:innerWidth />

<!-- Menu -->
<div bind:this={wrapper} class="h-full w-full flex flex-row relative overflow-hidden" style="--column-width: {ratio * 100}%;" role="presentation">
  {#if menu === 'safe'}
    <div bind:this={_menu} style="-webkit-transform: translateZ(0);" class="box-border mb-[env(safe-area-inset-bottom)] {dragging ? '' : 'transition-width'} w-full md:w-[--column-width] flex-shrink-0 flex-col overflow-y-scroll {activeOnSingleCol === 'menu' ? 'flex' : 'hidden'} md:flex">
      <slot name="menu"/>
    </div>
    <!-- <div style="-webkit-transform: translateZ(0);" class="box-border pb-[env(safe-area-inset-bottom)] w-full flex-col overflow-y-scroll {activeOnSingleCol === 'menu' ? 'flex md:hidden' : 'hidden'}">
      <slot name="mobile-menu">
        <slot name="menu"/>
      </slot>
    </div> -->
  {:else}
    <div bind:this={_menu}  style="-webkit-transform: translateZ(0);" class="box-border pb-[env(safe-area-inset-bottom)] {dragging ? '' : 'transition-width'} w-full md:w-[--column-width] flex-shrink-0 flex-col overflow-y-scroll {activeOnSingleCol === 'menu' ? 'flex' : 'hidden'} md:flex">
      <slot name="menu"/>
    </div>
    <!-- <div style="-webkit-transform: translateZ(0);" class="box-border pb-[env(safe-area-inset-bottom)] w-full flex-col overflow-y-scroll {activeOnSingleCol === 'menu' ? 'flex md:hidden' : 'hidden'}">
      <slot name="mobile-menu">
        <slot name="menu"/>
      </slot>
    </div> -->
  {/if}

  <!-- Separator -->
  {#if resizable}
    <div class="h-full flex-shrink-0 bg-gray-100 relative select-none w-2 justify-center hidden md:flex">
      <div on:mousedown={dragStart} on:touchstart={dragStart} class="absolute z-30 w-12 cursor-col-resize bg-transparent top-0 bottom-0 flex justify-center" role="presentation">
        <div class="h-full w-[1px] bg-white"></div>
      </div>
    </div>
  {:else}
    <div class="h-full flex-shrink-0 bg-gray-200 relative select-none w-[1px] justify-center hidden md:block"></div>
  {/if}

  <!-- Form -->
  {#if form === 'safe'}
    <div style="-webkit-transform: translateZ(0);" class="box-border bg-gray-100 mb-[env(safe-area-inset-bottom)] flex flex-col overflow-y-scroll {activeOnSingleCol === 'form' ? '' : 'hidden md:block'}">
      <slot name="form"/>
    </div>
  {:else}
    <div style="-webkit-transform: translateZ(0);" class="box-border bg-gray-100 pb-[env(safe-area-inset-bottom)] flex flex-col overflow-y-scroll {activeOnSingleCol === 'form' ? '' : 'hidden md:block'}">
      <slot name="form"/>
    </div>
  {/if}
</div>