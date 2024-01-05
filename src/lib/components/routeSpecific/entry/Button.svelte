<script lang="ts">
  export let title: string;
	export let disabled: boolean = false;
  export let focus: () => void = () => {};

</script>

<!-- <div class="w-full relative inline-flex items-center px-3 py-1 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}"> -->
<button {disabled} tabindex="-1" type="button" title="" on:click={focus} 
  class="touch-manipulation h-11 w-full px-3 py-1 text-gray-700 {disabled ? '' : 'betterhover:hover:bg-gray-50 betterhover:hover:text-black'} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 inline-flex items-center justify-center gap-2 ring-0 focus-within:ring-0">
  <span class="font-bold">{title}</span>
</button>