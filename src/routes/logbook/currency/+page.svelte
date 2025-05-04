<script lang="ts">
  import CalendarBar from "$lib/components/routeSpecific/currency/CalendarBar.svelte";
  import CurrencyChip from "$lib/components/routeSpecific/currency/CurrencyChip.svelte";
  import CurrencyChipGenNight from "$lib/components/routeSpecific/currency/CurrencyChipGenNight.svelte";
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  import * as Card from "$lib/components/ui/card";
  import { dateToDateStringFormMonthDayYear } from "$lib/helpers";
  import { BookCheck, Check, X } from "lucide-svelte";

  interface Props {
    data: import('./$types').PageData;
  }

  let { data }: Props = $props();

  let selected: null | {
    currencyExpiry: number,
    title: string
  } = $state(null);
  // {
  //   currencyExpiry: data.currency.asel.general.currencyExpiry,
  //   title: 'ASEL General'
  // }

</script>

<OneColumn>

  <div class="flex flex-col gap-4 p-4">
      <h2 class="text-3xl font-thin tracking-wide">Currency</h2>
      <div class="flex flex-row gap-4">
        <div class="grow border rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex flex-col gap-6 p-3 relative overflow-hidden">
          <div class="absolute left-0 right-0 top-0 h-16 border-b">
            <div class="w-full h-full bg-hashThickLight dark:bg-hashThickDark opacity-10 dark:opacity-25"></div>
          </div>
          <div class="flex flex-row items-center relative">
            <button onclick={() => selected = null} class="bg-white dark:bg-zinc-800 group rounded-lg p-2 border dark:border-zinc-700/30">
              {#if selected === null}
                <BookCheck class="w-5 h-5"/>
              {:else}
                <X class="w-5 h-5 group-hover:text-red-500"/>
              {/if}
            </button>
            <div class="grow mx-4 h-full">
              <CalendarBar {selected}/>
            </div>
            <div class="text-xxs font-mono select-none">as of <span class="text-sky-500 select-all">{dateToDateStringFormMonthDayYear(data.nowSeconds)}</span></div>
          </div>
          <div class="flex flex-col xs:flex-row flex-wrap items-center justify-center md:justify-start gap-4">
            <CurrencyChipGenNight bind:selected data={{general: data.currency.asel.general, night: data.currency.asel.night }} title="ASEL" nowSeconds={data.nowSeconds} />
            <CurrencyChipGenNight bind:selected data={{general: data.currency.amel.general, night: data.currency.amel.night }} title="AMEL" nowSeconds={data.nowSeconds} />
            <CurrencyChip bind:selected isCurrent={data.currency.ifr.isCurrent} catClass="Airplane" type="IFR" currencyExpiry={data.currency.ifr.currencyExpiry} nowSeconds={data.nowSeconds} />
            {#each data.currency.types as type}
              <CurrencyChipGenNight bind:selected data={{general: type.general, night: type.night }} title={type.type.typeCode} nowSeconds={data.nowSeconds} />
            {/each}
          </div>
        </div>
        <!-- <div class="grow border rounded-2xl bg-zinc-900 h-24">test 123</div> -->
      </div>

  </div>
  
  <div class="flex-col hidden">
    <div class="flex-1 space-y-4 p-3 md:p-6 pt-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">Currency</h2>
      </div>

      <div class="grid md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-2">


        <Card.Root class="">
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">General (ASEL)</Card.Title>
            <!-- <Timer class="h-4 w-4 text-muted-foreground" /> -->
          </Card.Header>
          <Card.Content>
            <div class="flex flex-row gap-2">
              <div>
                <div class="text-2xl font-bold">
                  {#if data.currency.asel.general.isCurrent}
                    Current
                  {:else}
                    Not Current
                  {/if}
                </div>
                <p class="text-xs text-muted-foreground">Longest day was 0 hr</p>
              </div>
              <div class="grow"></div>
              <div class="text-right">
                <div>{Math.floor((data.currency.asel.general.currencyExpiry - data.nowSeconds) / (60 * 60 * 24))} days</div>
                <div>Remaining</div>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root class="">
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">Night (ASEL)</Card.Title>
            <!-- <Timer class="h-4 w-4 text-muted-foreground" /> -->
          </Card.Header>
          <Card.Content>
            <div class="flex flex-row gap-2">
              <div>
                <div class="text-2xl font-bold">
                  {#if data.currency.asel.night.isCurrent}
                    Current
                  {:else}
                    Not Current
                  {/if}
                </div>
                <p class="text-xs text-muted-foreground">Longest day was 0 hr</p>
              </div>
              <div class="grow"></div>
              <div class="text-right">
                <div>{Math.floor((data.currency.asel.night.currencyExpiry - data.nowSeconds) / (60 * 60 * 24))} days</div>
                <div>Remaining</div>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root class="">
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-medium">IFR (Airplane)</Card.Title>
            <!-- <Timer class="h-4 w-4 text-muted-foreground" /> -->
          </Card.Header>
          <Card.Content>
            <div class="flex flex-row gap-2">
              <div>
                <div class="text-2xl font-bold">
                  {#if data.currency.ifr.isCurrent}
                    Current
                  {:else}
                    Not Current
                  {/if}
                </div>
                <p class="text-xs text-muted-foreground">Longest day was 0 hr</p>
              </div>
              <div class="grow"></div>
              <div class="text-right">
                <div>{Math.floor((data.currency.ifr.currencyExpiry - data.nowSeconds) / (60 * 60 * 24))} days</div>
                <div>Remaining</div>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        {#each data.currency.types as type}

          <Card.Root class="">
            <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
              <Card.Title class="text-sm font-medium">General {type.type.make} {type.type.model} ({type.type.typeCode})</Card.Title>
              <!-- <Timer class="h-4 w-4 text-muted-foreground" /> -->
            </Card.Header>
            <Card.Content>
              <div class="flex flex-row gap-2">
                <div>
                  <div class="text-2xl font-bold">
                    {#if type.general.isCurrent}
                      Current
                    {:else}
                      Not Current
                    {/if}
                  </div>
                  <p class="text-xs text-muted-foreground">Longest day was 0 hr</p>
                </div>
                <div class="grow"></div>
                <div class="text-right">
                  <div>{Math.floor((type.general.currencyExpiry - data.nowSeconds) / (60 * 60 * 24))} days</div>
                  <div>Remaining</div>
                </div>
              </div>
            </Card.Content>
          </Card.Root>

          <Card.Root class="">
            <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
              <Card.Title class="text-sm font-medium">Night {type.type.make} {type.type.model} ({type.type.typeCode})</Card.Title>
              <!-- <Timer class="h-4 w-4 text-muted-foreground" /> -->
            </Card.Header>
            <Card.Content>
              <div class="flex flex-row gap-2">
                <div>
                  <div class="text-2xl font-bold">
                    {#if type.night.isCurrent}
                      Current
                    {:else}
                      Not Current
                    {/if}
                  </div>
                  <p class="text-xs text-muted-foreground">Longest day was 0 hr</p>
                </div>
                <div class="grow"></div>
                <div class="text-right">
                  <div>{Math.floor((type.night.currencyExpiry - data.nowSeconds) / (60 * 60 * 24))} days</div>
                  <div>Remaining</div>
                </div>
              </div>
            </Card.Content>
          </Card.Root>

        {/each}

      </div>

    </div>
  </div>

</OneColumn>