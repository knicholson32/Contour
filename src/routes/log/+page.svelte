<script lang="ts">
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  import * as Table from "$lib/components/ui/table";
  import * as Pagination from "$lib/components/ui/pagination";
  import * as Select from "$lib/components/ui/select";
  import { ChevronLeft, ChevronRight, Hash, Link } from 'lucide-svelte';
  import { timeConverter } from "$lib/helpers";
  import { afterNavigate, goto } from "$app/navigation";
  import type { Selected } from "bits-ui";

  export let data: import('./$types').PageData;
 
  let innerWidth: number;
  $: isDesktop = innerWidth >= 768;
 
  $: perPage = isDesktop ? data.select : data.select;
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

  let page = data.page;

  afterNavigate(() => {
    page = data.page + 1;
  });

  const onPageChange = (page: number) => goto(`?page=${page}&select=${data.select}`);
  const onSelectedChange = (s: Selected<number> | undefined) => {
    if (s === undefined) return;
    const currentStart = data.page * data.select;
    const newPage = Math.ceil(currentStart / s.value);
    console.log(newPage, s.value);
    goto(`?page=${newPage + 1}&select=${s.value}`);
  }

  const perPageOptions = [16, 32, 64, 128];
  if (!perPageOptions.includes(data.select)) {
    perPageOptions.push(data.select);
    perPageOptions.sort((a, b) => a - b);
  }

  const options = perPageOptions.flatMap((v) => {
    return { value: v, label: `${v} per page` }
  });

  let selected: Selected<number> = {
    value: data.select,
    label: `${data.select} per page`
  };

</script>
<svelte:window bind:innerWidth />


<OneColumn white={false} type="scroll">
  <Table.Root class="font-mono">
    <!-- <Table.Caption>A list of your recent invoices.</Table.Caption> -->
    <Table.Header>
      <Table.Row>
        <Table.Head class="text-center hidden xs:table-cell">Edit</Table.Head>
        <Table.Head class="w-[100px]">Date</Table.Head>
        <Table.Head class="hidden xs:table-cell">Type</Table.Head>
        <Table.Head>Ident</Table.Head>
        <Table.Head class="text-center">From</Table.Head>
        <Table.Head class="text-center">To</Table.Head>
        <Table.Head class="text-center">Total</Table.Head>
        <Table.Head class="text-center hidden xs:table-cell">Night</Table.Head>
        <Table.Head class="text-center hidden xs:table-cell">Landings</Table.Head>
        <Table.Head class="text-left hidden xs:table-cell">Notes</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.legs as leg, i (i)}
        <Table.Row>
          <Table.Cell class="justify-center hidden xs:flex">
            <a href="/leg/{leg.id}">
              <Link class="h-4 w-4 text-muted-foreground" />
            </a>
          </Table.Cell>
          {#if leg.startTime_utc === null}
            <Table.Cell class="font-medium text-xs xs:text-sm">Unknown</Table.Cell>
          {:else}
            <Table.Cell class="font-medium text-xs xs:text-sm">{timeConverter(leg.startTime_utc, { dateOnly: true, shortYear: true })}</Table.Cell>
          {/if}
          <Table.Cell class="hidden xs:table-cell">{leg.aircraft.type.typeCode}</Table.Cell>
          <Table.Cell>{leg.aircraft.registration}</Table.Cell>
          <Table.Cell class="text-center">{leg.originAirportId}</Table.Cell>
          {#if leg.diversionAirportId === null}
            <Table.Cell class="text-center">{leg.destinationAirportId}</Table.Cell>
          {:else}
            <Table.Cell class="text-center">{leg.destinationAirportId}-{leg.diversionAirportId}</Table.Cell>
          {/if}
          <Table.Cell class="text-center">{leg.totalTime.toFixed(1)}</Table.Cell>
          <Table.Cell class="text-center hidden xs:table-cell">{leg.night.toFixed(1)}</Table.Cell>
          <Table.Cell class="text-center hidden xs:table-cell">
            {#if leg.dayLandings + leg.nightLandings > 0}
              {leg.dayLandings + leg.nightLandings}
            {/if}
          </Table.Cell>
          <Table.Cell class="text-left hidden xs:table-cell">{leg.notes}</Table.Cell>
        </Table.Row>
      {/each}
      <!-- {#each {length: data.PER_PAGE - data.legs.length} as _, i (i)}
        <Table.Row>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
        </Table.Row>
      {/each} -->
    </Table.Body>
    <Table.Header noBorder={true}>
      <Table.Row>
        <Table.Head class="hidden xs:table-cell"></Table.Head>
        <Table.Head></Table.Head>
        <Table.Head></Table.Head>
        <Table.Head></Table.Head>
        <Table.Head></Table.Head>
        <Table.Head class="hidden xs:table-cell"></Table.Head>
        <Table.Head class="text-center">{totals.total.toFixed(1)}</Table.Head>
        <Table.Head class="text-center hidden xs:table-cell">{totals.night.toFixed(1)}</Table.Head>
        <Table.Head class="hidden xs:table-cell"></Table.Head>
        <Table.Head class="hidden xs:table-cell"></Table.Head>
      </Table.Row>
    </Table.Header>
  </Table.Root>

  <div class="py-2 px-2 sticky bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 border-t border-gray-200 dark:border-zinc-800 backdrop-blur-sm flex flex-row justify-center items-center gap-2">
    <Pagination.Root count={data.count} {perPage} {siblingCount} let:pages let:currentPage bind:page onPageChange={onPageChange} class="">
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

    <div class="block md:absolute right-2">
      <Select.Root portal={null} selected={selected} onSelectedChange={onSelectedChange}>
        <Select.Trigger class="w-[150px]">
          <Select.Value placeholder="{data.select} per page" />
        </Select.Trigger>
        <Select.Content>
          <Select.Group >
            <Select.Label>Entries</Select.Label>
            {#each options as option}
              <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>
  </div>

</OneColumn>