<script lang="ts">
  import type { API } from "$lib/types";
  import icons from "../icons";
  export let title: string;
	export let disabled: boolean = false;
  export let action: string = '?/default';
  export let required: boolean;
  export let unsaved: boolean = false;;
  export let link = false;
  export let tooltip = '';
  export let name: string;
  export let form: null | API.Form.Type;

  let clazz: string = '';
	export { clazz as class };

  export let focus: () => void = () => {};
  export let restore: (() => void) | null = null;

  const _restore = (e: Event) => {
    e.stopPropagation();
    if (restore !== null && restore !== undefined) restore();
  }

  export let error='';

  $: red = error !== '' || (form !== null && form.ok === false && form.action === action && form.name === name);

</script>

<li class="w-full relative inline-flex items-center px-3 bg-white dark:bg-zinc-900 transition-colors py-1 gap-2 {disabled ? 'cursor-not-allowed bg-gray-50 dark:bg-zinc-950/50 text-gray-500' : ''} {link ? 'betterhover:hover:bg-gray-50 dark:betterhover:hover:bg-zinc-700' : ''} {clazz}">
  {#if !link}
    <button {disabled} tabindex="-1" type="button" title={tooltip} on:click={focus} 
      class="touch-manipulation w-full {disabled ? 'cursor-not-allowed' : 'cursor-default'} inline-flex items-center gap-2 ring-0 focus-within:ring-0">
      <dt class="font-bold inline-flex items-center gap-2 whitespace-nowrap {red ? 'text-red-500' : ''}">
        {title}
        {#if required}
          <span class="text-xxs uppercase hidden xs:block {red ? 'text-red-500' : 'text-gray-400'}">required</span>
          <span class="text-xxs uppercase xs:hidden {red ? 'text-red-500' : 'text-gray-400'}">req</span>
        {/if}
        {#if restore !== null && restore !== undefined && unsaved}
          <button tabindex="-1"  on:click={_restore} type="button" class="touch-manipulation select-none font-mono whitespace-nowrap text-xs text-sky-400 h-7 w-[4.5rem] rounded-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-sky-300 dark:ring-sky-600 bg-white dark:bg-transparent betterhover:hover:bg-gray dark:betterhover:hover:bg-zinc-900 betterhover:hover:text-gray-900 dark:betterhover:hover:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200">
            UNDO
          </button>
        {/if}
      </dt>
      <div>
        {#if error !== ''}
          <span class="text-xs text-red-500">{error}</span>
        {:else if form !== null}
          {#if form.ok === false && form.action === action && form.name === name}
            <span class="text-xs text-red-500">{form.message}</span>
          {/if}
        {/if}
      </div>
      <dd class="flex-grow flex items-center overflow-hidden {red ? 'text-red-500' : 'text-sky-400'} h-9 justify-end {$$restProps.class}">
        <slot/>
      </dd>
    </button>
  {:else}
    <div class="touch-manipulation w-full inline-flex items-center justify-center gap-2 ring-0 focus-within:ring-0 font-bold h-[36px] whitespace-nowrap {red ? 'text-red-500' : ''}">
      {title}
      <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
        {@html icons.link}
      </svg>
    </div>
  {/if}
  <slot name="outsideButton"/>
</li>