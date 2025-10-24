<script lang="ts">
  import { goto } from "$app/navigation";
  import * as Pagination from "$lib/components/ui/pagination/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
  import type { Selected } from "bits-ui";
    import { ChevronLeft, ChevronRight } from "lucide-svelte";

    // import { Pagination } from '$lib/components/ui/pagination';


  interface Props {
    data: import('./$types').PageData;
  }

  let { data }: Props = $props();

  let selectString = $state(data.select.toFixed(0));

  const countCols = (descriptor: typeof data.dataDescriptor[0]): number => {
    // Check if there are any sub-columns
    if (descriptor.subCols === undefined) {
      // There are not. Only look at our col span settings here
      if (descriptor.colSpan === undefined) return data.DEFAULT_SPANS;
      else return descriptor.colSpan;
    } else {
      // There are. We need to sub the spans for each sub-column
      let span = 0;
      for (const sub of descriptor.subCols) {
        if (sub.colSpan === undefined) span += data.DEFAULT_SPANS
        else span += sub.colSpan;
      }
      return span;
    }
  }

  let page = $state(data.page + 1);

  const onPageChange = (page: number) => goto(`?page=${page}&select=${data.select}`);
  const onSelectedChange = (s: string | undefined) => {
    if (s === undefined) return;
    const val = parseInt(s);
    if (isNaN(val)) return;
    const currentStart = data.page * data.select;
    const newPage = Math.ceil(currentStart / val);
    console.log(newPage, val);
    goto(`?page=${newPage + 1}&select=${val}`);
  }

  const perPageOptions = [24, 48, 100, 200, 500];
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

