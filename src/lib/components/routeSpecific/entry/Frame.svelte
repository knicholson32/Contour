<script lang="ts">
  export let title: string;
	export let disabled: boolean = false;
  export let focus: () => void = () => {};

  export let error='';

</script>

<div class="w-full relative inline-flex items-center px-3 py-1 gap-2 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}">
  <button tabindex="-1" type="button" title="" on:click={focus} 
    class="touch-manipulation w-full {disabled ? 'cursor-not-allowed' : 'cursor-default'} inline-flex items-center gap-2 ring-0 focus-within:ring-0">
    <dt class="font-bold">{title}</dt>
    <div>
      {#if error !== ''}
        <span class="text-xs text-red-500">{error}</span>
      {/if}
    </div>
    <dd class="flex-grow flex items-center overflow-hidden text-sky-400 h-9 justify-end">
      <slot/>
    </dd>
  </button>
  <slot name="outsideButton"/>
</div>