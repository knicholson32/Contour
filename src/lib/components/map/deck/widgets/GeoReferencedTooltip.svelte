<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import type { Position } from "deck.gl";
  import { GeoReferencedTooltipWidget } from "./widget.svelte";

  
  let {
    position = $bindable([0 ,0]),
    hidden = $bindable(false),
    fade = $bindable(true),
    children
  }: {
    position: Position,
    hidden?: boolean,
    fade?: boolean,
    children: Snippet
  } = $props();
  
  let el: HTMLDivElement | null = $state(null);

  const widget = GeoReferencedTooltipWidget.create({ position: [position[1], position[0]], hidden, fade })

  onMount(() => {
    if (el === null) return;
    widget.setTarget(el);
    return () => {
      widget.destroy();
    }
  });

  $effect(() => widget.setProps({ position: [position[1], position[0]] }));
  $effect(() => widget.setProps({ hidden }));
  $effect(() => widget.setProps({ fade }));
  
</script>

<!-- Surround the child div in a hidden div so nothing appears if the div is not accepted by the widget controller -->
<div class="hidden" bind:this={el}>
  {@render children()}
</div>