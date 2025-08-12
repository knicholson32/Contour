<script lang="ts">
  import icons from "$lib/components/icons";
  interface Props {
    title: string;
    subtitle?: string | null;
    error?: string | null;
    visible?: boolean;
    warning?: boolean;
    collapsable?: boolean;
    messageRight?: boolean;
    hideTopBorder?: boolean;
    message?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
    [key: string]: any
  }

  let {
    title,
    subtitle = null,
    error = null,
    visible = $bindable(true),
    warning = false,
    collapsable = false,
    messageRight = false,
    hideTopBorder = false,
    message,
    children,
    ...rest
  }: Props = $props();

  let click = () => {
    visible = !visible;
  }

</script>

{#if collapsable}
  <button tabindex="-1" type="button" onclick={click} class="touch-manipulation select-none -mt-px py-2 sticky top-0 z-1 {hideTopBorder ? 'border-b' : 'border-y'} border-gray-200 dark:border-zinc-700 inline-flex gap-2 w-full items-center cursor-default text-left px-3 uppercase font-medium text-sm bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-200">
    <span class="inline-flex items-center gap-2">
      {title}
      {#if subtitle !== null}
        <span class="text-gray-400 text-xs">{subtitle}</span>
      {/if}
    </span>
    {#if error !== null}
      <span class="grow"></span>
      <span class="grow text-red-500">{error}</span>
    {/if}
    {@render message?.()}
    <span class="grow"></span>
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
  <div class="select-none -mt-px py-2 sticky top-0 z-1 {hideTopBorder ? 'border-b' : 'border-y'} border-gray-200 dark:border-zinc-700 inline-flex w-full gap-2 items-center cursor-default text-left px-3 uppercase font-medium text-sm bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-200">
    <span class="inline-flex items-center gap-2">
      {title}
      {#if subtitle !== null}
        <span class="text-gray-400 text-xs">{subtitle}</span>
      {/if}
    </span>
    {#if error !== null}
      <span class="grow text-red-500 ml-2">{error}</span>
    {/if}
    {#if messageRight}
      <span class="grow"></span>
    {/if}
    {@render message?.()}
  </div>
{/if}
<ul role="list" class="divide-y divide-gray-100 dark:divide-zinc-800 {!visible ? 'hidden' : ''} {rest.class}">
  {#if warning}
    {#if children}{@render children()}{:else}
      <div class="w-full inline-flex items-center justify-center h-11 bg-gray-100 dark:bg-zinc-950 text-gray-500">
        No Warnings
      </div>
    {/if}
  {:else}
    {@render children?.()}
  {/if}
</ul>
