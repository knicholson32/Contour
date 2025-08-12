<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import { browser } from "$app/environment";
  import { afterNavigate, goto } from "$app/navigation";
  import { page } from '$app/state';
  import { backArrow, backButtonClicked, backText as _backText } from "$lib/stores";
  import { onMount } from "svelte";

  let _altURLParamsObj: URLSearchParams = new URLSearchParams(page.url.search);

  interface Props {
    /**
     * Specifies whether to treat the zone around the bottom of the screen as a pure safe-zone,
     * or whether to treat it as an area that should be seen through (scroll)
     */
    menuZone?: 'safe' | 'scroll';
    formZone?: 'safe' | 'scroll';

    menu: import('svelte').Snippet;
    form: import('svelte').Snippet;

    urlActiveParam?: string;
    urlFormParam?: string;

    scrollToDiv?: HTMLDivElement | HTMLAnchorElement | undefined;

    isMobileSize?: boolean;

    /**
     * Whether or not the columns should be resizable
     */
    resizable?: boolean;

    /**
     * Sizes for each column
     */
    minSizes?: { menu: number, form: number };
    defaultRatio?: number;
    ratio?: number;

    /**
     * Adjust what the back text should be for this form
     */
    backText?: string;
    ref?: string | null;

    onMenuBack?: (() => void) | null;
    afterDrag?: (() => void);
  }

  let { 
    menuZone = 'safe',
    formZone = 'safe',
    menu,
    form,
    urlActiveParam = $bindable(),
    urlFormParam = $bindable(),
    scrollToDiv = $bindable(),
    isMobileSize = $bindable(),
    resizable = true,
    minSizes = { menu: 250, form: 475 },
    defaultRatio = 0.25,
    ratio = undefined,
    backText = 'Back',
    ref = null,
    onMenuBack = null,
    afterDrag = () => {}
  }: Props = $props();


  if (urlActiveParam === undefined) urlActiveParam = _altURLParamsObj.toString();
  $effect.pre(() => {
    if (urlActiveParam === undefined) urlActiveParam = _altURLParamsObj.toString();
  });
  
  if (urlFormParam === undefined) urlFormParam = _altURLParamsObj.toString();
  $effect.pre(() => {
    if (urlFormParam === undefined) urlFormParam = _altURLParamsObj.toString();
  });

  if (isMobileSize === undefined) isMobileSize = true;
  $effect.pre(() => {
    if (isMobileSize === undefined) isMobileSize = true;
  });

  // TODO: Save this ratio so when the user loads it defaults to that (no layout shifting though)
  // TODO: Instead of using a ratio, use width of the menu, that way the menu initially starts as the same size no matter the window size
  if (ratio === undefined) ratio = defaultRatio;


  /**
   * Specifies which side should be active in single-column mode
   */
  let activeOnSingleCol: 'menu' | 'form' = $state(page.url.searchParams.get('active') as 'menu' | 'form');
  $effect(() => {
    if (activeOnSingleCol !== 'menu' && activeOnSingleCol !== 'form') activeOnSingleCol = 'menu';
  });
  

  export const alterParamsWithMenuSwap = (mods: { [key: string]: string }) => {
    const params = new URLSearchParams(page.url.search);
    params.set('active', (activeOnSingleCol === 'form' ? 'menu' : 'form'));
    for (const key of Object.keys(mods)) params.set(key, mods[key]);
    return params;
  }

  const updateURLParams = () => {
    _altURLParamsObj = new URLSearchParams(page.url.search);
    _altURLParamsObj.set('active', 'form');
    urlFormParam = _altURLParamsObj.toString();
    _altURLParamsObj.set('active', (activeOnSingleCol === 'form' ? 'menu' : 'form'));
    urlActiveParam = _altURLParamsObj.toString();
  }

  $effect(() => {
    page.url.pathname;
    page.url.search;
    let active = page.url.searchParams.get('active');
    if (active === null) active = (new URLSearchParams(page.url.search)).get('active');
    if (active === 'menu' || active === 'form') activeOnSingleCol = active;
    // urlActiveParam = 'active=' + (activeOnSingleCol === 'form' ? 'menu' : 'form');

    updateURLParams();
  });

  let formDiv: HTMLDivElement | null = $state(null);
  afterNavigate(() => {
    updateURLParams();
    formDiv?.scrollTo({ top: 0 });
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

  $effect(() => {
    if (scrollToDiv === undefined) return;
    scrollTo(scrollToDiv);
  });


  let innerWidth: number = $state(0);

  $effect(() => {
    $_backText = backText;
  });
  
  $effect(() => {
    $backArrow = (activeOnSingleCol === 'form'  || onMenuBack !== null) && innerWidth < 768;
    isMobileSize = innerWidth < 768;
  });


  let wrapper: HTMLDivElement;
  let _menu: HTMLDivElement | null = $state(null);
  let dragging = $state(false);


  $backButtonClicked = () => {
    console.log('Back button')
    if (activeOnSingleCol === 'form') {
      if (ref === null) {
        page.url.searchParams.set('active', 'menu');
        goto(page.url.pathname + '?' + page.url.searchParams.toString(), { replaceState: true, noScroll: false });
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
<div bind:this={wrapper} class="h-full w-full flex flex-row relative overflow-hidden" style="--column-width: {(ratio ?? 0.25) * 100}%; --menu-min-width: {minSizes.menu}px;" role="presentation">
  {#if menuZone === 'safe'}
    <div bind:this={_menu} style="-webkit-transform: translateZ(0);" class="box-border mb-[env(safe-area-inset-bottom)] {dragging ? '' : 'transition-width'} w-full bg-white dark:bg-zinc-950 md:w-(--column-width) md:min-w-(--menu-min-width) shrink-0 flex-col overflow-y-auto {activeOnSingleCol === 'menu' ? 'flex' : 'hidden'} md:flex print:hidden print:md:hidden">
      {@render menu()}
    </div>
    <!-- <div style="-webkit-transform: translateZ(0);" class="box-border pb-[env(safe-area-inset-bottom)] w-full flex-col overflow-y-scroll {activeOnSingleCol === 'menu' ? 'flex md:hidden' : 'hidden'}">
      <slot name="mobile-menu">
        {@render menu()}
      </slot>
    </div> -->
  {:else}
    <div bind:this={_menu}  style="-webkit-transform: translateZ(0);" class="box-border pb-[env(safe-area-inset-bottom)] {dragging ? '' : 'transition-width'} w-full bg-white dark:bg-zinc-950 md:w-(--column-width) md:min-w-(--menu-min-width) shrink-0 flex-col overflow-y-auto {activeOnSingleCol === 'menu' ? 'flex' : 'hidden'} md:flex print:hidden print:md:hidden">
      {@render menu()}
    </div>
    <!-- <div style="-webkit-transform: translateZ(0);" class="box-border pb-[env(safe-area-inset-bottom)] w-full flex-col overflow-y-scroll {activeOnSingleCol === 'menu' ? 'flex md:hidden' : 'hidden'}">
      <slot name="mobile-menu">
        {@render menu()}
      </slot>
    </div> -->
  {/if}

  <!-- Separator -->
  {#if resizable}
    <div class="h-full shrink-0 bg-gray-100 dark:bg-zinc-800 relative select-none w-2 justify-center hidden md:flex print:md:hidden">
      <div onmousedown={dragStart} ontouchstart={dragStart} class="absolute z-30 w-6 border-l border-white dark:border-zinc-700 bg-transparant cursor-col-resize top-0 bottom-0 left-1 flex justify-center" role="presentation">
        <!-- <div class="h-full w-px bg-white dark:bg-zinc-700"></div> -->
      </div>
    </div>
  {:else}
    <div class="h-full shrink-0 bg-gray-200 dark:bg-zinc-800 relative select-none w-px justify-center hidden md:block"></div>
  {/if}

  <!-- Form -->
  {#if formZone === 'safe'}
    <!-- -webkit-transform: translateZ(0); -->
    <div style="" bind:this={formDiv} class="box-border w-full bg-gray-100 dark:bg-zinc-925 mb-[env(safe-area-inset-bottom)] flex flex-col overflow-y-auto {activeOnSingleCol === 'form' ? '' : 'hidden md:block'}">
      {@render form()}
    </div>
  {:else}
    <!-- -webkit-transform: translateZ(0); -->
    <div style="" bind:this={formDiv} class="box-border w-full bg-gray-100 dark:bg-zinc-925 pb-[env(safe-area-inset-bottom)] flex flex-col overflow-y-auto {activeOnSingleCol === 'form' ? '' : 'hidden md:block'}">
      {@render form()}
    </div>
  {/if}
</div>