<script lang="ts">
  import icons from "$lib/components/icons";
  export let title: string;
  export let subtitle: string | null = null;
  export let error: string | null = null;
  export let visible: boolean = true;
  export let collapsable = false;

  let click = () => {
    visible = !visible;
  }

</script>

{#if collapsable}
  <button tabindex="-1" type="button" on:click={click} class="touch-manipulation select-none -mt-[1px] py-2 sticky top-0 z-[1] border-y border-gray-200 inline-flex gap-2 w-full items-center cursor-default text-left px-3 uppercase font-medium text-sm bg-gray-50 text-gray-900">
    <span class="inline-flex items-center gap-2">
      {title}
      {#if subtitle !== null}
        <span class="text-gray-400 text-xs">{subtitle}</span>
      {/if}
    </span>
    {#if error !== null}
      <span class="flex-grow"></span>
      <span class="flex-grow text-red-500">{error}</span>
    {/if}
    <slot name="message"/>
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
{:else}
  <div class="select-none -mt-[1px] py-2 sticky top-0 z-[1] border-y border-gray-200 inline-flex w-full gap-2 items-center cursor-default text-left px-3 uppercase font-medium text-sm bg-gray-50 text-gray-900">
    <span class="inline-flex items-center gap-2">
      {title}
      {#if subtitle !== null}
        <span class="text-gray-400 text-xs">{subtitle}</span>
      {/if}
    </span>
    {#if error !== null}
      <span class="flex-grow text-red-500 ml-2">{error}</span>
    {/if}
    <slot name="message"/>
  </div>
{/if}
<ul role="list" class="divide-y divide-gray-100 {!visible ? 'hidden' : ''} {$$restProps.class}">
  <slot />
</ul>
