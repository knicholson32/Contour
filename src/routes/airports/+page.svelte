<script lang="ts">
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  import { VisSingleContainer, VisChordDiagram } from '@unovis/svelte'
  import { ChordLabelAlignment } from '@unovis/ts'

  interface Props {
    data: import('./$types').PageData;
  }

  let { data }: Props = $props();

  type NodeDatum = {
    id: string;
    country: string;
  }

  type LinkDatum = {
    source: NodeDatum;
    target: NodeDatum;
    value: number;
  }

  const nodes: NodeDatum[] = Array.from(data.names, (name, i) => ({ id: name, country: data.countries[i] }))
  let links: LinkDatum[] = data.values.flatMap((arr, i) => arr.map((value, j) => ({ source: nodes[i], target: nodes[j], value: value })))
  links = links.filter(l => l.value > 0);
  links = links.filter((l, i) => i < 309);
  links.forEach((l) => {
    if (l.value < 0.001) l.value = 0.001;
  })
  console.log(links)

  // const colorMap: Map<string, string> = data.countries.reduce((acc, curr) => {
  //   if (!acc.has(curr)) acc.set(curr, data.colors[acc.size])
  //   return acc
  // }, new Map<string, string>())

  const colorMap: { [key: string]: string } = {};
  let assignedColors = 0;
  for (const country of data.countries) {
    if (!colorMap[country]) {
      colorMap[country] = data.colors[assignedColors++];
    }
  }



  
 

  const graphData = { links: links, nodes: nodes };
  const linkColor = (l: LinkDatum) => colorMap[l.source.country]
  const nodeColor = (n: NodeDatum) => colorMap[n.country]
  const nodeLabel = (n: NodeDatum) => n.id
  const nodeLabelColor = (n: NodeDatum) => n.height && 'var(--vis-tooltip-text-color)'

</script>

<OneColumn>
  <div class="pt-4">
    <VisSingleContainer data={graphData} height={'750px'}>
      <VisChordDiagram
        {linkColor}
        {nodeColor}
        {nodeLabel}
        {nodeLabelColor}
        nodeLabelAlignment={ChordLabelAlignment.Perpendicular}
      />
    </VisSingleContainer>
  </div>
</OneColumn>