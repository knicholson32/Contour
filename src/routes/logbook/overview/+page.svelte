<script lang='ts'>
    import { goto } from '$app/navigation';
    import * as Deck from '$lib/components/map/deck';
    import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
    import * as Card from "$lib/components/ui/card";
    import { SwitchSmall } from "$lib/components/ui/switchSmall";
    import type { Position } from "deck.gl";
    import { BedDouble, Gauge, Plane, Route, Table2, Timer, TowerControl } from "lucide-svelte";

    interface Props {
      data: import('./$types').PageData;
    }

    let { data }: Props = $props();


</script>

<OneColumn>

  <Deck.Core startCenteredOn={[data.startAirport?.latitude ?? 0, data.startAirport?.longitude ?? 0]}>

    <Deck.Airports airports={data.visitedAirports} />
    <Deck.Legs legs={'/api/legs'} triggerCameraMove={false} pickable={true} onclick={(id: string) => { goto(`/entry/leg/${id}?active=form`)}} />
  </Deck.Core>

  

  <div class="absolute z-10 top-4 left-4 p-4 rounded-lg bg-zinc-100/70 dark:bg-black/40 backdrop-blur-xs flex flex-col gap-2">
    Logbook Overview
  </div>

  <!-- <div class="absolute z-10 top-4 right-4 p-4 rounded-lg bg-black/40 backdrop-blur-x grid grid-cols-2 gap-4">
    <div class="bg-amber-900/30 flex flex-col gap-4 items-center justify-center p-4 rounded-lg">
      Box 1
    </div>
    <div class="bg-pink-900/30 flex flex-col gap-4 items-center justify-center p-4 rounded-lg">
      Box 2
    </div>
    <div class="bg-emerald-900/30 flex flex-col gap-4 items-center justify-center p-4 rounded-lg">
      Box 3
    </div>
    <div class="bg-sky-900/30 flex flex-col gap-4 items-center justify-center p-4 rounded-lg">
      Box 4
    </div>
  </div> -->

</OneColumn>