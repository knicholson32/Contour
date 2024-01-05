<script lang="ts">
  import type { API } from "$lib/types";
  export let title: string;
	export let disabled: boolean = false;
  export let action: string;
  export let required: boolean;
  export let name: string;
  export let form: null | API.Form.Type;
  export let focus: () => void = () => {};

  export let error='';

  $: red = error !== '' || (form !== null && form.ok === false && form.action === action && form.name === name);

</script>

<div class="w-full relative inline-flex items-center px-3 py-1 gap-2 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}">
  <button {disabled} tabindex="-1" type="button" title="" on:click={focus} 
    class="touch-manipulation w-full {disabled ? 'cursor-not-allowed' : 'cursor-default'} inline-flex items-center gap-2 ring-0 focus-within:ring-0">
    <dt class="font-bold inline-flex items-center gap-2 {red ? 'text-red-500' : ''}">
      {title}
      {#if required}
        <span class="text-xxs uppercase {red ? 'text-red-500' : 'text-gray-400'}">required</span>
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
</div>