<script lang="ts">
  import { formatNumberOmitZero } from "$lib/helpers";
  type FAA8710RowSim = {
    total: number,
    instructionReceived: number,
    instrument: number,
    night: {
      instructionReceived: number,
      total: number,
      tol: number,
    },
    number: {
      flights: number,
      aeroTows: number,
      groundLaunches: number,
      poweredLaunches: number
    }
  }



  export let data: FAA8710RowSim;
  export let title: string;
  export let last = false;

</script>


<!-- <tr class="bg-zinc-50 dark:bg-zinc-900 even:bg-zinc-100 dark:even:bg-zinc-800/30 divide-x dark:divide-zinc-700"> -->
<!-- <div class="{$$restProps.class} content-center aspect-2 font-bold select-none">
  <div class="-rotate-45">{title}</div>
</div> -->
<div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-thin">{formatNumberOmitZero(data.total)}</div>
<div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-thin">{formatNumberOmitZero(data.instructionReceived)}</div>
<div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} bg-hashLight dark:bg-hashDark"></div>
<div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} bg-hashLight dark:bg-hashDark"></div>
<div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} bg-hashLight dark:bg-hashDark"></div>
<div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} bg-hashLight dark:bg-hashDark"></div>
<div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} bg-hashLight dark:bg-hashDark"></div>
<div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-thin">{formatNumberOmitZero(data.instrument)}</div>
{#if title === 'ATD'}
  <div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} bg-hashLight dark:bg-hashDark "></div>
{:else}
  <div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-thin">{formatNumberOmitZero(data.night.instructionReceived)}</div>
{/if}
{#if title === 'FFS'}
  <div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-thin">{formatNumberOmitZero(data.night.tol, 0)}</div>
{:else}
  <div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} bg-hashLight dark:bg-hashDark "></div>
{/if}
{#if title === 'ATD'}
  <div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} bg-hashLight dark:bg-hashDark "></div>
{:else}
  <div class="{$$restProps.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-thin">{formatNumberOmitZero(data.night.total)}</div>
{/if}
{#if title === 'FFS'}
  <div class="{$$restProps.class} {last === true ? '' : 'border-b'} content-center aspect-2 font-thin">{formatNumberOmitZero(data.night.tol, 0)}</div>
{:else}
  <div class="{$$restProps.class} {last === true ? '' : 'border-b'} bg-hashLight dark:bg-hashDark "></div>
{/if}
<!-- </tr> -->