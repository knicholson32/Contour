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
    even: boolean;
    last?: boolean;
    [key: string]: any
  }

  let { data, title, even, last = false, ...rest }: Props = $props();

</script>


{#snippet EmptyCell(last = false, noRight = false)}
  <div class="{rest.class} z-[2] {noRight ? '' : 'border-r'} {last === true ? '' : 'border-b'} {even ? '!bg-gray-100/50 dark:!bg-zinc-925/50' : '!bg-gray-50/50 dark:!bg-zinc-900/70'}"></div>
{/snippet}


<!-- <tr class="bg-zinc-50 dark:bg-zinc-900 even:bg-zinc-100 dark:even:bg-zinc-800/30 divide-x dark:divide-zinc-700"> -->
<!-- <div class="{$$restProps.class} content-center aspect-2 font-bold select-none">
  <div class="-rotate-45">{title}</div>
</div> -->
<div class="{rest.class} z-[2] border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.total)}</div>
<div class="{rest.class} z-[2] border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.instructionReceived)}</div>
{@render EmptyCell(last)}
{@render EmptyCell(last)}
{@render EmptyCell(last)}
{@render EmptyCell(last)}
{@render EmptyCell(last)}
<div class="{rest.class} z-[2] border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.instrument)}</div>
{#if title === 'ATD'}
  {@render EmptyCell(last)}
{:else}
  <div class="{rest.class} z-[2] border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.night.instructionReceived)}</div>
{/if}
{#if title === 'FFS'}
  <div class="{rest.class} z-[2] border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.night.tol, 0)}</div>
{:else}
  {@render EmptyCell(last)}
{/if}
{#if title === 'ATD'}
  {@render EmptyCell(last)}
{:else}
  <div class="{rest.class} z-[2] border-r {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.night.total)}</div>
{/if}
{#if title === 'FFS'}
  <div class="{rest.class} z-[2] {last === true ? '' : 'border-b'} content-center aspect-2 font-normal">{formatNumberOmitZero(data.night.tol, 0)}</div>
{:else}
  {@render EmptyCell(last, true)}
{/if}
<!-- </tr> -->