<div class="px-0 ml-[0px] w-full touch-auto relative">
  <!-- Title Section -->
  <div class="grid gap-px bg-zinc-300 dark:bg-zinc-800 group test-group" style="min-width: {data.numCols * data.COL_WIDTH_REM}rem; grid-template-columns: repeat({data.numCols},minmax(0,1fr))">
    <div class="row-span-3 gap-px sticky top-0 grid grid-cols-subgrid bg-zinc-200 dark:bg-zinc-800 border-b -my-px border-zinc-300 dark:border-zinc-800" style="grid-column: span {data.numCols} / span {data.numCols}; -webkit-transform: translateZ(0);">
      <!-- Column Titles -->
      {#each data.dataDescriptor as descriptor}
        <div class="sticky top-0 bg-zinc-100 dark:bg-zinc-900 font-bold py-0.5  text-xxs select-none content-end text-center uppercase flex items-center justify-center px-2" style="
          grid-row: span {descriptor.subCols === undefined ? '3' : '1'} / span {descriptor.subCols === undefined ? '3' : '1'};
          grid-column: span {countCols(descriptor)} / span {countCols(descriptor)};
        ">
        {#if descriptor.rotate === true}
          <span class="-rotate-45">{descriptor.title}</span>
        {:else}
          {descriptor.title}
        {/if}
      </div>
      {/each}
      <!-- Column Sub Titles -->
      {#each data.dataDescriptor as descriptor}
        {#if descriptor.subCols !== undefined}
          {#each descriptor.subCols as d}
            <div class="sticky top-0 bg-zinc-100 dark:bg-zinc-900 font-bold py-0.5  text-xxs row-span-2 select-none content-end text-center uppercase flex items-center justify-center px-2" style="
              grid-column: span {(d.colSpan === undefined ? data.DEFAULT_SPANS : d.colSpan)} / span {(d.colSpan === undefined ? data.DEFAULT_SPANS : d.colSpan)};
            ">
            {#if d.rotate === true}
              <span class="-rotate-45">{d.title}</span>
            {:else}
              {d.title}
            {/if}
          </div>
          {/each}
        {/if}
      {/each}
    </div>


    {#snippet Entry(d: {colSpan: number, text: string, hover?: string, link?: string, textLeft?: boolean, strike?: string}, bg=true, reverse=false)}
      {#if d.link === undefined}
        <div class="text-xs {d.text === '' ? 'h-4' : ''} {bg ? (reverse ? 'even:bg-zinc-50 bg-zinc-100/80 dark:even:bg-zinc-950 dark:bg-zinc-950/85' : 'bg-zinc-50 even:bg-zinc-100/80 dark:bg-zinc-950 dark:even:bg-zinc-950/85') : 'bg-zinc-50 dark:bg-zinc-950'} align-middle whitespace-nowrap overflow-hidden text-ellipsis px-1 {d.textLeft !== true ? 'text-center' : ''} dark:group-hover/row:!bg-zinc-800 group-hover/row:!bg-zinc-200" style="grid-column: span {d.colSpan} / span {d.colSpan};" title="{d.hover ?? d.text}">
          {#if d.strike}
            <span class="line-through text-yellow-400 dark:text-yellow-600">{d.strike}</span>
          {:else}
            {d.text}
          {/if}
        </div>
      {:else}
        <a href="{d.link}" class="text-xs{d.text === '' ? 'h-4' : ''} {bg ? (reverse ? 'even:bg-zinc-50 bg-zinc-100/80 dark:even:bg-zinc-950 dark:bg-zinc-950/85' : 'bg-zinc-50 even:bg-zinc-100/80 dark:bg-zinc-950 dark:even:bg-zinc-950/85') : 'bg-zinc-50 dark:bg-zinc-950'} align-middle whitespace-nowrap overflow-hidden text-ellipsis px-1 {d.textLeft !== true ? 'text-center' : ''} group-hover/row:bg-zinc-200 dark:group-hover/row:bg-zinc-800 hover:underline decoration-sky-500 decoration-2" style="grid-column: span {d.colSpan} / span {d.colSpan};" title="{d.hover ?? d.text}">
          {d.text}
        </a>
      {/if}
    {/snippet}

    {#each data.rows as row}
      <div class="contents group/row">
        {#each row as entry, i}
          {@render Entry(entry, (i > data.SIGNATURE_SECTION_COLS - 1))}
        {/each}
        <!-- If we have an odd number of columns, create an invisible div so the even: bg selector still works -->
        {#if (data.signatureSectionColSpan.skipCols + data.signatureSectionColSpan.dataColSpans.length) % 2 === 1}
          <div class="hidden"></div>
        {/if}
      </div>
    {/each}

    {#if data.rows.length % 2 === 0}
      <div class="hidden"></div>
    {/if}

    <!-- Filler cells for the last page (where there may not be a full page of entries) -->
    {#each {length: data.select - data.rows.length} as _, i}
      {#each {length: data.SIGNATURE_SECTION_COLS + data.signatureSectionColSpan.dataColSpans.length} as _, i}
        {@render Entry({ text: '', colSpan: data.rawColSpans[i] }, (i > data.SIGNATURE_SECTION_COLS - 1))}
        <!-- <div class="text-xs h-4 {i > data.SIGNATURE_SECTION_COLS - 1 ? 'bg-zinc-100 even:bg-zinc-200' : 'bg-zinc-100'}" style="grid-column: span {data.rawColSpans[i]} / span {data.rawColSpans[i]};"></div> -->
      {/each}  
      <!-- If we have an odd number of columns, create an invisible div so the even: bg selector still works -->
      {#if (data.signatureSectionColSpan.skipCols + data.signatureSectionColSpan.dataColSpans.length) % 2 === 1}
        <div class="hidden"></div>
      {/if}
    {/each}



    <div class="row-span-3 gap-px sticky bottom-16 grid grid-cols-subgrid bg-zinc-300 dark:bg-zinc-700" style="grid-column: span {data.numCols} / span {data.numCols}; -webkit-transform: translateZ(0);">
      <div class="hidden"></div>
      <!-- Border for bottom section -->
      <div class="h-px bg-zinc-400 dark:bg-zinc-600" style="grid-column: span {data.numCols} / span {data.numCols};"></div>

      <div class="row-span-3 bg-zinc-100 dark:bg-zinc-900 text-xs flex flex-col items-center justify-between py-1" style="grid-column: span {data.signatureSectionColSpan.heading} / span {data.signatureSectionColSpan.heading};">
        <div>I <span class="italic">({data.name})</span> certify that the entries in this log are true</div>
        <div class="w-3/4 border-b border-2 border-zinc-500"></div>
        <!-- <div class="font-black text-xxs">Pilot Signature</div> -->
      </div>

      <!-- If we have an odd number of columns, create an invisible div so the even: bg selector still works -->
      {#if (data.signatureSectionColSpan.skipCols) % 2 === 0}
        <div class="hidden"></div>
      {/if}

      <div class="text-xxs text-right align-middle font-bold pr-1 bg-zinc-100 dark:bg-zinc-900" style="grid-column: span {data.signatureSectionColSpan.titles} / span {data.signatureSectionColSpan.titles};">Forwarded</div>
      {#each data.totalsRows[0] as entry}
        {@render Entry(entry, true, true)}
      {/each}
      {#if data.signatureSectionColSpan.dataColSpans.length % 2 === 1}
        <div class="hidden"></div>
      {/if}
      <div class="text-xxs text-right align-middle font-bold pr-1 bg-zinc-100 dark:bg-zinc-900" style="grid-column: span {data.signatureSectionColSpan.titles} / span {data.signatureSectionColSpan.titles};">This Page</div>
      {#each data.totalsRows[1] as entry}
        {@render Entry(entry)}
        {/each}
      {#if data.signatureSectionColSpan.dataColSpans.length % 2 === 1}
        <div class="hidden"></div>
      {/if}
      <div class="text-xxs text-right align-middle font-bold pr-1 bg-zinc-100 dark:bg-zinc-900" style="grid-column: span {data.signatureSectionColSpan.titles} / span {data.signatureSectionColSpan.titles};">Total</div>
      {#each data.totalsRows[2] as entry}
        {@render Entry(entry, true, true)}
        {/each}
      {#if data.signatureSectionColSpan.dataColSpans.length % 2 === 1}
        <div class="hidden"></div>
      {/if}
    </div>
  </div>

</div>

<!-- Make space for the pagination bar -->
<div class="pb-[calc(4rem-1px)]"></div>

<div class="bg-zinc-100 dark:bg-zinc-900 z-0 absolute bottom-0 left-0 md:left-[206px] right-0 md:pb-2 h-[calc(env(safe-area-inset-bottom)_+_1rem)]"></div>
<div class="bg-zinc-100 dark:bg-zinc-900 absolute bottom-[env(safe-area-inset-bottom)] left-0 md:left-[206px] right-0 px-2 md:pb-2 h-16 border-t flex flex-row items-center justify-center">

  <Pagination.Root count={data.totalEntries} perPage={data.select} bind:page onPageChange={onPageChange} >
    {#snippet children({ pages, currentPage })}
      <Pagination.Content>
      <Pagination.Item>
        <Pagination.PrevButton>
          <ChevronLeft class="size-4" />
	        <span class="hidden xl:block">Previous</span>
        </Pagination.PrevButton>
      </Pagination.Item>
      {#each pages as page (page.key)}
        {#if page.type === "ellipsis"}
        <Pagination.Item>
          <Pagination.Ellipsis />
        </Pagination.Item>
        {:else}
        <Pagination.Item>
          <Pagination.Link {page} isActive={currentPage === page.value}>
          {page.value}
          </Pagination.Link>
        </Pagination.Item>
        {/if}
      {/each}
      <Pagination.Item>
        <Pagination.NextButton>
	        <span class="hidden xl:block">Next</span>
          <ChevronRight class="size-4" />
        </Pagination.NextButton>
      </Pagination.Item>
      </Pagination.Content>
    {/snippet}
  </Pagination.Root>


  <div class="hidden sm:block lg:absolute right-2 h-fit">
    <Select.Root type="single" bind:value={selectString} onValueChange={onSelectedChange}>
      <Select.Trigger class="w-[110px] text-xs">
        {data.select} / page
      </Select.Trigger>
      <Select.Content>
        {#each options as option}
          <Select.Item value={option.value.toFixed(0)} label={option.label}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

</div>