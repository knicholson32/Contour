<script lang="ts">
  import { page } from "$app/stores";


  export let value: string = $page.url.searchParams.get('search') ?? '';
  export let onInput: () => void = () => {};
  export let onSearch: () => void = () => {};

  export let form = true;

</script>

<div class="flex flex-1 items-center justify-center bg-gray-100 dark:bg-zinc-900">
  <div class="w-full max-w-lg lg:max-w-xs">
    <label for="search" class="sr-only">Search</label>
    <div class="relative z-50">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg class="h-5 w-5 text-gray-400 dark:text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
        </svg>
      </div>
      {#if form}
        <form method="get" action="?{$page.url.search}">
          <input id="search" name="search" on:input={onInput} on:submit={onSearch} bind:value class="block relative z-50 w-full border-0 bg-transparent py-1.5 pl-10 pr-3 text-gray-900 dark:text-gray-200 ring-0 placeholder:text-gray-400 focus:ring-0 focus:ring-inset sm:text-sm sm:leading-6" placeholder="Search" type="search">
          {#each $page.url.searchParams.keys() as searchKey}
            {#if searchKey !== 'search'}
              <input name={searchKey} value="{$page.url.searchParams.get(searchKey)}" type="hidden" />
            {/if}
          {/each}
        </form>
      {:else}
        <input id="search" name="search" on:input={onInput} on:submit={onSearch} bind:value class="block relative z-50 w-full border-0 bg-transparent py-1.5 pl-10 pr-3 text-gray-900 dark:text-gray-200 ring-0 placeholder:text-gray-400 focus:ring-0 focus:ring-inset sm:text-sm sm:leading-6" placeholder="Search" type="search">
      {/if}
    </div>
  </div>
</div>