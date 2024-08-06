<script lang="ts">
  import FAA8710ClassHoursTile from "./FAA8710ClassHoursTile.svelte";

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

</script>

<div class="grid grid-cols-5 text-xs relative shadow-sm ring-1 ring-gray-900/5 dark:ring-zinc-700">
  <div class="absolute -z-10 top-0 bottom-0 left-0 right-0 bg-hashLight dark:bg-hashDark"/>
  <!-- Airplane -->
  <div class="row-span-2 border-b content-center text-center font-bold select-none bg-gray-50 dark:bg-zinc-900">
    <div class="-rotate-90 sm:-rotate-45 md:rotate-0">Airplane</div>
  </div>
  <FAA8710ClassHoursTile class="border-l border-b" title="SEL PIC" value={data.airplane.sel.pic} />
  <FAA8710ClassHoursTile class="border-l border-b" title="SES PIC" value={data.airplane.ses.pic} />
  <FAA8710ClassHoursTile class="border-l border-b" title="MEL PIC" value={data.airplane.mel.pic} />
  <FAA8710ClassHoursTile class="border-l border-b" title="MES PIC" value={data.airplane.mes.pic} />
  <FAA8710ClassHoursTile class="border-l border-b" title="SEL SIC" value={data.airplane.sel.sic} />
  <FAA8710ClassHoursTile class="border-l border-b" title="SES SIC" value={data.airplane.ses.sic} />
  <FAA8710ClassHoursTile class="border-l border-b" title="MEL SIC" value={data.airplane.mel.sic} />
  <FAA8710ClassHoursTile class="border-l border-b" title="MES SIC" value={data.airplane.mes.sic} />
  <!-- R.C. -->
  <div class="row-span-1 border-b content-center text-center font-bold select-none bg-gray-100 dark:bg-zinc-950">
    <div class="-rotate-90 sm:-rotate-45 md:rotate-0">R.C.</div>
  </div>
  <FAA8710ClassHoursTile class="border-l border-b" title="HEL" value={data.rc.hel} striped={true} />
  <FAA8710ClassHoursTile class="border-l border-b" title="GYRO" value={data.rc.gyro} striped={true} />
  <div class="bg-gray-100 dark:bg-zinc-950 -z-20 border-l border-b"/>
  <div class="bg-gray-100 dark:bg-zinc-950 -z-20 border-l border-b"/>
  <!-- L.T.A. -->
  <div class="row-span-1 border-b content-center text-center font-bold select-none bg-gray-50 dark:bg-zinc-900">
    <div class="-rotate-90 sm:-rotate-45 md:rotate-0">L.T.A.</div>
  </div>
  <FAA8710ClassHoursTile class="border-l border-b" title="Balloon" value={data.lta.balloon} />
  <FAA8710ClassHoursTile class="border-l border-b" title="Airship" value={data.lta.airship} />
  <div class="bg-gray-50 dark:bg-zinc-900 -z-20 border-l border-b"/>
  <div class="bg-gray-50 dark:bg-zinc-900 -z-20 border-l border-b"/>
  <!-- Simulators -->
  <div class="row-span-3 content-center text-center font-bold select-none bg-gray-100 dark:bg-zinc-950">
    <div class="-rotate-90 sm:-rotate-45 md:rotate-0">Simulators</div>
  </div>
  <FAA8710ClassHoursTile class="border-l border-b" title="FFS ME" value={data.sim.ffs.me} striped={true} />
  <FAA8710ClassHoursTile class="border-l border-b" title="FTD ME" value={data.sim.ftd.me} striped={true} />
  <FAA8710ClassHoursTile class="border-l border-b" title="ATD ME" value={data.sim.atd.me} striped={true} />
  <div class="bg-gray-100 dark:bg-zinc-950 -z-20 border-l border-b"/>
  <FAA8710ClassHoursTile class="border-l border-b" title="FFS SE" value={data.sim.ffs.se} striped={true} />
  <FAA8710ClassHoursTile class="border-l border-b" title="FTD SE" value={data.sim.ftd.se} striped={true} />
  <FAA8710ClassHoursTile class="border-l border-b" title="ATD SE" value={data.sim.atd.se} striped={true} />
  <div class="bg-gray-100 dark:bg-zinc-950 -z-20 border-l border-b"/>
  <FAA8710ClassHoursTile class="border-l" title="FFS HEL" value={data.sim.ffs.hel} striped={true} />
  <FAA8710ClassHoursTile class="border-l" title="FTD HEL" value={data.sim.ftd.hel} striped={true} />
  <FAA8710ClassHoursTile class="border-l" title="ATD HEL" value={data.sim.atd.hel} striped={true} />
  <div class="bg-gray-100 dark:bg-zinc-950 -z-20 border-l"/>
</div>