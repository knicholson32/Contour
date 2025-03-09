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



  interface Props {
    data: FAA8710RowSim;
    title: string;
    last?: boolean;
    [key: string]: any
  }

  let { data, title, last = false, ...rest }: Props = $props();

</script>


<!-- <tr class="bg-zinc-50 dark:bg-zinc-900 even:bg-zinc-100 dark:even:bg-zinc-800/30 divide-x dark:divide-zinc-700"> -->
<!-- <div class="{$$restProps.class} content-center aspect-2 font-bold select-none">
  <div class="-rotate-45">{title}</div>
</div> -->
<div class="{rest.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.total)}</div>
<div class="{rest.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.instructionReceived)}</div>
<div class="{rest.class} border-r {last === true ? '' : 'border-b'} -z-20"></div>
<div class="{rest.class} border-r {last === true ? '' : 'border-b'} -z-20"></div>
<div class="{rest.class} border-r {last === true ? '' : 'border-b'} -z-20"></div>
<div class="{rest.class} border-r {last === true ? '' : 'border-b'} -z-20"></div>
<div class="{rest.class} border-r {last === true ? '' : 'border-b'} -z-20"></div>
<div class="{rest.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.instrument)}</div>
{#if title === 'ATD'}
  <div class="{rest.class} border-r {last === true ? '' : 'border-b'} -z-20"></div>
{:else}
  <div class="{rest.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.night.instructionReceived)}</div>
{/if}
{#if title === 'FFS'}
  <div class="{rest.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.night.tol, 0)}</div>
{:else}
  <div class="{rest.class} border-r {last === true ? '' : 'border-b'} -z-20"></div>
{/if}
{#if title === 'ATD'}
  <div class="{rest.class} border-r {last === true ? '' : 'border-b'} -z-20"></div>
{:else}
  <div class="{rest.class} border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.night.total)}</div>
{/if}
{#if title === 'FFS'}
  <div class="{rest.class} {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.night.tol, 0)}</div>
{:else}
  <div class="{rest.class} {last === true ? '' : 'border-b'} -z-20"></div>
{/if}
<!-- </tr> -->