<script lang="ts">

  export let data: {
    airplane: {
      sel: {
        pic: number,
        sic: number
      },
      ses: {
        pic: number,
        sic: number
      },
      mel: {
        pic: number,
        sic: number
      },
      mes: {
        pic: number,
        sic: number
      }
    },
    rc: {
      hel: number,
      gyro: number
    },
    lta: {
      balloon: number,
      airship: number,
    },
    sim: {
      ffs: {
        me: number,
        se: number,
        hel: number
      },
      ftd: {
        me: number,
        se: number,
        hel: number
      },
      atd: {
        me: number,
        se: number,
        hel: number
      }
    }
  };

  const format = (val: number, dec=1): string => {
    if (val === 0) return '';
    else return val.toFixed(dec);
  }

</script>

<table class="w-full m-0 p-0 text-xs text-center">
  <tbody class="bg-zinc-900 divide-y dark:divide-zinc-700 border dark:border-zinc-700">
    <tr class="bg-zinc-50 dark:bg-zinc-900 even:bg-zinc-100 dark:even:bg-zinc-800/30 divide-x dark:divide-zinc-700 font-thin">
      <td class="w-1/5 p-0"><div class="aspect-1 content-center font-bold select-none">Airplane</div></td>
      <td class="w-1/5 p-0"><div class="aspect-1 content-center font-normal divide-y dark:divide-zinc-700">
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">SEL PIC</div>
          <div>{format(data.airplane.sel.pic)}</div>
        </div>
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">SEL SIC</div>
          <div>{format(data.airplane.sel.sic)}</div>
        </div>
      </div></td>
      <td class="w-1/5 p-0"><div class="aspect-1 content-center font-normal divide-y dark:divide-zinc-700">
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">SES PIC</div>
          <div>{format(data.airplane.ses.pic)}</div>
        </div>
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">SES SIC</div>
          <div>{format(data.airplane.ses.sic)}</div>
        </div>
      </div></td>
      <td class="w-1/5 p-0"><div class="aspect-1 content-center font-normal divide-y dark:divide-zinc-700">
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">MEL PIC</div>
          <div>{format(data.airplane.mel.pic)}</div>
        </div>
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">MEL SIC</div>
          <div>{format(data.airplane.mel.sic)}</div>
        </div>
      </div></td>
      <td class="w-1/5 p-0"><div class="aspect-1 content-center font-normal divide-y dark:divide-zinc-700">
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">MES PIC</div>
          <div>{format(data.airplane.mes.pic)}</div>
        </div>
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">MES SIC</div>
          <div>{format(data.airplane.mes.sic)}</div>
        </div>
      </div></td>
    </tr>
    <tr class="bg-zinc-50 dark:bg-zinc-900 even:bg-zinc-100 dark:even:bg-zinc-800/30 divide-x dark:divide-zinc-700 font-thin">
      <td class="w-1/5 p-0"><div class="aspect-2 content-center font-bold select-none">R.C.</div></td>
      <td class="w-1/5 p-0"><div class="aspect-2 content-center relative">
        <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">HEL</div>
        <div>{format(data.rc.hel)}</div>
      </div></td>
      <td class="w-1/5 p-0"><div class="aspect-2 content-center relative">
        <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">GRYO</div>
        <div>{format(data.rc.gyro)}</div>
      </div></td>
      <td class="w-1/5 p-0"><div class="aspect-2 content-center bg-hashLight dark:bg-hashDark"></div></td>
      <td class="w-1/5 p-0"><div class="aspect-2 content-center bg-hashLight dark:bg-hashDark"></div></td>
    </tr>
    <tr class="bg-zinc-50 dark:bg-zinc-900 even:bg-zinc-100 dark:even:bg-zinc-800/30 divide-x dark:divide-zinc-700">
      <td class="w-1/5 p-0"><div class="aspect-2 content-center font-bold select-none">L.T.A.</div></td>
      <td class="w-1/5 p-0"><div class="aspect-2 content-center relative">
        <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">Balloon</div>
        <div>{format(data.lta.balloon)}</div>
      </div></td>
      <td class="w-1/5 p-0"><div class="aspect-2 content-center relative">
        <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">Airship</div>
        <div>{format(data.lta.airship)}</div>
      </div></td>
      <td class="w-1/5 p-0"><div class="aspect-2 content-center bg-hashLight dark:bg-hashDark"></div></td>
      <td class="w-1/5 p-0"><div class="aspect-2 content-center bg-hashLight dark:bg-hashDark"></div></td>
    </tr>
    <tr class="bg-zinc-50 dark:bg-zinc-900 even:bg-zinc-100 dark:even:bg-zinc-800/30 divide-x dark:divide-zinc-700 font-thin">
      <td class="w-1/5 p-0"><div class="aspect-1 content-center font-bold select-none">Simulators</div></td>
      <td class="w-1/5 p-0"><div class="aspect-1 content-center divide-y dark:divide-zinc-700">
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">FFS ME</div>
          <div>{format(data.sim.ffs.me)}</div>
        </div>
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">FFS SE</div>
          <div>{format(data.sim.ffs.se)}</div>
        </div>
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">FFS HEL</div>
          <div>{format(data.sim.ffs.hel)}</div>
        </div>
      </div></td>
      <td class="w-1/5 p-0"><div class="aspect-1 content-center divide-y dark:divide-zinc-700">
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">FTD ME</div>
          <div class="">{format(data.sim.ftd.me)}</div>
        </div>
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">FTD SE</div>
          <div>{format(data.sim.ftd.se)}</div>
        </div>
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">FTD HEL</div>
          <div>{format(data.sim.ftd.hel)}</div>
        </div>
      </div></td>
      <td class="w-1/5 p-0"><div class="aspect-1 content-center divide-y dark:divide-zinc-700">
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">ATD ME</div>
          <div>{format(data.sim.atd.me)}</div>
        </div>
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">ATD SE</div>
          <div>{format(data.sim.atd.se)}</div>
        </div>
        <div class="relative aspect-2 content-center">
          <div class="absolute top-0 left-0.5 opacity-40 text-xxs font-normal select-none">ATD HEL</div>
          <div>{format(data.sim.atd.hel)}</div>
        </div>
      </div></td>
      <td class="w-1/5 p-0"><div class="aspect-1 content-center divide-y dark:divide-zinc-700">
        <div class="relative aspect-2 content-center bg-hashLight dark:bg-hashDark"></div>
        <div class="relative aspect-2 content-center bg-hashLight dark:bg-hashDark"></div>
        <div class="relative aspect-2 content-center bg-hashLight dark:bg-hashDark"></div>
      </div></td>
    </tr>
  </tbody>
  
</table>