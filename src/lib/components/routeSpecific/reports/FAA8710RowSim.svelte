<script lang="ts">
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


  const format = (val: number, dec=1): string => {
    if (val === 0) return '';
    else return val.toFixed(dec);
  }

  export let data: FAA8710RowSim;

  export let title: string;

</script>


<tr class="bg-zinc-50 dark:bg-zinc-900 even:bg-zinc-100 dark:even:bg-zinc-800/30 divide-x dark:divide-zinc-700">
  <th><div class="content-center aspect-2 font-bold select-none">{title}</div></th>
  <td><div class="content-center aspect-2 font-thin">{format(data.total)}</div></td>
  <td><div class="content-center aspect-2 font-thin">{format(data.instructionReceived)}</div></td>
  <td class="bg-hashLight dark:bg-hashDark"></td>
  <td class="bg-hashLight dark:bg-hashDark"></td>
  <td class="bg-hashLight dark:bg-hashDark"></td>
  <td class="bg-hashLight dark:bg-hashDark"></td>
  <td class="bg-hashLight dark:bg-hashDark"></td>
  <td><div class="content-center aspect-2 font-thin">{format(data.instrument)}</div></td>
  {#if title === 'ATD'}
    <td class="bg-hashLight dark:bg-hashDark "></td>
  {:else}
    <td><div class="content-center aspect-2 font-thin">{format(data.night.instructionReceived)}</div></td>
  {/if}
  {#if title === 'FFS'}
    <td><div class="content-center aspect-2 font-thin">{format(data.night.tol, 0)}</div></td>
  {:else}
    <td class="bg-hashLight dark:bg-hashDark "></td>
  {/if}
  {#if title === 'ATD'}
    <td class="bg-hashLight dark:bg-hashDark "></td>
  {:else}
    <td><div class="content-center aspect-2 font-thin">{format(data.night.total)}</div></td>
  {/if}
  {#if title === 'FFS'}
    <td><div class="content-center aspect-2 font-thin">{format(data.night.tol, 0)}</div></td>
  {:else}
    <td class="bg-hashLight dark:bg-hashDark "></td>
  {/if}
</tr>