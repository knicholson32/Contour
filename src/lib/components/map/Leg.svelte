<script lang="ts">
  
  import 'leaflet/dist/leaflet.css';
  import { onMount } from 'svelte';
  import type * as Types from '@prisma/client';
  import * as helpers from './helpers';
  import './helpers/leaflet.css';

  export let positions: Types.Position[];
  export let fixes: Types.Fix[];
  export let airports: Types.Airport[];

  let element: HTMLDivElement;

  
  let pos: L.LatLngExpression[] = [];
  let fix: L.LatLngExpression[] = [];

  let L: typeof import('leaflet');
  let map: L.Map;

  let fixLayer: L.Polyline<any, any> | null = null;
  let posLayer: L.Polyline<any, any> | null = null;
  let markerLayer: L.LayerGroup<any> | null = null;

  let mounted = false;

   function markerIcon(airport: Types.Airport, index: number) {
    let html = `
      <div class="absolute -translate-x-[25%] hover:opacity-10 transition-opacity rounded-full overflow-hidden inline-flex items-center justify-left">
        <div class="rounded-l-full bg-green-500 text-white font-medium inline-flex items-center justify-center pl-1 w-6 h-6">${index + 1}</div>
        <div class="text-white inline-flex items-center whitespace-nowrap white bg-gray-800 h-6 px-2">${airport.id}</div>
      </div>
    `;
    const icon = L.divIcon({
      html,
      className: 'relative'
    });
    return L.marker([airport.latitude, airport.longitude], { icon });
  }


  const updateMapContents = (positions: Types.Position[], fixes: Types.Fix[]) => {
    if (!mounted) return;

    if (fixLayer !== null) map.removeLayer(fixLayer);
    if (posLayer !== null) map.removeLayer(posLayer);
    if (markerLayer !== null) map.removeLayer(markerLayer);

    pos = [];
    fix = [];
    for (const p of positions) pos.push([ p.latitude, p.longitude ]);
    for (const f of fixes) {
      if (f.latitude === null || f.longitude === null) continue;
      fix.push([ f.latitude, f.longitude ]);
    }

    fixLayer = L.polyline(fix, { color: '#00F', opacity: 1, weight: 1 });
    fixLayer.addTo(map);

    posLayer = L.polyline(pos, { color: '#E4E', opacity: 1 });
    posLayer.addTo(map);

    markerLayer = L.layerGroup();
 		for(let i = 0; i < airports.length; i++) {
			markerLayer.addLayer(markerIcon(airports[i], i));
 		}
  	markerLayer.addTo(map);

    map.fitBounds(posLayer.getBounds(), { animate: false }).zoomOut(1, { animate: false });
  }

  $: updateMapContents(positions, fixes);

  onMount(async () => {
    // import * as L from 'leaflet';
    L = (await import('leaflet')).default
    mounted = true;


    const implementMap = (container: HTMLDivElement) => {
      map = helpers.createMap(L, container);

      updateMapContents(positions, fixes);

      return {
        destroy: () => {
          map.remove();
        },
      };
    }

    implementMap(element);
  });


  function resizeMap() {
	  if(map) { map.invalidateSize(); }
  }

</script>
<svelte:window on:resize={resizeMap} />

<style>
  .leaflet-container {
    background: #fff;
  }
  @media (prefers-color-scheme: dark) {
    .leaflet-container {
      background: #000;
    }
  }
</style>

<div bind:this={element} style="height:400px;width:100%" {...$$restProps} />