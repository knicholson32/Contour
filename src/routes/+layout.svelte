<script lang="ts">
  import { page } from "$app/state";
  import { cubicIn, cubicInOut, cubicOut } from "svelte/easing";
  import "../app.css";
  import { EscapeOrClickOutside } from "$lib/components/events";
  import { fade, scale, slide } from "svelte/transition";
  import { backArrow, backButtonClicked, backText, unsaved } from "$lib/stores";
  import { icons } from "$lib/components";
  import * as Popover from "$lib/components/ui/popover";
  import { ModeWatcher } from "mode-watcher";
  import { Briefcase, ChevronRight, GitCommitVertical, Link, Plane, Send, Tag } from "lucide-svelte";
  // import ProgressBar from "$lib/components/decorations/ProgressBar.svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import NProgress from 'nprogress';

  export let data: import('./$types').PageData;

  // -----------------------------------------------------------------------------------------------
	// Navigation Menus
	// -----------------------------------------------------------------------------------------------

  type Submenu = {
    title: string,
    href: string, 
    icon: string,
    description: string,
  };

  type Menu = {
    title: string,
    href: string,
    submenu?: Submenu[],
    popover: false
  }[];

  // Menu contents
  const menu: Menu = [
    { title: 'Dashboard', popover: false,  href: '/' },
    { title: 'Entry', popover: false, href: `/entry`, submenu: [ { title: 'Tours', href: '/entry/tour', icon: 'briefcase', description: 'Enter flights that are associated with a work tour or duty day.'}, { title: 'Legs', href: '/entry/leg', icon: 'send', description: 'Enter generic flights that are not associated with a tour.'}] },
    { title: 'Aircraft', popover: false, href: '/aircraft', submenu: [ { title: 'Aircraft', href: '/aircraft/entry', icon: 'plane', description: 'Document specific aircraft flown in flight legs.'}, { title: 'Types', href: '/aircraft/type', icon: 'tag', description: 'Create and manage common aircraft types.'}] },
    { title: 'Logbook', popover: false, href: '/logbook' },
    { title: 'Airports', popover: false, href: '/airports' },
  ];

  // const p: typeof Popover.Root;

  // const attachPopoverRoot = (element: typeof Popover.Root) => {

  // }

  // Mobile menu controls
  let mobileNavMenuVisible = false;
  let menuHeaderBar: HTMLElement;
	const closeMobileMenu = () => mobileNavMenuVisible = false;
  const toggleMobileMenu = () => mobileNavMenuVisible = !mobileNavMenuVisible;

	// -----------------------------------------------------------------------------------------------
	// Profile Menus
	// -----------------------------------------------------------------------------------------------

  // Menu contents
  const profileMenu = [
    { title: 'Profile', href: '/profile' },
    { title: 'Settings', href: '/settings' },
    { title: 'Sign out', href: '/signout' },
  ];

	// Primary profile menu
  let profileBar: HTMLElement;
	let profileMenuVisible = false;
	const toggleAccountDropdown = () => profileMenuVisible = !profileMenuVisible;
	const closeAccountDropdown = () => profileMenuVisible = false;

  // let progress: ProgressBar;
  let width = 0;

  NProgress.settings.showSpinner = false;


  beforeNavigate((navigate) => {
    if (navigate.type !== 'leave') {
      // NProgress.trickle();
      NProgress.start();
      // if (NProgress.isStarted())
    }
    // if (progress !== undefined && (navigate.type !== 'leave' && navigate.type !== 'popstate')) {
    //   progress.start();
    //   // width = 0.75;
    //   // navigate.complete.finally(() => {
    //   //   if (progress !== undefined) progress.complete();
    //   // });
    // }
    navigate.complete.finally(() => {
      NProgress.done();
    });
  });

  afterNavigate((navigate) => {

    closeAccountDropdown();
    closeMobileMenu();

  //   /**
  //    * New page load:
  //    *  from: null
  //    *  to: {params: {…}, route: {…}, url: URL}
  //    *  type: "enter"
  //    *  willUnload: false
  //    * 
  //    * In-App Navigation:
  //    *  from: {params: {…}, route: {…}, url: URL}
  //    *  to: {params: {…}, route: {…}, url: URL}
  //    *  type: "link"
  //    *  willUnload: false
  //    * 
  //    * Back / Forward Button:
  //    *  from: {params: {…}, route: {…}, url: URL}
  //    *  to: {params: {…}, route: {…}, url: URL}
  //    *  delta: -1
  //    *  type: "popstate"
  //    *  willUnload: false
  //    */
    if (NProgress.isStarted()) NProgress.done();
  });

