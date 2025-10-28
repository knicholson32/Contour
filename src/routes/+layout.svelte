<script lang="ts">
  import { page } from "$app/state";
  import { cubicIn, cubicInOut, cubicOut } from "svelte/easing";
  import "../app.css";
  import { onMount, setContext } from 'svelte';
  import { EscapeOrClickOutside } from "$lib/components/events";
  import { fade, scale, slide } from "svelte/transition";
  import { backArrow, backButtonClicked, backText, unsaved } from "$lib/stores";
  import { icons } from "$lib/components";
  import * as Popover from "$lib/components/ui/popover";
  import { ModeWatcher } from "mode-watcher";
  import { Briefcase, ChevronRight, GitCommitVertical, Link, Plane, Send, Tag, X} from "lucide-svelte";
  // import ProgressBar from "$lib/components/decorations/ProgressBar.svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import NProgress from 'nprogress';
  import escapeOrClickOutside from "$lib/components/events/escapeOrClickOutside";
  import type { GitCommit } from "$lib/server/api/git/schema";
  import { timeConverter } from "$lib/helpers";
    import { browser } from "$app/environment";

  interface Props {
    data: import('./$types').PageData;
    children?: import('svelte').Snippet;
  }

  let { data, children }: Props = $props();

  setContext('settings', data.settings);
  setContext('startAirport', data.startAirport);

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
  const menu: Menu = $state([
    { title: 'Dashboard', popover: false,  href: '/' },
    { title: 'Entry', popover: false, href: `/entry`, submenu: [ { title: 'Tours', href: '/entry/tour', icon: 'briefcase', description: 'Enter flights that are associated with a work tour or duty day.'}, { title: 'Legs', href: '/entry/leg', icon: 'send', description: 'Enter generic flights that are not associated with a tour.'}] },
    { title: 'Aircraft', popover: false, href: '/aircraft', submenu: [ { title: 'Aircraft', href: '/aircraft/entry', icon: 'plane', description: 'Document specific aircraft flown in flight legs.'}, { title: 'Types', href: '/aircraft/type', icon: 'tag', description: 'Create and manage common aircraft types.'}] },
    { title: 'Logbook', popover: false, href: '/logbook' },
    { title: 'Airports', popover: false, href: '/airports' },
  ]);

  // const p: typeof Popover.Root;

  // const attachPopoverRoot = (element: typeof Popover.Root) => {

  // }

  // Mobile menu controls
  let mobileNavMenuVisible = $state(false);
  let menuHeaderBar: HTMLElement | null = $state(null);
	const closeMobileMenu = () => mobileNavMenuVisible = false;
  const toggleMobileMenu = () => mobileNavMenuVisible = !mobileNavMenuVisible;

	// -----------------------------------------------------------------------------------------------
	// Profile Menus
	// -----------------------------------------------------------------------------------------------

  const loadCommitInfo = async () => {
    const cData = await (await fetch(`https://api.github.com/repos/knicholson32/Contour/commits?per_page=1&sha=${data.lastCommit}`)).json() as GitCommit[];
    if (cData.length > 0) {
      const data = {
        commitMessage: cData[0].commit.message,
        commitDate: new Date(cData[0].commit.author.date),
        commitAuthor: cData[0].commit.author.name,
        commitSHA: cData[0].sha
      }
      return data;
    } else return null
  }

  let aboutOverlay = $state(false);
  let commitInfo: Awaited<ReturnType<typeof loadCommitInfo>> | null = $state(null);
  const openAboutOverlay = async () => {
    commitInfo = await loadCommitInfo();
    aboutOverlay = true;
  }
  const hideAboutOverlay = () => {
    aboutOverlay = false;
  }

  // Menu contents
  const profileMenu = [
    { title: 'Profile', href: '/profile' },
    { title: 'Settings', href: '/settings' },
    { title: 'About', button: openAboutOverlay },
    { title: 'Sign out', href: '/signout' },
  ];

	// Primary profile menu
  let profileBar: HTMLElement | null = $state(null);
	let profileMenuVisible = $state(false);
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

