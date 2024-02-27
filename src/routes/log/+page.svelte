<script lang="ts">
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  import * as Table from "$lib/components/ui/table";
  import * as Pagination from "$lib/components/ui/pagination";
  import { ChevronLeft, ChevronRight, Link } from 'lucide-svelte';
  import { timeConverter } from "$lib/helpers";

  export let data: import('./$types').PageData;
 
  let innerWidth: number;
  $: isDesktop = innerWidth >= 768;
 
  let count = 20;
  $: perPage = isDesktop ? 3 : 8;
  $: siblingCount = isDesktop ? 1 : 0;
  
  const totals = {
    total: 0,
    SEL: 0,
    MEL: 0,
    actInst: 0,
    simInst: 0,
    night: 0
  }

  for (const leg of data.legs) {
    totals.total += leg.totalTime;

    if (leg.aircraft.type.catClass === 'ASEL' || leg.aircraft.type.catClass === 'ASES') totals.SEL += leg.totalTime
    else if (leg.aircraft.type.catClass === 'AMEL' || leg.aircraft.type.catClass === 'AMES') totals.MEL += leg.totalTime

    totals.simInst += leg.simulatedInstrument;
    totals.actInst += leg.actualInstrument;
    totals.night += leg.night;
  }


</script>
<svelte:window bind:innerWidth />


<OneColumn white={true}>
  <Table.Root>
    <!-- <Table.Caption>A list of your recent invoices.</Table.Caption> -->
    <Table.Header>
      <Table.Row>
        <Table.Head class="text-center">Edit</Table.Head>
        <Table.Head class="w-[100px]">Date</Table.Head>
        <Table.Head>Type</Table.Head>
        <Table.Head>Ident</Table.Head>
        <Table.Head class="text-center">Total</Table.Head>
        <Table.Head class="text-center">SEL</Table.Head>
        <Table.Head class="text-center">MEL</Table.Head>
        <Table.Head class="text-center">Actual</Table.Head>
        <Table.Head class="text-center">Sim</Table.Head>
        <Table.Head class="text-center">Night</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.legs as leg, i (i)}
        <Table.Row>
          <Table.Cell class="flex justify-center">
            <a href="/leg/{leg.id}">
              <Link class="h-4 w-4 text-muted-foreground" />
            </a>
          </Table.Cell>
          {#if leg.startTime_utc === null}
            <Table.Cell class="font-medium">Unknown</Table.Cell>
          {:else}
            <Table.Cell class="font-medium">{timeConverter(leg.startTime_utc, { dateOnly: true, shortYear: true })}</Table.Cell>
          {/if}
          <Table.Cell>{leg.aircraft.type.typeCode}</Table.Cell>
          <Table.Cell>{leg.aircraft.registration}</Table.Cell>
          <Table.Cell class="text-center">{leg.totalTime}</Table.Cell>
          {#if leg.aircraft.type.catClass === 'ASEL' || leg.aircraft.type.catClass === 'ASES'}
            <Table.Cell class="text-center">{leg.totalTime.toFixed(1)}</Table.Cell>
          {:else}
            <Table.Cell class="text-center">0.0</Table.Cell>
          {/if}
          {#if leg.aircraft.type.catClass === 'AMEL' || leg.aircraft.type.catClass === 'AMES'}
            <Table.Cell class="text-center">{leg.totalTime.toFixed(1)}</Table.Cell>
          {:else}
            <Table.Cell class="text-center">0.0</Table.Cell>
          {/if}
          <Table.Cell class="text-center">{leg.actualInstrument.toFixed(1)}</Table.Cell>
          <Table.Cell class="text-center">{leg.simulatedInstrument.toFixed(1)}</Table.Cell>
          <Table.Cell class="text-center">{leg.night.toFixed(1)}</Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
    <Table.Header>
      <Table.Row>
        <Table.Head></Table.Head>
        <Table.Head></Table.Head>
        <Table.Head></Table.Head>
        <Table.Head class="text-center">{totals.total.toFixed(1)}</Table.Head>
        <Table.Head class="text-center">{totals.SEL.toFixed(1)}</Table.Head>
        <Table.Head class="text-center">{totals.MEL.toFixed(1)}</Table.Head>
        <Table.Head class="text-center">{totals.actInst.toFixed(1)}</Table.Head>
        <Table.Head class="text-center">{totals.simInst.toFixed(1)}</Table.Head>
        <Table.Head class="text-center">{totals.night.toFixed(1)}</Table.Head>
      </Table.Row>
    </Table.Header>
  </Table.Root>

  <Pagination.Root {count} {perPage} {siblingCount} let:pages let:currentPage class="my-2">
    <Pagination.Content>
      <Pagination.Item>
        <Pagination.PrevButton>
          <ChevronLeft class="h-4 w-4" />
          <span class="hidden sm:block">Previous</span>
        </Pagination.PrevButton>
      </Pagination.Item>
      {#each pages as page (page.key)}
        {#if page.type === "ellipsis"}
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
        {:else}
          <Pagination.Item>
            <Pagination.Link {page} isActive={currentPage == page.value}>
              {page.value}
            </Pagination.Link>
          </Pagination.Item>
        {/if}
      {/each}
      <Pagination.Item>
        <Pagination.NextButton>
          <span class="hidden sm:block">Next</span>
          <ChevronRight class="h-4 w-4" />
        </Pagination.NextButton>
      </Pagination.Item>
    </Pagination.Content>
  </Pagination.Root>

</OneColumn>