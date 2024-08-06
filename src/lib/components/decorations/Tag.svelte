<script lang="ts">

  export let text: string | null = null;

</script>

<span class="font-mono text-xxs px-[6px] py-[0px] -my-3 overflow-hidden whitespace-nowrap text-ellipsis rounded-full bg-sky-600 text-white font-bold {$$restProps.class}">
  {#if text !== null}
    {text}
  {/if}
  <slot />
</span>