{#if page.url.pathname.includes('/api')}
  {@render children?.()}
{:else}

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
              <button onclick={$backButtonClicked} type="button" class="touch-manipulation text-center grow select-none inline-flex items-center gap-1 transition-colors pl-1 pr-3 py-2 rounded-md text-sm font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2
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
            <div class="flex shrink-0 items-center">
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
                    <Popover.Content collisionPadding={20} class="grid grid-cols-1 gap-x-4 gap-y-1 p-0 w-auto text-sm rounded-lg dark:bg-zinc-800 dark:border dark:border-zinc-900">
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
                            <a href="{item.href}" onclick={() => m.popover = false} class="font-semibold text-gray-900 dark:text-gray-100">
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
          <!-- <button type="button" class="relative rounded-full p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
            <span class="absolute -inset-1.5"></span>
            <span class="sr-only">View notifications</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button> -->

          <!-- Profile dropdown -->
          <div bind:this={profileBar} use:EscapeOrClickOutside={{ callback: closeAccountDropdown, except: profileBar }} class="relative ml-3">
            <div>
              <button type="button" onclick={toggleAccountDropdown} class="touch-manipulation relative flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:ring-offset-2" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
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
                  <div class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-zinc-900 py-1 shadow-lg ring-1 ring-black/5 dark:ring-zinc-800 focus:outline-hidden" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
                    <!-- Active: "bg-gray-100", Not Active: "" -->
                    {#each profileMenu as m}
                      {#if m.button !== undefined}
                        <button onclick={() => { closeAccountDropdown(); m.button() }} class="w-full text-left hover:bg-gray-50 dark:hover:bg-zinc-800 block px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white" role="menuitem" tabindex="-1" id="user-menu-item-1">{m.title}</button>
                      {:else}
                        {#if page.url.pathname.startsWith(m.href)}
                          <a href="{m.href}" onclick={closeAccountDropdown} class="bg-gray-100 dark:bg-zinc-800 block px-4 py-2 text-sm text-gray-700 dark:text-gray-200" role="menuitem" tabindex="-1" id="user-menu-item-1">{m.title}</a>
                        {:else}
                          <a href="{m.href}" onclick={closeAccountDropdown} class="hover:bg-gray-50 dark:hover:bg-zinc-800 block px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white" role="menuitem" tabindex="-1" id="user-menu-item-1">{m.title}</a>
                        {/if}
                      {/if}
                    {/each}
                    <div class="w-full border-t"></div>
                    <a href="/changelog?lastCommit={data.lastCommit}" data-sveltekit-reload onclick={closeAccountDropdown} class="w-full text-left inline-flex items-center relative hover:bg-gray-50 dark:hover:bg-zinc-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-100 dark:hover:text-white">
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
          <button type="button" onclick={toggleMobileMenu} class="touch-manipulation relative inline-flex items-center justify-center rounded-md  p-2 text-gray-400 dark:text-gray-200 betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-800 betterhover:hover:text-gray-500 dark:betterhover:hover:text-white {mobileNavMenuVisible ? 'bg-gray-100 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900'} focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:ring-offset-2" aria-controls="mobile-menu" aria-expanded="false">
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
                <a href="{m.href}" onclick={closeMobileMenu} class="border-sky-500 bg-sky-50/50 dark:bg-slate-800/25 text-sky-500 block border-l-4 py-2 pl-3 pr-4 text-base font-medium" aria-current="page">{m.title}</a>  
              {:else}
                <a href="{m.href}" onclick={closeMobileMenu} class="border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-gray-200 block border-l-4 py-2 pl-3 pr-4 text-base font-medium">{m.title}</a>  
              {/if}
            {#if m.submenu !== undefined}
              {#each m.submenu as item}
                <a href="{item.href}" onclick={closeMobileMenu} class="flex gap-3 items-center py-2 pl-3 pr-4 text-base font-medium" aria-current="page">
                  <ChevronRight class="w-5 h-5"/>
                  <span>{item.title}</span>
                </a>  
              {/each}
            {/if}
          {/each}
        </div>
        <div class="border-t bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 pb-3 pt-4">
          <div class="flex items-center px-4">
            <div class="shrink-0">
              <img class="h-10 w-10 rounded-full" src="https://www.gravatar.com/avatar/{data.settings["general.gravatar.hash"]}?s=300&d=identicon" alt="">
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-gray-800 dark:text-gray-200">{data.settings["general.name"]}</div>
              <div class="text-sm font-medium text-gray-500">{data.settings["general.email"]}</div>
            </div>
            <!-- <button type="button" class="relative ml-auto shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">View notifications</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button> -->
          </div>
          <div class="mt-3 space-y-1">
            {#each profileMenu as m}
              {#if m.button !== undefined}
                <button onclick={() => { closeMobileMenu(); m.button() }} class="w-full text-left block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-gray-200" role="menuitem" tabindex="-1" id="user-menu-item-1">{m.title}</button>
              {:else}
                {#if m.href !== undefined && page.url.pathname.startsWith(m.href)}
                  <a href="{m.href}" onclick={closeMobileMenu} class="block px-4 py-2 text-base font-medium border-sky-500 bg-sky-50 dark:bg-slate-800/25 text-sky-700 dark:text-sky-400">{m.title}</a>
                {:else}
                  <a href="{m.href}" onclick={closeMobileMenu} class="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-gray-200">{m.title}</a>
                {/if}
              {/if}
            {/each}
            <div class="w-full border-t"></div>
            <a href="/changelog?lastCommit={data.lastCommit}" data-sveltekit-reload onclick={closeMobileMenu} class="inline-flex w-full items-center px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-gray-200"> 
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

  <div class=" relative overflow-y-hidden -mt-px pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]" style="height: calc(100% - 4rem + 1px); --nav-height: 4rem;">
    <div class="fixed top-16 left-0 right-0 z-101 h-[2px] overflow-hidden">
      <!-- <ProgressBar bind:this={progress} minimum={0} bind:width={width} /> -->
    </div>
    {@render children?.()}
  </div>



  {#if aboutOverlay}
    <div use:escapeOrClickOutside={{except: undefined, callback: hideAboutOverlay}} in:fade={{ duration: 200, easing: cubicOut }} out:fade={{ duration: 75, easing: cubicIn }} class="fixed z-50 top-0 right-0 bottom-0 left-0 flex flex-col items-center transition-colors justify-center bg-black/30">
      <div class="relative">
      
        <!--
          Flyout menu, show/hide based on flyout menu state.
      
          Entering: "transition ease-out duration-200"
            From: "opacity-0 translate-y-1"
            To: "opacity-100 translate-y-0"
          Leaving: "transition ease-in duration-150"
            From: "opacity-100 translate-y-0"
            To: "opacity-0 translate-y-1"
        -->
        <div class="z-10 flex w-screen max-w-max px-4" >
          <div class="relative w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm/6 shadow-lg ring-1 ring-gray-900/5">
            <div class="p-4 relative overflow-hidden">
              <img class="absolute top-0 right-0 bottom-0 left-0 opacity-15" src="/contour.svg" alt="">
              <div class="mb-2 flex flex-row gap-2">
                <img class="block h-8" src="/logo-inverted.png" alt="Contour">
                <span class="font-semibold text-gray-900 text-2xl">CONTOUR</span>
                <button onclick={hideAboutOverlay} class="z-50 absolute top-4 right-4 text-gray-900 hover:text-sky-500 cursor-pointer"><X class="w-6 h-6"></X></button>
              </div>
              <div class="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
                <div class="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50">
                  <img class="h-7 my-0 aspect-square" src='/Github-Light.svg' alt="GitHub Logo"/>
                </div>
                <div>
                  <a target="_blank" href="https://github.com/knicholson32/Contour" class="font-semibold text-gray-900 group-hover:text-sky-700">
                    GitHub
                    <span class="absolute inset-0"></span>
                  </a>
                  <p class="mt-1 text-gray-600">View source code and report bugs</p>
                </div>
              </div>
              <div class="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
                <div class="mt-1 flex size-11 flex-none items-center justify-center rounded-lg overflow-hidden bg-gray-50">
                  <img class="h-full my-0 aspect-square inline-flex" src='https://www.flightaware.com/images/apple-touch-icon-240x240.png' alt="FlightAware Logo"/>
                </div>
                <div>
                  <a target="_blank" href="https://www.flightaware.com/aeroapi/portal/overview" class="font-semibold text-gray-900 group-hover:text-sky-700">
                    FlightAware
                    <span class="absolute inset-0"></span>
                  </a>
                  <p class="mt-1 text-gray-600">Create an API token for Contour to use</p>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 p-8">
              <div class="flex justify-between">
                <h3 class="text-sm/6 font-semibold text-gray-500">Version & Build Information</h3>
                <a onclick={hideAboutOverlay} href="/settings" class="text-sm/6 font-semibold text-sky-600">Settings <span aria-hidden="true">&rarr;</span></a>
              </div>
              <ul role="list" class="mt-6 space-y-6">
                <li class="relative text-gray-800">
                  <div class="flex flex-row justify-between text-xs/6 text-gray-600">
                    <span>Runtime Versions</span>
                    {#if data.buildTime !== null && data.buildTime !== undefined && data.buildTime !== '' && data.buildTime !== 0}
                      <span>built on <time datetime={new Date(data.buildTime * 1000).toISOString()} class="">{timeConverter(data.buildTime, {dateOnly: true})}</time></span>
                    {/if}
                  </div>
                  <div class="grid grid-cols-3 gap-x-4">
                    <div class="grow text-right">Parent Image</div>
                    <a href="https://hub.docker.com/_/node" target="_blank" class="hover:underline grow text-left col-span-2"><code class="bg-gray-100 p-1 rounded-md">{data.parentImage}</code></a>
                    
                    <a href="https://nodejs.org/" target="_blank" class="hover:underline grow text-right">Node</a>
                    <a href="https://nodejs.org/docs/v{data.nodeVersion}/api/" target="_blank" class="hover:underline grow text-left col-span-2"><code class="bg-gray-100 p-1 rounded-md">{data.nodeVersion}</code></a>

                    <a href="https://svelte.dev/" target="_blank" class="hover:underline grow text-right">Svelte</a>
                    <div class="grow text-left col-span-2"><code class="bg-gray-100 p-1 rounded-md">{data.svelteVersion}</code></div>

                    <a href="https://www.prisma.io/" target="_blank" class="hover:underline grow text-right">Prisma</a>
                    <div class="grow text-left col-span-2"><code class="bg-gray-100 p-1 rounded-md">{data.prismaVersion}</code></div>

                    <a href="https://pptr.dev/" target="_blank" class="hover:underline grow text-right">Puppeteer</a>
                    <div class="grow text-left col-span-2"><code class="bg-gray-100 p-1 rounded-md">{data.puppeteerVersion}</code></div>

                    <a href="https://www.chromium.org/" target="_blank" class="hover:underline grow text-right">Chromium</a>
                    <div class="grow text-left col-span-2"><code class="bg-gray-100 p-1 rounded-md">{data.chromiumVersion}</code></div>

                  </div>
                </li>
                {#if commitInfo !== null}
                  <li class="relative">
                    <span class="block text-xs/6 text-gray-600">
                      Last Commit on 
                      <time datetime={commitInfo.commitDate.toISOString()} class="text-xs/6 text-gray-600">{timeConverter(commitInfo.commitDate.getTime()/1000, {dateOnly: true})}</time>
                    </span>
                    <a href="https://github.com/knicholson32/Contour/commit/{commitInfo.commitSHA}" target="_blank" class="hover:underline block truncate text-sm/6 font-semibold text-gray-900">
                      <code class="bg-gray-100 p-1 rounded-md font-light">@{commitInfo.commitSHA.substring(0, 7)}</code> {commitInfo.commitMessage}
                      <span class="absolute inset-0"></span>
                    </a>
                  </li>
                {/if}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  {/if}
{/if}