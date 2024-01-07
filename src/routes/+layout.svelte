<script lang="ts">
  import { page } from "$app/stores";
  import { cubicIn, cubicInOut, cubicOut } from "svelte/easing";
  import "../app.css";
  import { EscapeOrClickOutside } from "$lib/components/events";
  import { fade, scale, slide } from "svelte/transition";
  import { backArrow, backButtonClicked, backText, unsaved } from "$lib/stores";
    import { icons } from "$lib/components";
  export let data: import('./$types').PageData;

  // -----------------------------------------------------------------------------------------------
	// Navigation Menus
	// -----------------------------------------------------------------------------------------------

  // Menu contents
  const menu = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Entry', href: '/entry' },
    { title: 'Aircraft', href: '/aircraft' },
    { title: 'Logbook', href: '/log' },
    { title: 'Airports', href: '/airports' },
  ];

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

</script>

<svelte:head>
	{#if $page.data.seo === undefined}
		<title>Contour</title>
		<meta name="description" content="Contour" />
	{:else}
		<title>Contour | {$page.data.seo.title}</title>
		<meta name="description" content={$page.data.seo?.description} />
	{/if}
</svelte:head>

<!--
  This example requires updating your template:

  ```
  <html class="h-full">
  <body class="h-full">
  ```
-->

<nav bind:this={menuHeaderBar} class="relative z-50 border-b border-gray-200 bg-white h-16">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 justify-between">
      <div class="flex">
        {#if $backArrow}
          <div class="flex items-center gap-2 justify-center">
            <button on:click={$backButtonClicked} type="button" class="touch-manipulation text-center flex-grow select-none inline-flex items-center gap-1 transition-colors pl-1 pr-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-gray-300 ring-inset bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">
              <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                {@html icons.chevronLeft}
              </svg>
              {$backText}
            </button>
            {#if $unsaved}
              <span class="font-mono text-xxs px-2 rounded-full bg-sky-600 text-white font-bold block sm:hidden">UNSAVED</span>
            {/if}
          </div>
        {:else}
          <div class="flex flex-shrink-0 items-center">
            <img class="block w-9 h-auto lg:hidden" src="/logo-inverted.png" alt="Contour">
            <img class="hidden w-9 h-auto lg:block" src="/logo-inverted.png" alt="Contour">
          </div>
        {/if}

        {#if data.entrySettings["entry.tour.current"] !== -1}
          <div class="m-3 flex items-center">
            <a href="/tour" class="uppercase select-none border border-sky-400 text-sky-500 rounded-md py-2 px-3 whitespace-nowrap">
              On Tour
            </a>
          </div>
        {:else}
          <div class="sm:ml-6"></div>
        {/if}
        <div class="hidden sm:-my-px sm:flex sm:space-x-8">
          <!-- Desktop Menu -->
          {#each menu as m}
            <!-- Current: "border-indigo-500 text-gray-900", Default: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700" -->
            {#if $page.url.pathname.startsWith(m.href)}
              <a href="{m.href}" class="border-indigo-500 relative z-40 text-gray-900 inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium" aria-current="page">{m.title}</a>  
            {:else}
              <a href="{m.href}" class="border-transparent relative z-40 text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium">{m.title}</a>  
            {/if}
          {/each}
        </div>
      </div>
      <div class="hidden sm:ml-6 sm:flex sm:items-center">
        <button type="button" class="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <span class="absolute -inset-1.5"></span>
          <span class="sr-only">View notifications</span>
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        <!-- Profile dropdown -->
        <div bind:this={profileBar} use:EscapeOrClickOutside={{ callback: closeAccountDropdown, except: profileBar }} class="relative ml-3">
          <div>
            <button type="button" on:click={toggleAccountDropdown} class="touch-manipulation relative flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">Open user menu</span>
              <img class="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
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
                <div class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
                  <!-- Active: "bg-gray-100", Not Active: "" -->
                  {#each profileMenu as m}
                    {#if $page.url.pathname.startsWith(m.href)}
                      <a href="{m.href}" on:click={closeAccountDropdown} class="bg-gray-100 block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-1">{m.title}</a>
                    {:else}
                      <a href="{m.href}" on:click={closeAccountDropdown} class="hover:bg-gray-50 block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-1">{m.title}</a>
                    {/if}
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
      <div class="-mr-2 flex items-center sm:hidden">
        <!-- Mobile menu button -->
        <button type="button" on:click={toggleMobileMenu} class="touch-manipulation relative inline-flex items-center justify-center rounded-md  p-2 text-gray-400 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-500 {mobileNavMenuVisible ? 'bg-gray-100' : 'bg-white'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" aria-controls="mobile-menu" aria-expanded="false">
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
      class="sm:hidden absolute left-0 right-0 bg-white z-50 shadow-md" id="mobile-menu">
      <div class="space-y-1 pb-3 pt-2">
        <!-- Mobile Menu -->
        {#each menu as m}
          <!-- Current: "border-indigo-500 bg-indigo-50 text-indigo-700", Default: "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800" -->
          {#if $page.url.pathname.startsWith(m.href)}
            <a href="{m.href}" on:click={closeMobileMenu} class="border-indigo-500 bg-indigo-50 text-indigo-700 block border-l-4 py-2 pl-3 pr-4 text-base font-medium" aria-current="page">{m.title}</a>  
          {:else}
            <a href="{m.href}" on:click={closeMobileMenu} class="border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 block border-l-4 py-2 pl-3 pr-4 text-base font-medium">{m.title}</a>  
          {/if}
        {/each}
      </div>
      <div class="border-t bg-white border-gray-200 pb-3 pt-4">
        <div class="flex items-center px-4">
          <div class="flex-shrink-0">
            <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
          </div>
          <div class="ml-3">
            <div class="text-base font-medium text-gray-800">Tom Cook</div>
            <div class="text-sm font-medium text-gray-500">tom@example.com</div>
          </div>
          <button type="button" class="relative ml-auto flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <span class="absolute -inset-1.5"></span>
            <span class="sr-only">View notifications</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>
        </div>
        <div class="mt-3 space-y-1">
          {#each profileMenu as m}
            {#if $page.url.pathname.startsWith(m.href)}
              <a href="{m.href}" on:click={closeMobileMenu} class="block px-4 py-2 text-base font-medium border-indigo-500 bg-indigo-50 text-indigo-700">{m.title}</a>
            {:else}
              <a href="{m.href}" on:click={closeMobileMenu} class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800">{m.title}</a>
            {/if}
          {/each}
        </div>
      </div>
    </div>
  {/if}
</nav>

<div class="overflow-y-hidden -mt-[1px] pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]" style="height: calc(100% - 4rem + 1px);">
  <slot/>
</div>