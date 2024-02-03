<script lang="ts">
  export let title: string;
	export let disabled: boolean = false;

</script>

<li>
  <button {disabled} tabindex="-1" type="submit" title=""
    class="touch-manipulation h-11 w-full px-3 py-1 text-gray-700 dark:text-gray-200 {disabled ? '' : 'betterhover:hover:bg-gray-50 betterhover:hover:text-black'} disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-zinc-900 disabled:text-gray-400 dark:disabled:text-gray-600 inline-flex items-center justify-center gap-2 ring-0 focus-within:ring-0">
    <span class="font-bold">{title}</span>
  </button>
</li>