<script lang="ts">
  
  import 'leaflet/dist/leaflet.css';
  import * as helpers from './helpers';
  import { onMount } from 'svelte';
  import type * as Types from '@prisma/client';
  import { browser } from '$app/environment';
  import './helpers/leaflet.css';
    import { goto } from '$app/navigation';

  type T = [number, number][];
  type A = Types.Prisma.AirportGetPayload<{ select: { id: true, latitude: true, longitude: true }}>;
  // type D = Types.Prisma.DeadheadGetPayload<{ include: { originAirport: true, destinationAirport: true} }>;

  export let pos: T[];
  export let legIDs: string[];
  export let airports: A[];

  let element: HTMLDivElement;

  let L: typeof import('leaflet');
  let map: L.Map;

  let posLayer: L.LayerGroup<any> | null = null;
  // let deadLayer: L.LayerGroup<any> | null = null;
  let markerLayer: L.LayerGroup<any> | null = null;

  let mounted = false;

  function markerIcon(airport: A, index: number) {
    // <a href="/airports/${airport.id}">
    let html = `
        <div class="group w-4 h-4 relative p-1">
          <div class="w-2 h-2 relative rounded-full bg-slate-500 dark:bg-zinc-200 absolute"></div>
          <div class="hidden absolute font-medium group-hover:block px-2 py-1 bg-slate-500 dark:bg-zinc-200 text-white dark:text-zinc-900 bottom-3 left-3 rounded-md">
            ${airport.id}
          </div>
        </div>
    `;
    const icon = L.divIcon({
      html,
      className: 'relative'
    });
    return L.marker([airport.latitude, airport.longitude], { icon });
  }


  const updateMapContents = (legs: T[]) => {
    if (!mounted) return;

    if (posLayer !== null) map.removeLayer(posLayer);
    // if (deadLayer !== null) map.removeLayer(deadLayer);
    if (markerLayer !== null) map.removeLayer(markerLayer);
    
    let bound: L.LatLngExpression[] = [];
    posLayer = L.layerGroup();
    let index = 0;
    for (const pGroup of pos) {
      const pos: L.LatLngExpression[] = [];;
      for (const p of pGroup) {
        pos.push([ p[0], p[1] ]);
        bound.push([ p[0], p[1] ]);
      }
      const pl = L.polyline(pos, { color: '#E4E', opacity: 1 });
      const i = index;
      pl.on('click', () => goto(`/entry/leg/${legIDs[i]}?resolve=true`));
      posLayer.addLayer(pl);
      index++;
    }
    posLayer.addTo(map);

    // deadLayer = L.layerGroup();
    // for (const dead of deadheads) {
    //   const pos: L.LatLngExpression[] = [];
    //   const origin: L.LatLngExpression = [ dead.originAirport.latitude, dead.originAirport.longitude ];
    //   const dest: L.LatLngExpression = [ dead.destinationAirport.latitude, dead.destinationAirport.longitude ];
    //   pos.push(origin);
    //   pos.push(dest);
    //   bound.push(origin);
    //   bound.push(dest);
    //   deadLayer.addLayer(L.polyline(pos, { color: '#060', opacity: 1 }));
    // }
    // deadLayer.addTo(map);

    markerLayer = L.layerGroup();
 		for(let i = 0; i < airports.length; i++) {
			markerLayer.addLayer(markerIcon(airports[i], i));
 		}
  	markerLayer.addTo(map);

    if (bound.length > 0) map.fitBounds(L.polyline(bound).getBounds(), { animate: false }).zoomOut(1, { animate: false });
    else map.fitBounds([[20, -95], [60, -95]], {animate: false });
  }

  $: updateMapContents(pos);

  onMount(async () => {
    // import * as L from 'leaflet';

    if (!browser) return;

    L = (await import('leaflet')).default
    mounted = true;



    const implementMap = (container: HTMLDivElement) => {
      if (container === null) return;

      map = helpers.createMap(L, container);

      updateMapContents(pos);

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
<div bind:this={element} style="height:400px; width:100%; position:relative;" {...$$restProps} />