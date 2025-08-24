<script lang="ts">
  import { onMount } from "svelte";
  import * as DeckTypes from "../../types";
  import { LegLayer } from "./Leg.svelte.js";
  

  let {
    leg,
    hidden = $bindable(false),
    triggerCameraMove = $bindable(true),
    showFlightPlan = $bindable(true),
  } : {
    leg: DeckTypes.Leg
    hidden?: boolean
    triggerCameraMove?: boolean
    showFlightPlan?: boolean
  } = $props();

  const widget = LegLayer.create({ leg: leg, hidden, triggerCameraMove, showFlightPlan });

  export const center = () => {
    widget.translateTo();
  }

  onMount(() => {
    return () => widget.destroy();
  });


  $effect(() => widget.setProps({ leg: leg }));
  $effect(() => widget.setProps({ hidden }));
  $effect(() => widget.setProps({ showFlightPlan }));
  $effect(() => widget.setProps({ triggerCameraMove }));



</script>

