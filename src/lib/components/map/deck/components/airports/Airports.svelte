<script lang="ts">
  import { onMount } from "svelte";
  import * as DeckTypes from "../../types";
  import { AirportLayer } from "./Airports.svelte.js";


  let {
    airports,
    label = true,
    hidden = false,
    highlight = []
  } : {
    airports: DeckTypes.Airports | string,
    label?: boolean
    hidden?: boolean
    highlight?: string[]
  } = $props();

  

  const widget = AirportLayer.create({ airports: typeof airports === 'string' ? undefined : airports, highlight, hidden, label });

  const updateAirports = async (_airports: DeckTypes.Airports | string) => {
    if (typeof _airports === 'string') {
      try {
        const res = await (await fetch(_airports)).json() as DeckTypes.Airports;
        widget.setProps({ airports: res });
      } catch (e) {
        console.error(e);
      }
    } else {
      widget.setProps({ airports: _airports });
    }
  }

  onMount(() => {

    // If airports is a URL, we need to fetch and update it
    // if (typeof airports === 'string') updateAirports(airports);

    return () => widget.destroy();
  });

  $effect(() => {
    updateAirports(airports)
  });

  $effect(() => widget.setProps({hidden}));
  $effect(() => widget.setProps({label}));
  $effect(() => widget.setProps({highlight}));



</script>

