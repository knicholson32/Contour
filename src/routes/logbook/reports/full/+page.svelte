<script lang="ts">

  interface Props {
    data: import('./$types').PageData;
  }

  let { data }: Props = $props();

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


</script>

<!-- <div class="w-full grid grid-cols-[31] gap-2 bg-green-500/20">

  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>
  <div class="bg-red-500/20">test</div>

</div> -->

{JSON.stringify(data.signatureSectionColSpan)}

<div class="p-1 pb-6 print:p-1 w-full overflow-x-scroll touch-auto relative">
  <!-- Title Section -->
  <div class="grid gap-[1px] relative bg-zinc-300 border border-zinc-300" style="min-width: {data.numCols * data.COL_WIDTH_REM}rem; grid-template-columns: repeat({data.numCols},minmax(0,1fr))">

    <!-- Column Titles -->
    {#each data.dataDescriptor as descriptor}
      <div class="sticky top-0 bg-zinc-600 font-bold py-0.5 text-white text-xxs select-none content-end text-center uppercase flex items-center justify-center px-2" style="
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
          <div class="sticky top-0 bg-zinc-600 font-bold py-0.5 text-white text-xxs row-span-2 select-none content-end text-center uppercase flex items-center justify-center px-2" style="
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


    {#snippet Entry(d: {colSpan: number, text: string, hover?: string, link?: string, textLeft?: boolean}, bg=true, reverse=false)}
      <div class="text-xs {bg ? (reverse ? 'even:bg-zinc-100 bg-zinc-200' : 'bg-zinc-100 even:bg-zinc-200') : 'bg-zinc-100'} align-middle whitespace-nowrap overflow-x-scroll px-1 {d.textLeft !== true ? 'text-center' : ''}" style="grid-column: span {d.colSpan} / span {d.colSpan};"
        title="{d.hover ?? ''}"
      >
        {d.text}
      </div>
    {/snippet}

    {#each data.rows as row}
      {#each row as entry, i}
        {@render Entry(entry, (i > data.SIGNATURE_SECTION_COLS - 1))}
      {/each}
      <!-- If we have an odd number of columns, create an invisible div so the even: bg selector still works -->
      <!-- <div class="hidden"></div> -->
      {#if (data.signatureSectionColSpan.skipCols + data.signatureSectionColSpan.dataColSpans.length) % 2 === 1}
        <div class="hidden"></div>
      {/if}
    {/each}

    <!-- Border for bottom section -->
    <div class="h-[1px] bg-zinc-400" style="grid-column: span {data.numCols} / span {data.numCols};"></div>

    <div class="row-span-3 bg-zinc-100 text-xs flex flex-col items-center justify-center" style="grid-column: span {data.signatureSectionColSpan.heading} / span {data.signatureSectionColSpan.heading};">
      <div>I <span class="italic">({data.name})</span> certify that the entries in this log are true</div>
      <div class="w-3/4 border-b border-2 border-zinc-500 mt-8"></div>
      <div class="font-black text-xxs">Pilot Signature</div>
    </div>

    <!-- If we have an odd number of columns, create an invisible div so the even: bg selector still works -->
    {#if (data.signatureSectionColSpan.skipCols) % 2 === 1}
      <div class="hidden"></div>
    {/if}

    <div class="text-xxs text-right align-middle font-bold pr-1 bg-zinc-100" style="grid-column: span {data.signatureSectionColSpan.titles} / span {data.signatureSectionColSpan.titles};">Forwarded</div>
    {#each data.totalsRows[0] as entry}
      {@render Entry(entry, true, true)}
    {/each}
    {#if data.signatureSectionColSpan.dataColSpans.length % 2 === 1}
      <div class="hidden"></div>
    {/if}
    <div class="text-xxs text-right align-middle font-bold pr-1 bg-zinc-100" style="grid-column: span {data.signatureSectionColSpan.titles} / span {data.signatureSectionColSpan.titles};">This Page</div>
    {#each data.totalsRows[1] as entry}
      {@render Entry(entry)}
      {/each}
    {#if data.signatureSectionColSpan.dataColSpans.length % 2 === 1}
      <div class="hidden"></div>
    {/if}
    <div class="text-xxs text-right align-middle font-bold pr-1 bg-zinc-100" style="grid-column: span {data.signatureSectionColSpan.titles} / span {data.signatureSectionColSpan.titles};">Total</div>
    {#each data.totalsRows[2] as entry}
      {@render Entry(entry, true, true)}
      {/each}
    {#if data.signatureSectionColSpan.dataColSpans.length % 2 === 1}
      <div class="hidden"></div>
    {/if}
  </div>

</div>