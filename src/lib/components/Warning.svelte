<script lang="ts">
    import icons from "./icons";

  export let error: boolean = false;


</script>


<div class="inline-flex items-center justify-start gap-3 px-3 py-2 w-full">
  <svg class="h-8 w-8 shrink-0 rounded-full p-1 text-white dark:bg-transparent {error ? 'bg-red-500 dark:text-red-500' : 'bg-yellow-500 dark:text-yellow-500'}" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
    {@html icons.warning}
  </svg>
  <slot />
</div>