</script>

<svelte:head>
	{#if page.data.seo === undefined}
		<title>Contour</title>
		<meta name="description" content="Contour" />
	{:else}
		<title>Contour | {page.data.seo.title}</title>
		<meta name="description" content={page.data.seo?.description} />
	{/if}
</svelte:head>

<ModeWatcher />

<!--
  This example requires updating your template:

  ```
  <html class="h-full">
  <body class="h-full">
  ```
-->

<nav bind:this={menuHeaderBar} class="print:hidden relative z-50 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-16">
  <div class="mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 justify-between select-none">
      <div class="flex">
        {#if $backArrow}
          <div class="flex items-center gap-2 justify-center">
            <button on:click={$backButtonClicked} type="button" class="touch-manipulation text-center flex-grow select-none inline-flex items-center gap-1 transition-colors pl-1 pr-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
              ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100 betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-800 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white">
              <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                {@html icons.chevronLeft}
              </svg>
              {$backText}
            </button>
            {#if $unsaved}
              <span class="font-mono text-xxs px-2 rounded-full bg-sky-600 text-white dark:bg-transparent dark:border dark:border-sky-400 dark:text-sky-400 font-bold block sm:hidden">UNSAVED</span>
            {/if}
          </div>
        {:else}
          <div class="flex flex-shrink-0 items-center">
            <a href="/">
              <img class="block w-9 h-auto lg:hidden" src="/logo-inverted.png" alt="Contour">
              <img class="hidden w-9 h-auto lg:block" src="/logo-inverted.png" alt="Contour">
            </a>
          </div>
        {/if}

        {#if data.settings["entry.tour.current"] !== -1}
          <div class="m-3 flex items-center">
            <a href="/entry/day?tour={data.settings["entry.tour.current"]}" class="uppercase select-none border border-sky-400 text-sky-400 rounded-md py-2 px-3 whitespace-nowrap">
              On Tour
            </a>
          </div>
        {:else}
          <div class="sm:ml-6"></div>
        {/if}
        <div class="hidden sm:-my-px sm:flex sm:space-x-8">
          <!-- Desktop Menu -->
          {#each menu as m, i}
            {#if m.submenu !== undefined}
              <Popover.Root bind:open={m.popover} >
                  {#if (page.url.pathname === '/' && m.href === '/') || (m.href !== '/' && page.url.pathname.startsWith('/' + m.href.split('/')[1]))}
                    <Popover.Trigger class="border-sky-500 relative z-40 text-gray-900 dark:text-white inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium">{m.title}</Popover.Trigger>
                  {:else}
                    <Popover.Trigger class="border-transparent relative z-40 text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium">{m.title}</Popover.Trigger>
                  {/if}
                  <Popover.Content class="grid grid-cols-1 gap-x-4 gap-y-1 p-0 w-auto text-sm rounded-lg dark:bg-zinc-800 dark:border dark:border-zinc-900">
                    {#each m.submenu as item}
                      <div class="group relative flex gap-x-6 first:rounded-b-none rounded-lg last:rounded-t-none p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 dark:bg-zinc-800">
                        <div class="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white dark:bg-zinc-900 dark:group-hover:bg-zinc-950">
                          {#if item.icon === 'briefcase'}
                            <Briefcase class="h-6 w-6 text-gray-600 group-hover:text-sky-600 dark:text-gray-400" />
                          {:else if item.icon === 'send'}
                            <Send class="h-6 w-6 text-gray-600 group-hover:text-sky-600 dark:text-gray-400" />
                          {:else if item.icon === 'plane'}
                            <Plane class="h-6 w-6 text-gray-600 group-hover:text-sky-600 dark:text-gray-400" />
                          {:else if item.icon === 'tag'}
                            <Tag class="h-6 w-6 text-gray-600 group-hover:text-sky-600 dark:text-gray-400" />
                          {:else}
                            <Link class="h-6 w-6 text-gray-600 group-hover:text-sky-600 dark:text-gray-400" />
                          {/if}
                        </div>
                        <div class="mt-1">
                          <a href="{item.href}" on:click={() => m.popover = false} class="font-semibold text-gray-900 dark:text-gray-100">
                            {item.title}
                            <span class="absolute inset-0"></span>
                          </a>
                          <p class="mt-0 text-gray-600 dark:text-gray-400 pr-2">{item.description}</p>
                        </div>
                      </div>
                    {/each}
                  </Popover.Content>
                </Popover.Root>
            {:else}
              <!-- Current: "border-sky-500 text-gray-900", Default: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700" -->
              {#if (page.url.pathname === '/' && m.href === '/') || (m.href !== '/' && page.url.pathname.startsWith('/' + m.href.split('/')[1]))}
                <a href="{m.href}" class="border-sky-500 relative z-40 text-gray-900 dark:text-white inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium" aria-current="page">{m.title}</a>  
              {:else}
                <a href="{m.href}" class="border-transparent relative z-40 text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium">{m.title}</a>  
              {/if}
            {/if}
          {/each}
        </div>
      </div>
      <div class="hidden sm:ml-6 sm:flex sm:items-center">
        <!-- <button type="button" class="relative rounded-full p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
          <span class="absolute -inset-1.5"></span>
          <span class="sr-only">View notifications</span>
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button> -->

        <!-- Profile dropdown -->
        <div bind:this={profileBar} use:EscapeOrClickOutside={{ callback: closeAccountDropdown, except: profileBar }} class="relative ml-3">
          <div>
            <button type="button" on:click={toggleAccountDropdown} class="touch-manipulation relative flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">Open user menu</span>
              <img class="h-8 w-8 rounded-full" src="https://www.gravatar.com/avatar/{data.settings["general.gravatar.hash"]}?s=300&d=identicon" alt="">
              {#if data.contourUpdates}
                <span class="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>
              {/if}
            </button>
          </div>

          <!--
            Dropdown menu, show/hide based on menu state.

            Entering: "transition ease-out duration-200"
              From: "transform opacity-0 scale-95"
              To: "transform opacity-100 scale-100"
            Leaving: "transition ease-in duration-75"
              From: "transform opacity-100 scale-100"
              To: "transform opacity-0 scale-95"
          -->
          {#if profileMenuVisible}
            <div in:fade={{ duration: 200, easing: cubicOut }} out:fade={{ duration: 75, easing: cubicIn }}>
              <div in:scale={{ duration: 200, easing: cubicOut}} out:scale={{ duration: 75, easing: cubicIn }}>
                <div class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-zinc-900 py-1 shadow-lg ring-1 ring-black dark:ring-zinc-800 ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
                  <!-- Active: "bg-gray-100", Not Active: "" -->
                  {#each profileMenu as m}
                    {#if page.url.pathname.startsWith(m.href)}
                      <a href="{m.href}" on:click={closeAccountDropdown} class="bg-gray-100 dark:bg-zinc-800 block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-1">{m.title}</a>
                    {:else}
                      <a href="{m.href}" on:click={closeAccountDropdown} class="hover:bg-gray-50 dark:hover:bg-zinc-800 block px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white" role="menuitem" tabindex="-1" id="user-menu-item-1">{m.title}</a>
                    {/if}
                  {/each}
                  <div class="w-full border-t"></div>
                  <a href="/changelog?lastCommit={data.lastCommit}" data-sveltekit-reload on:click={closeAccountDropdown} class="w-full text-left inline-flex items-center relative hover:bg-gray-50 dark:hover:bg-zinc-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white">
                    {#if data.contourUpdates}
                      <div class="absolute -left-0">
                        <GitCommitVertical class="w-4 h-4 text-sky-500" />
                      </div>
                    {/if}
                    See What's New
                  </a>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
      <div class="-mr-2 flex items-center sm:hidden">
        <!-- Mobile menu button -->
        <button type="button" on:click={toggleMobileMenu} class="touch-manipulation relative inline-flex items-center justify-center rounded-md  p-2 text-gray-400 dark:text-gray-200 betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-800 betterhover:hover:text-gray-500 dark:betterhover:hover:text-white {mobileNavMenuVisible ? 'bg-gray-100 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900'} focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2" aria-controls="mobile-menu" aria-expanded="false">
          <span class="absolute -inset-0.5"></span>
          <span class="sr-only">Open main menu</span>
          <!-- Menu open: "hidden", Menu closed: "block" -->
          <svg class="{mobileNavMenuVisible ? 'hidden' : 'block'} h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <!-- Menu open: "block", Menu closed: "hidden" -->
          <svg class="{mobileNavMenuVisible ? 'block' : 'hidden'} h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile menu, show/hide based on menu state. -->
  {#if mobileNavMenuVisible}
    <div in:fade={{ duration: 100, easing: cubicOut }} out:fade={{ duration: 75, easing: cubicIn }}
      use:EscapeOrClickOutside={{ callback: closeMobileMenu, except: menuHeaderBar }} 
      class="sm:hidden select-none absolute left-0 right-0 bg-white dark:bg-zinc-900 z-50 shadow-md dark:border-zinc-600 dark:border-b-2" id="mobile-menu">
      <div class="space-y-1 pb-3 pt-2">
        <!-- Mobile Menu -->
        {#each menu as m}
          <!-- Current: "border-sky-500 bg-sky-50 text-sky-700", Default: "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800" -->
            {#if (page.url.pathname === '/' && m.href === '/') || (m.href !== '/' && page.url.pathname.startsWith('/' + m.href.split('/')[1]))}
              <a href="{m.href}" on:click={closeMobileMenu} class="border-sky-500 bg-sky-50/50 dark:bg-slate-800/25 text-sky-500 block border-l-4 py-2 pl-3 pr-4 text-base font-medium" aria-current="page">{m.title}</a>  
            {:else}
              <a href="{m.href}" on:click={closeMobileMenu} class="border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-gray-200 block border-l-4 py-2 pl-3 pr-4 text-base font-medium">{m.title}</a>  
            {/if}
          {#if m.submenu !== undefined}
            {#each m.submenu as item}
              <a href="{item.href}" on:click={closeMobileMenu} class="flex gap-3 items-center py-2 pl-3 pr-4 text-base font-medium" aria-current="page">
                <ChevronRight class="w-5 h-5"/>
                <span>{item.title}</span>
              </a>  
            {/each}
          {/if}
        {/each}
      </div>
      <div class="border-t bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 pb-3 pt-4">
        <div class="flex items-center px-4">
          <div class="flex-shrink-0">
            <img class="h-10 w-10 rounded-full" src="https://www.gravatar.com/avatar/{data.settings["general.gravatar.hash"]}?s=300&d=identicon" alt="">
          </div>
          <div class="ml-3">
            <div class="text-base font-medium text-gray-800 dark:text-gray-200">{data.settings["general.name"]}</div>
            <div class="text-sm font-medium text-gray-500">{data.settings["general.email"]}</div>
          </div>
          <!-- <button type="button" class="relative ml-auto flex-shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
            <span class="absolute -inset-1.5"></span>
            <span class="sr-only">View notifications</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button> -->
        </div>
        <div class="mt-3 space-y-1">
          {#each profileMenu as m}
            {#if page.url.pathname.startsWith(m.href)}
              <a href="{m.href}" on:click={closeMobileMenu} class="block px-4 py-2 text-base font-medium border-sky-500 bg-sky-50 dark:bg-slate-800/25 text-sky-700 dark:text-sky-400">{m.title}</a>
            {:else}
              <a href="{m.href}" on:click={closeMobileMenu} class="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-gray-200">{m.title}</a>
            {/if}
          {/each}
          <div class="w-full border-t"></div>
          <a href="/changelog?lastCommit={data.lastCommit}" data-sveltekit-reload on:click={closeMobileMenu} class="inline-flex w-full items-center px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-gray-200"> 
            {#if data.contourUpdates}
              <div class="absolute -left-0">
                <GitCommitVertical class="w-4 h-4 text-sky-500" />
              </div>
            {/if}
            See What's New
          </a>
        </div>
      </div>
    </div>
  {/if}
</nav>

<div class=" relative overflow-y-hidden -mt-[1px] pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]" style="height: calc(100% - 4rem + 1px);">
  <div class="fixed top-[4rem] left-0 right-0 z-[101] h-[2px] overflow-hidden">
    <!-- <ProgressBar bind:this={progress} minimum={0} bind:width={width} /> -->
  </div>
  <slot/>
</div>