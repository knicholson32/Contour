<script lang="ts">
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


  const format = (val: number, dec=1): string => {
    if (val === 0) return '';
    else return val.toFixed(dec);
  }

  export let data: FAA8710Row;

  export let title: string;

</script>


<tr class="bg-zinc-50 dark:bg-zinc-900 even:bg-zinc-100 dark:even:bg-zinc-800/30 divide-x dark:divide-zinc-700">
  <th><div class="aspect-1 content-center font-bold select-none">{title}</div></th>
  <td><div class="aspect-1 content-center font-thin">{format(data.total)}</div></td>
  <td><div class="aspect-1 content-center font-thin">{format(data.instructionReceived)}</div></td>
  <td><div class="aspect-1 content-center font-thin">{format(data.solo)}</div></td>
  <td><div class="aspect-1 content-center font-thin flex flex-col divide-y">
      <div class="flex-grow relative content-center">
        <div class="absolute top-1 left-1 opacity-40 text-xxs font-normal select-none">PIC</div>
        <div>{format(data.pic)}</div>
      </div>
      <div class="flex-grow relative content-center">
        <div class="absolute top-1 left-1 opacity-40 text-xxs font-normal select-none">SIC</div>
        <div>{format(data.sic)}</div>
      </div>
    </div></td>
  <td><div class="aspect-1 content-center font-thin">{format(data.xc.instructionReceived)}</div></td>
  <td><div class="aspect-1 content-center font-thin">{format(data.xc.solo)}</div></td>
  {#if title === 'Gliders'}
    <td class="bg-hashLight dark:bg-hashDark"></td>
  {:else}
    <td><div class="aspect-1 content-center font-thin flex flex-col divide-y">
      <div class="flex-grow relative content-center">
        <div class="absolute top-1 left-1 opacity-40 text-xxs font-normal select-none">PIC</div>
        <div>{format(data.xc.pic)}</div>
      </div>
      <div class="flex-grow relative content-center">
        <div class="absolute top-1 left-1 opacity-40 text-xxs font-normal select-none">SIC</div>
        <div>{format(data.xc.sic)}</div>
      </div>
    </div></td>
  {/if}
  <td><div class="aspect-1 content-center font-thin">{format(data.instrument)}</div></td>
  {#if title === 'Gliders'}
    <td class="bg-hashLight dark:bg-hashDark "></td>
    <td class="bg-hashLight dark:bg-hashDark "></td>
    <td class="bg-hashLight dark:bg-hashDark "></td>
    <td class="bg-hashLight dark:bg-hashDark "></td>
  {:else}
    <td><div class="aspect-1 content-center font-thin">{format(data.night.instructionReceived)}</div></td>
    <td><div class="aspect-1 content-center font-thin">{format(data.night.tolTotal, 0)}</div></td>
    <td><div class="aspect-1 content-center font-thin flex flex-col divide-y">
      <div class="flex-grow relative content-center">
        <div class="absolute top-1 left-1 opacity-40 text-xxs font-normal select-none">PIC</div>
        <div>{format(data.night.pic)}</div>
      </div>
      <div class="flex-grow relative content-center">
        <div class="absolute top-1 left-1 opacity-40 text-xxs font-normal select-none">SIC</div>
        <div>{format(data.night.sic)}</div>
      </div>
    </div></td>
    <td><div class="aspect-1 content-center font-thin flex flex-col divide-y">
      <div class="flex-grow relative content-center">
        <div class="absolute top-1 left-1 opacity-40 text-xxs font-normal select-none">PIC</div>
        <div>{format(data.night.picTol, 0)}</div>
      </div>
      <div class="flex-grow relative content-center">
        <div class="absolute top-1 left-1 opacity-40 text-xxs font-normal select-none">SIC</div>
        <div>{format(data.night.sicTol, 0)}</div>
      </div>
    </div></td>
  {/if}
</tr>