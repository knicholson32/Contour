<script lang="ts">
  import TwoColumn from "$lib/components/scrollFrames/TwoColumn.svelte";
  import * as MenuForm from '$lib/components/menuForm';
  import Section from "$lib/components/Section.svelte";
  import MenuElement from "$lib/components/menuForm/MenuElement.svelte";
    import { Badge } from "lucide-svelte";
    import { page } from "$app/stores";

  const reportOptions = [
    { href: '/logbook/reports/8710', title: 'FAA 8710', subtitle: 'Guide for completing an FAA 8710', type: 'General'},
    { href: '/logbook/reports/experience', title: 'Experience', subtitle: 'Summary of your flight experience', type: 'General'},
    { href: '/logbook/reports/condensed', title: 'Condensed Logbook', subtitle: 'All entries, certificates and endorsements', type: 'General'},
    { href: '/logbook/reports/full', title: 'Full Logbook', subtitle: 'Logbook export / backup features', type: 'General'}
  ]

  let urlActiveParam: string;

</script>

<TwoColumn menu="scroll" form="scroll" resizable={false} bind:urlActiveParam minSizes={{menu: 205, form: 475 }} defaultRatio={0.01} backText="Back">

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink dark:divide-zinc-800" aria-label="Directory">
    <!-- <MenuForm.Title title="Report Options" /> -->
     <Section title="GENERAL" collapsable={false} hideTopBorder={true} class="" >
      {#each reportOptions.filter((o) => o.type === 'General') as m}
        <MenuElement href="{m.href}?{urlActiveParam}" selected={$page.url.pathname.startsWith(m.href)}>
          <div class="flex flex-col justify-start items-sstart">
            <div class="uppercase inline-flex items-center gap-1 font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">{m.title}</div>
            <div class="text-xxs text-gray-400">{m.subtitle}</div>
          </div>
        </MenuElement>
      {/each}
    </Section>
    
  </nav>
  <div slot="form" class="flex-shrink z-0">
    <slot/>
  </div>

</TwoColumn>