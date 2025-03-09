<script lang="ts">
  import { formatNumberOmitZero } from "$lib/helpers";

  type FAA8710Row = {
    total: number,
    instructionReceived: number,
    solo: number,
    pic: number,
    sic: number,
    xc: {
      instructionReceived: number,
      solo: number,
      pic: number,
      sic: number,
    },
    instrument: number,
    night: {
      tolTotal: number,
      instructionReceived: number,
      pic: number,
      sic: number,
      picTol: number,
      sicTol: number,
    },
    number: {
      flights: number,
      aeroTows: number,
      groundLaunches: number,
      poweredLaunches: number
    }
  }


  interface Props {
    data: FAA8710Row;
    title: string;
    [key: string]: any
  }

  let { data, title, ...rest }: Props = $props();

</script>


<!-- <tr class="bg-zinc-50 dark:bg-zinc-900 even:bg-zinc-100 dark:even:bg-zinc-800/30 divide-x dark:divide-zinc-700"> -->
<!-- <div class="{$$restProps.class} aspect-1-bak content-center font-bold select-none p-3">
  <div class="-rotate-45">{title}</div>
</div> -->
<div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal">{formatNumberOmitZero(data.total)}</div>
<div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal">{formatNumberOmitZero(data.instructionReceived)}</div>
<div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal">{formatNumberOmitZero(data.solo)}</div>
<div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal flex flex-col divide-y">
  <div class="flex-grow relative content-center inline-flex items-center gap-1 py-2 px-1">
    <div class="opacity-40 text-xxs font-normal select-none">PIC</div>
    <div>{formatNumberOmitZero(data.pic)}</div>
  </div>
  <div class="flex-grow relative content-center inline-flex items-center gap-1 py-2 px-1">
    <div class="opacity-40 text-xxs font-normal select-none">SIC</div>
    <div>{formatNumberOmitZero(data.sic)}</div>
  </div>
</div>
<div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal">{formatNumberOmitZero(data.xc.instructionReceived)}</div>
<div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal">{formatNumberOmitZero(data.xc.solo)}</div>
{#if title === 'Gliders'}
  <div class="{rest.class} border-r border-b bg-gray-100 dark:bg-zinc-925 -z-20"></div>
{:else}
  <div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal flex flex-col divide-y">
    <div class="flex-grow relative content-center inline-flex items-center gap-1 py-2 px-1">
      <div class="opacity-40 text-xxs font-normal select-none">PIC</div>
      <div>{formatNumberOmitZero(data.xc.pic)}</div>
    </div>
    <div class="flex-grow relative content-center inline-flex items-center gap-1 py-2 px-1">
      <div class="opacity-40 text-xxs font-normal select-none">SIC</div>
      <div>{formatNumberOmitZero(data.xc.sic)}</div>
    </div>
  </div>
{/if}
<div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal">{formatNumberOmitZero(data.instrument)}</div>
{#if title === 'Gliders'}
  <div class="border-r border-b bg-gray-100 dark:bg-zinc-925 -z-20"></div>
  <div class="border-r border-b bg-gray-100 dark:bg-zinc-925 -z-20"></div>
  <div class="border-r border-b bg-gray-100 dark:bg-zinc-925 -z-20"></div>
  <div class="border-b bg-gray-100 dark:bg-zinc-925 -z-20"></div>
{:else}
  <div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal">{formatNumberOmitZero(data.night.instructionReceived)}</div>
  <div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal">{formatNumberOmitZero(data.night.tolTotal, 0)}</div>
  <div class="{rest.class} border-r border-b aspect-1-bak content-center font-normal flex flex-col divide-y">
    <div class="flex-grow relative content-center inline-flex items-center gap-1 py-2 px-1">
      <div class="opacity-40 text-xxs font-normal select-none">PIC</div>
      <div>{formatNumberOmitZero(data.night.pic)}</div>
    </div>
    <div class="flex-grow relative content-center inline-flex items-center gap-1 py-2 px-1">
      <div class="opacity-40 text-xxs font-normal select-none">SIC</div>
      <div>{formatNumberOmitZero(data.night.sic)}</div>
    </div>
  </div>
  <div class="{rest.class} border-b aspect-1-bak content-center font-normal flex flex-col divide-y">
    <div class="flex-grow relative content-center inline-flex items-center gap-1 py-2 px-1">
      <div class="opacity-40 text-xxs font-normal select-none">PIC</div>
      <div>{formatNumberOmitZero(data.night.picTol, 0)}</div>
    </div>
    <div class="flex-grow relative content-center inline-flex items-center gap-1 py-2 px-1">
      <div class="opacity-40 text-xxs font-normal select-none">SIC</div>
      <div>{formatNumberOmitZero(data.night.sicTol, 0)}</div>
    </div>
  </div>
{/if}