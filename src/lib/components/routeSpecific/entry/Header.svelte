<script lang="ts">
    import icons from "$lib/components/icons";

  export let title: string;
  export let visible = true;

  let click = () => {
    visible = !visible;
  }

</script>

<button tabindex="-1" type="button" on:click={click} class="touch-manipulation inline-flex w-full items-center cursor-default text-left px-3 py-1 border-b border-gray-200 uppercase font-medium text-sm bg-gray-100 text-gray-500">
  <span>{title}</span>
  <span class="flex-grow"></span>
  <span class="">
    <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
      {#if visible}
        {@html icons.chevronDown}
      {:else}
        {@html icons.chevronUp}
      {/if}
    </svg>
  </span>
</button>