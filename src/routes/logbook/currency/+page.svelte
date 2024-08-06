<script lang="ts">
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  import * as Card from "$lib/components/ui/card";

  export let data: import('./$types').PageData;

</script>

<OneColumn>
  
  <div class="flex-col md:flex">
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
              <div class="grow" />
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
              <div class="grow" />
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
              <div class="grow" />
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
                <div class="grow" />
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
                <div class="grow" />
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