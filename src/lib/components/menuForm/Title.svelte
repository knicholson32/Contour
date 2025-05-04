<script lang="ts">
    import { cn } from "$lib/utils";


  interface Props {
    title: string;
    floatLeft?: boolean;
    children?: import('svelte').Snippet;
  }

  let { title, floatLeft = false, children }: Props = $props();

</script>

<div class={cn("w-full flex flex-row items-center whitespace-nowrap gap-3 text-lg font-bold font-mono uppercase tracking-wider py-2 px-4 select-none bg-gray-100 dark:bg-zinc-900 text-zinc-900 dark:text-white", floatLeft === true ? 'text-center sm:text-left' : 'text-center')}>
  {title}
  <div class="relative w-full">
    {@render children?.()}
  </div>
</div>