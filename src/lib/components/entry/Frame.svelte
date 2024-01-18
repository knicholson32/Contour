<script lang="ts">
  import type { API } from "$lib/types";
  export let title: string;
	export let disabled: boolean = false;
  export let action: string = '?/default';
  export let required: boolean;
  export let unsaved: boolean = false;;
  export let name: string;
  export let form: null | API.Form.Type;
  export let focus: () => void = () => {};
  export let restore: (() => void) | null = null;

  const _restore = (e: Event) => {
    e.stopPropagation();
    if (restore !== null && restore !== undefined) restore();
  }

  export let error='';

  $: red = error !== '' || (form !== null && form.ok === false && form.action === action && form.name === name);

</script>

<li class="w-full relative inline-flex items-center px-3 bg-white py-1 gap-2 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}">
  <button {disabled} tabindex="-1" type="button" title="" on:click={focus} 
    class="touch-manipulation w-full {disabled ? 'cursor-not-allowed' : 'cursor-default'} inline-flex items-center gap-2 ring-0 focus-within:ring-0">
    <dt class="font-bold inline-flex items-center gap-2 whitespace-nowrap {red ? 'text-red-500' : ''}">
      {title}
      {#if required}
        <span class="text-xxs uppercase {red ? 'text-red-500' : 'text-gray-400'}">required</span>
      {/if}
      {#if restore !== null && restore !== undefined && unsaved}
        <button tabindex="-1"  on:click={_restore} type="button" class="touch-manipulation select-none font-mono whitespace-nowrap text-xs text-sky-400 h-7 w-[4.5rem] rounded-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-sky-300 betterhover:hover:bg-sky-50 betterhover:hover:text-sky-700 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white focus-visible:outline-grey-500">
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
    <dd class="flex-grow flex items-center overflow-hidden {red ? 'text-red-500' : 'text-sky-400'} h-9 justify-end">
      <slot/>
    </dd>
  </button>
  <slot name="outsideButton"/>
</li>