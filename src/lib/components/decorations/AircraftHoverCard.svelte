<script lang="ts">
  import * as HoverCard from "$lib/components/ui/hover-card";
  import Image from "$lib/components/Image.svelte";
  import { onMount } from "svelte";
  import type { API } from "$lib/types";
  import { CalendarDays, Fingerprint, Loader2, Plane, RotateCw, Unlink } from "lucide-svelte";

  interface Props {
    id: string;
    reg: string;
    time?: number;
    compress?: boolean;
  }

  let {
    id,
    reg,
    time = 0,
    compress = true
  }: Props = $props();

  let aircraft: API.Types.Aircraft | null = $state(null)

  onMount(async () => {
    const res = await(await fetch('/api/aircraft/' + id)).json() as API.Aircraft;
    if (res.ok === true && res.type === 'aircraft') {
      aircraft = res.aircraft;
    }
  });

</script>

{#if aircraft !== null}

  <HoverCard.Root>
    <HoverCard.Trigger href="/aircraft/entry/{reg}?active=form" class="{compress ? '-ml-4' : ''} w-12 h-12 border-4 border-gray-100 bg-gray-100 dark:border-zinc-900 dark:bg-zinc-900 rounded-full relative flex justify-center items-center">
      <Image class="w-12 rounded-full object-cover aspect-1 absolute top-0 left-0" size={48} id={aircraft.imageId} alt={aircraft.registration}/>
      <div class="bg-foreground/15 w-full h-full rounded-full flex justify-center items-center">
        <Plane class="h-4 w-4" />
      </div>
    </HoverCard.Trigger>
    <HoverCard.Content class="w-auto p-0 animate-in fade-in">
      <div class="flex flex-row gap-4">
        <div class="w-[256px] relative">
          <Image class="object-cover rounded-l-sm relative" size={256} id={aircraft.imageId} alt={aircraft.registration}/>
          <div class="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 justify-center items-center">
            <Plane class="h-4 w-4" />
            <div class="whitespace-nowrap text-xs">No image provided</div>
          </div>
        </div>
        <div class="space-y-1 py-4 pr-4">
          <h4 class="text-sm font-semibold">{aircraft.registration}</h4>
          <p class="text-sm whitespace-nowrap">{aircraft.type.make} {aircraft.type.model}</p>
          <p class="text-sm whitespace-nowrap text-foreground/60 font-medium">{time.toFixed(1)} hr this period</p>
          {#if aircraft.year !== null}
            <div class="flex items-center pt-2">
              <CalendarDays class="mr-2 h-4 w-4 opacity-70" />{" "}
              <span class="text-xs text-muted-foreground whitespace-nowrap">
                Manufactured {aircraft.year}
              </span>
            </div>
          {/if}
          {#if aircraft.serial !== null}
          <!-- https://registry.faa.gov/aircraftinquiry/Search/NNumberResult?NNumberTxt=###QS -->
            <div class="flex items-center pt-2">
              <Fingerprint class="mr-2 h-4 w-4 opacity-70" />{" "}
              <span class="text-xs text-muted-foreground whitespace-nowrap">
                Serial {aircraft.serial}
              </span>
            </div>
          {/if}
        </div>
      </div>
    </HoverCard.Content>
  </HoverCard.Root>

{:else}
  <div class="w-12 border-4 border-gray-100 bg-gray-100 dark:border-zinc-900 dark:bg-zinc-900 rounded-full aspect-1 -ml-4">
    <div class="w-full h-full rounded-full bg-foreground/15 flex justify-center items-center">
      <Loader2 class="h-6 w-6 opacity-70 animate-spin text-background" />{" "}
    </div>
  </div>
{/if}