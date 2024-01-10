<script lang="ts">

  export let text: string | null = null;

</script>

<span class="font-mono text-xxs px-[6px] py-[3px] overflow-hidden whitespace-nowrap text-ellipsis rounded-full bg-sky-600 text-white font-bold">
  {#if text !== null}
    {text}
  {/if}
  <slot />
</span>