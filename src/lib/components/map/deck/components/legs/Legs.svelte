<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import * as DeckTypes from "../../types";
  import { LegsLayer } from "./Legs.svelte.js";
  import type {MjolnirEvent} from 'mjolnir.js';
    import { DraggingNotifier } from "../../widgets/widget.svelte";
  
  let {
    legs,
    hidden = $bindable(false),
    triggerCameraMove = $bindable(true),
    highlight = $bindable(null),
    dimOthersOnHighlight = $bindable(true),
    autoHighlight = $bindable(true),
    pickable = $bindable(false),
    showFlightPlan = $bindable(true),
    onhover = () => {},
    onclick = () => {},
    tooltip
  } : {
    legs: DeckTypes.Legs | string,
    hidden?: boolean,
    triggerCameraMove?: boolean,
    highlight?: string | null,
    dimOthersOnHighlight?: boolean,
    autoHighlight?: boolean,
    pickable?: boolean,
    showFlightPlan?: boolean,
    onhover?: (id: string | null, event: MjolnirEvent) => void
    onclick?: (id: string) => void
    tooltip?: Snippet<[string]>
  } = $props();

  let legTooltip: {
    x: number,
    y: number,
    id: string
  } | null = $state(null);

  const dragNotifier = DraggingNotifier.create({onDragEnd: () => legTooltip = null, onDragStart: () => legTooltip = null });

  const handleHover = (id: string | null, event: MjolnirEvent) => {
    if (tooltip === undefined) {
      legTooltip = null;
      return onhover(id, event);
    }
    if (id === null) legTooltip = null;
    else {
      legTooltip = {
        id,
        x: (event.srcEvent as MouseEvent).offsetX,
        y: (event.srcEvent as MouseEvent).offsetY,
      }
    }
    onhover(id, event);
  }

  const widget = LegsLayer.create({ legs: typeof legs === 'string' ? undefined : legs, pickable, showFlightPlan, hidden, triggerCameraMove, autoHighlight, highlight: highlight === null ? [] : [highlight], dimOthersOnHighlight, onhover: handleHover, onclick});

  const updateLegs = async (_legs: DeckTypes.Legs | string) => {
    if (typeof _legs === 'string') {
      try {
        const res = await (await fetch(_legs)).json() as DeckTypes.Legs;
        widget.setProps({ legs: res });
      } catch (e) {
        console.error(e);
      }
    } else {
      widget.setProps({ legs: _legs });
    }
  }

  export const center = () => {
    widget.translateTo();
  }

  onMount(() => {

    // If legs is a URL, we need to fetch and update it
    // if (typeof legs === 'string') updateLegs(legs);

    return () => {
      widget.destroy();
      dragNotifier?.destroy();
    }
  });


  $effect(() => {
    updateLegs(legs)
  });
  $effect(() => widget.setProps({ hidden }));
  $effect(() => widget.setProps({ triggerCameraMove }));
  $effect(() => widget.setProps({ highlight: highlight === null ? [] : [highlight] }));
  $effect(() => widget.setProps({ dimOthersOnHighlight }));
  $effect(() => widget.setProps({ autoHighlight }));
  $effect(() => widget.setProps({ pickable }));
  $effect(() => widget.setProps({ showFlightPlan }));
  $effect(() => widget.setProps({ onclick }));
  // $effect(() => widget.setProps({ onhover }));


</script>

{#if legTooltip !== null}
  <div class="absolute pointer-events-none [.dragging_&]:hidden" style="left: {legTooltip.x}px; top: {legTooltip.y}px">
    {@render tooltip?.(legTooltip.id)}
  </div>
{/if}

