<script lang="ts">
  
  import 'leaflet/dist/leaflet.css';
  import * as helpers from './helpers';
  import { onMount } from 'svelte';
  import type * as Types from '@prisma/client';
  import { browser } from '$app/environment';
  import './helpers/leaflet.css';

  type T = Types.Prisma.LegGetPayload<{ include: { positions: true} }>;
  type D = Types.Prisma.DeadheadGetPayload<{ include: { originAirport: true, destinationAirport: true} }>;

  export let legs: T[];
  export let deadheads: D[];
  export let airports: Types.Airport[];

  let element: HTMLDivElement;

  let L: typeof import('leaflet');
  let map: L.Map;

  let posLayer: L.LayerGroup<any> | null = null;
  let deadLayer: L.LayerGroup<any> | null = null;
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


  const updateMapContents = (legs: T[], deadheads: D[], airports: Types.Airport[]) => {
    if (!mounted) return;

    if (posLayer !== null) map.removeLayer(posLayer);
    if (deadLayer !== null) map.removeLayer(deadLayer);
    if (markerLayer !== null) map.removeLayer(markerLayer);
    
    let bound: L.LatLngExpression[] = [];
    posLayer = L.layerGroup();
    for (const leg of legs) {
      const pos: L.LatLngExpression[] = [];;
      for (const p of leg.positions) {
        pos.push([ p.latitude, p.longitude ]);
        bound.push([ p.latitude, p.longitude ]);
      }
      posLayer.addLayer(L.polyline(pos, { color: '#E4E', opacity: 1 }));
    }
    posLayer.addTo(map);

    deadLayer = L.layerGroup();
    for (const dead of deadheads) {
      const pos: L.LatLngExpression[] = [];
      const origin: L.LatLngExpression = [ dead.originAirport.latitude, dead.originAirport.longitude ];
      const dest: L.LatLngExpression = [ dead.destinationAirport.latitude, dead.destinationAirport.longitude ];
      pos.push(origin);
      pos.push(dest);
      bound.push(origin);
      bound.push(dest);
      deadLayer.addLayer(L.polyline(pos, { color: '#060', opacity: 1 }));
    }
    deadLayer.addTo(map);

    markerLayer = L.layerGroup();
 		for(let i = 0; i < airports.length; i++) {
			markerLayer.addLayer(markerIcon(airports[i], i));
 		}
  	markerLayer.addTo(map);

    map.fitBounds(L.polyline(bound).getBounds(), { animate: false }).zoomOut(1, { animate: false });
    if (map.getZoom() > 13) map.setZoom(13);
  }

  $: updateMapContents(legs, deadheads, airports);

  onMount(async () => {
    // import * as L from 'leaflet';

    if (!browser) return;

    L = (await import('leaflet')).default
    mounted = true;



    const implementMap = (container: HTMLDivElement) => {
      if (container === null) return;

      map = helpers.createMap(L, container);

      updateMapContents(legs, deadheads, airports);

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
</style>
<div bind:this={element} style="height:400px;width:100%;position:relative;" {...$$restProps} />