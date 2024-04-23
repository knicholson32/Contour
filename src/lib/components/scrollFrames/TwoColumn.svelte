<script lang="ts">
  import { browser } from "$app/environment";
  import { afterNavigate, goto } from "$app/navigation";
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
  // export let urlActiveParam = 'active=' + (activeOnSingleCol === 'form' ? 'menu' : 'form');
  

  let _altURLParamsObj: URLSearchParams = new URLSearchParams($page.url.search);
  _altURLParamsObj.set('active', (activeOnSingleCol === 'form' ? 'menu' : 'form'));

  export let urlActiveParam: string = _altURLParamsObj.toString();
  export let urlFormParam: string = _altURLParamsObj.toString();

  export let scrollToDiv: HTMLDivElement | HTMLAnchorElement | null = null;


  export const alterParamsWithMenuSwap = (mods: { [key: string]: string }) => {
    const params = new URLSearchParams($page.url.search);
    params.set('active', (activeOnSingleCol === 'form' ? 'menu' : 'form'));
    for (const key of Object.keys(mods)) params.set(key, mods[key]);
    return params;
  }

  export let isMobileSize = true;

  const updateURLParams = () => {
    _altURLParamsObj = new URLSearchParams($page.url.search);
    _altURLParamsObj.set('active', 'form');
    urlFormParam = _altURLParamsObj.toString();
    _altURLParamsObj.set('active', (activeOnSingleCol === 'form' ? 'menu' : 'form'));
    urlActiveParam = _altURLParamsObj.toString();
  }

  $: {
    $page.url.pathname;
    $page.url.search;
    let active = $page.url.searchParams.get('active');
    if (active === null) active = (new URLSearchParams($page.url.search)).get('active');
    if (active === 'menu' || active === 'form') activeOnSingleCol = active;
    // urlActiveParam = 'active=' + (activeOnSingleCol === 'form' ? 'menu' : 'form');

    updateURLParams();

    // tmpURL.searchParams.set('active', (activeOnSingleCol !== 'form' ? 'menu' : 'form'));
    // console.log($page.url.pathname, $page.url.search, active, activeOnSingleCol);
  }

  let formDiv: HTMLDivElement;
  afterNavigate(() => {
    updateURLParams();
    formDiv.scrollTo({ top: 0 });
  });

  // @see https://stackoverflow.com/a/22480938/5441886
  const isScrolledIntoView = (el: HTMLElement) => {
    let rect = el.getBoundingClientRect();
    let elemTop = rect.top;
    let elemBottom = rect.bottom;

    // Only completely visible elements return true:
    let isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
    // Partially visible elements return true:
    //isVisible = elemTop < window.innerHeight && elemBottom >= 0;
    return isVisible;
  }

  // Scroll to the proper div
  const scrollTo = (div: HTMLAnchorElement | HTMLDivElement | null) => {
    if (div === null) return;
    if (isMobileSize && activeOnSingleCol === 'form') return;
    if (!isScrolledIntoView(div)) {
      div.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
  $: scrollTo(scrollToDiv);


  let innerWidth: number;

  /**
   * Whether or not the columns should be resizable
   */
  export let resizable = true;

  /**
   * Sizes for each column
   */
  export let minSizes = { menu: 250, form: 475 };
  export let defaultRatio = 0.25;
  // TODO: Save this ratio so when the user loads it defaults to that (no layout shifting though)
  // TODO: Instead of using a ratio, use width of the menu, that way the menu initially starts as the same size no matter the window size
  export let ratio = defaultRatio;

  /**
   * Adjust what the back text should be for this form
   */
  export let backText = 'Back';
  export let ref: string | null = null;
  $:{
    $_backText = backText;
  }
  $:{
    $backArrow = (activeOnSingleCol === 'form'  || onMenuBack !== null) && innerWidth < 768;
    isMobileSize = innerWidth < 768;
  }

  export let onMenuBack: (() => void) | null = null;
  export let afterDrag = () => {};

  let wrapper: HTMLDivElement;
  let _menu: HTMLDivElement;
  let dragging = false;


  $backButtonClicked = () => {
    console.log('Back button')
    if (activeOnSingleCol === 'form') {
      if (ref === null) {
        $page.url.searchParams.set('active', 'menu');
        goto($page.url.pathname + '?' + $page.url.searchParams.toString(), { replaceState: true, noScroll: false });
      } else {
        goto(ref);
      }
    } else if (onMenuBack !== null) {
      $backArrow = false;
      onMenuBack();
    }
    activeOnSingleCol = activeOnSingleCol;
  };

  let moved = false;
  let initialRatio = ratio;

  const dragStart = () => {
    dragging = true;
    wrapper.ontouchend = dragEnd;
    wrapper.ontouchmove = mouseMove;
  }
  const dragEnd = () => {
    dragging = false;
    wrapper.ontouchend = undefined;
    wrapper.ontouchmove = undefined;
    if (moved) afterDrag();
    moved = false;
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
    if (ratio !== initialRatio) moved = true;
    initialRatio = ratio;
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
<div bind:this={wrapper} class="h-full w-full flex flex-row relative overflow-hidden" style="--column-width: {ratio * 100}%; --menu-min-width: {minSizes.menu}px;" role="presentation">
  {#if menu === 'safe'}
    <div bind:this={_menu} style="-webkit-transform: translateZ(0);" class="box-border mb-[env(safe-area-inset-bottom)] {dragging ? '' : 'transition-width'} w-full bg-white dark:bg-zinc-950 md:w-[--column-width] md:min-w-[--menu-min-width] flex-shrink-0 flex-col overflow-y-auto {activeOnSingleCol === 'menu' ? 'flex' : 'hidden'} md:flex">
      <slot name="menu"/>
    </div>
    <!-- <div style="-webkit-transform: translateZ(0);" class="box-border pb-[env(safe-area-inset-bottom)] w-full flex-col overflow-y-scroll {activeOnSingleCol === 'menu' ? 'flex md:hidden' : 'hidden'}">
      <slot name="mobile-menu">
        <slot name="menu"/>
      </slot>
    </div> -->
  {:else}
    <div bind:this={_menu}  style="-webkit-transform: translateZ(0);" class="box-border pb-[env(safe-area-inset-bottom)] {dragging ? '' : 'transition-width'} w-full bg-white dark:bg-zinc-950 md:w-[--column-width] md:min-w-[--menu-min-width] flex-shrink-0 flex-col overflow-y-auto {activeOnSingleCol === 'menu' ? 'flex' : 'hidden'} md:flex">
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
    <div class="h-full flex-shrink-0 bg-gray-100 dark:bg-zinc-800 relative select-none w-2 justify-center hidden md:flex">
      <div on:mousedown={dragStart} on:touchstart={dragStart} class="absolute z-30 w-6 border-l border-white dark:border-zinc-700 bg-transparant cursor-col-resize top-0 bottom-0 left-1 flex justify-center" role="presentation">
        <!-- <div class="h-full w-[1px] bg-white dark:bg-zinc-700"></div> -->
      </div>
    </div>
  {:else}
    <div class="h-full flex-shrink-0 bg-gray-200 dark:bg-zinc-800 relative select-none w-[1px] justify-center hidden md:block"></div>
  {/if}

  <!-- Form -->
  {#if form === 'safe'}
    <div style="-webkit-transform: translateZ(0);" bind:this={formDiv} class="box-border w-full bg-gray-100 dark:bg-zinc-900 mb-[env(safe-area-inset-bottom)] flex flex-col overflow-y-auto {activeOnSingleCol === 'form' ? '' : 'hidden md:block'}">
      <slot name="form"/>
    </div>
  {:else}
    <div style="-webkit-transform: translateZ(0);" bind:this={formDiv} class="box-border w-full bg-gray-100 dark:bg-zinc-900 pb-[env(safe-area-inset-bottom)] flex flex-col overflow-y-auto {activeOnSingleCol === 'form' ? '' : 'hidden md:block'}">
      <slot name="form"/>
    </div>
  {/if}
</div>