<script lang='ts'>
    import { Overview } from "$lib/components/map";
    import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
    import * as Card from "$lib/components/ui/card";
    import { BedDouble, Gauge, Plane, Route, Table2, Timer, TowerControl } from "lucide-svelte";

    interface Props {
      data: import('./$types').PageData;
    }

    let { data }: Props = $props();

</script>

<OneColumn>

  <!-- <div class="flex-1 space-y-4 p-3 md:p-6 pt-6">

    <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-4">


    </div>
  </div> -->
  
  <Overview visitedAirports={data.visitedAirports} legs={data.legs} largestSegment={data.largestSegment} />

  <div class="absolute z-10 top-4 left-4 p-4 rounded-lg bg-black/40 backdrop-blur-xs">
    Logbook Overview
  </div>

  <div class="absolute z-10 top-4 right-4 p-4 rounded-lg bg-black/40 backdrop-blur-x grid grid-cols-2 gap-4">
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
  </div>

</OneColumn>