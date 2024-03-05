<script lang="ts">
  import { Clock3, Gauge, Locate, Rabbit, Radio } from "lucide-svelte";
  import type * as Types from '@prisma/client';
  import { dateToTimeStringForm } from "$lib/helpers";
  import { DB } from '$lib/types';

  export let position: Types.Position | null = null;
  export let el: HTMLElement;

</script>

{#if position !== null}
  <div bind:this={el} class="flex flex-col items-start justify-start min-w-48">
    <div class="flex items-center w-full">
      <Gauge class="mr-2 h-5 w-5 opacity-70" />{" "}
      <div class="text-sm whitespace-nowrap flex w-full items-center">
        {#if position.updateType === DB.UpdateType.PROJECTED || position.groundspeed === 0}
          Unknown
        {:else}
          {(position.altitude * 100).toLocaleString()} ft
        {/if}
        <div class="flex-grow"></div>
        <span class="uppercase text-xs opacity-70 ml-2">{position.altitudeChange}</span>
      </div>
    </div>
    <div class="flex items-center py-2 border-b w-full">
      <Rabbit class="mr-2 h-5 w-5 opacity-70" />{" "}
      <div class="text-sm whitespace-nowrap flex w-full items-center">
        {#if position.updateType === DB.UpdateType.PROJECTED || position.groundspeed === 0}
          Unknown
        {:else}
          {position.groundspeed.toFixed(0)} kts
          <div class="flex-grow"></div>
          <span class="uppercase text-xs opacity-70 ml-2">{(position.groundspeed * 1.15).toFixed(0)} mph</span>
        {/if}
      </div>
    </div>

    <div class="flex items-center pt-2">
      <Clock3 class="mr-1 h-4 w-4 opacity-70" />{" "}
      <span class="text-xs text-muted-foreground whitespace-nowrap">
        {dateToTimeStringForm(position.timestamp)}
      </span>
    </div>

    <div class="flex items-center pt-2">
      <Locate class="mr-1 h-4 w-4 opacity-70" />{" "}
      <span class="text-xs text-muted-foreground whitespace-nowrap">
        {position.latitude.toFixed(4)}°N
        {#if position.longitude < 0}
          {(-position.longitude).toFixed(4)}°E
        {:else}
          {position.longitude.toFixed(4)}°W
        {/if}
      </span>
    </div>

    <div class="flex items-center pt-2">
      <Radio class="mr-1 h-4 w-4 opacity-70" />{" "}
      <span class="text-xs text-muted-foreground whitespace-nowrap">
        {position.updateType}
      </span>
    </div>
  </div>
{/if}