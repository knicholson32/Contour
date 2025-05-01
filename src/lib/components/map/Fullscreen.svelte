<script lang="ts">
  
  import 'leaflet/dist/leaflet.css';
  import { onMount } from 'svelte';
  import type * as Types from '@prisma/client';
  import * as helpers from './helpers';
  import './helpers/leaflet.css';
    import { browser } from '$app/environment';

  export let positions: Types.Position[];
  export let fixes: Types.Fix[];
  export let airports: Types.Airport[];
  export let target: [number, number] | null = null;

  
  export let paddingTopLeft: [number, number] = [40, 40];
  export let paddingBottomRight: [number, number] = [40, 40];

  let element: HTMLDivElement;

  
  let pos: L.LatLngExpression[] = [];
  let fix: L.LatLngExpression[] = [];

  let L: typeof import('leaflet');
  let map: L.Map;

  let fixLayer: L.Polyline<any, any> | null = null;
  let posLayer: L.LayerGroup | null = null;
  let markerLayer: L.LayerGroup<any> | null = null;
  let targetLayer: L.LayerGroup<any> | null = null;

  export const center: (animate?: boolean) => void = (animate = false) => {
    if (map === undefined) return;
    try {
      if (posLayer === null) throw new Error();
      throw new Error();
      // .zoomOut(1, { animate: false });
      // const bounds = posLayer.getBounds();
      // if (fixLayer !== null) bounds.extend(fixLayer.getBounds());
      // for(const airport of airports) bounds.extend([airport.latitude, airport.longitude]);
      // map.fitBounds(bounds, { animate, paddingTopLeft, paddingBottomRight });

    } catch (e) {
      let smallestLat = airports[0].latitude;
      let largestLat = airports[0].latitude;
      let smallestLon = airports[0].longitude;
      let largestLon = airports[0].longitude;
      for (const a of airports) {
        if (a.latitude < smallestLat) smallestLat = a.latitude;
        if (a.latitude > largestLat) largestLat = a.latitude;
        if (a.longitude < smallestLon) smallestLon = a.longitude;
        if (a.longitude > largestLon) largestLon = a.longitude;
      }
      // .zoomOut(1, { animate: false });
      map.fitBounds([[smallestLat, smallestLon], [largestLat, largestLon]], {animate, paddingTopLeft, paddingBottomRight })
    }
  }

  let targetMarker: L.Marker | null = null;

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

  $: updateTargetMarker(target);

  const updateTargetMarker = (t: [number, number] | null) => {
    if (!mounted || targetMarker === null) return;
    if (t === null) {
      targetMarker.setOpacity(0);
    } else {
      targetMarker.setLatLng(t);
      targetMarker.setOpacity(1);
    }
  }


  const updateMapContents = (positions: Types.Position[], fixes: Types.Fix[]) => {
    if (!mounted) return;

    if (fixLayer !== null) map.removeLayer(fixLayer);
    if (posLayer !== null) map.removeLayer(posLayer);
    if (markerLayer !== null) map.removeLayer(markerLayer);
    if (targetLayer !== null) map.removeLayer(targetLayer);

    pos = [];
    fix = [];
    const points: helpers.Point[] = [];
    for (const p of positions) {
      pos.push([ p.latitude, p.longitude ]);
      points.push([ p.latitude, p.longitude ]);
    }
    for (const f of fixes) {
      if (f.latitude === null || f.longitude === null) continue;
      fix.push([ f.latitude, f.longitude ]);
    }

    if (browser && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) fixLayer = L.polyline(fix, { color: '#28F', opacity: 0.25, weight: 1 });
    else fixLayer = L.polyline(fix, { color: '#15F', opacity: 0.25, weight: 1 });
    
    fixLayer.addTo(map);
    posLayer = L.layerGroup();
    helpers.drawLegData(L, posLayer, points, airports);
    posLayer.addTo(map);

    markerLayer = L.layerGroup();
 		for(let i = 0; i < airports.length; i++) markerLayer.addLayer(markerIcon(airports[i], i));
  	markerLayer.addTo(map);

    targetLayer = L.layerGroup();
    const defPos = target ?? [0, 0];
    targetMarker = L.marker(defPos, { icon: L.divIcon({ html: '<div class="w-2 h-2 rounded-full bg-slate-500 dark:bg-zinc-200 absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>', className: 'relative' })});
    if (defPos[0] === 0 && defPos[1] === 0) targetMarker.setOpacity(0);
    
    targetLayer.addLayer(targetMarker);
    targetLayer.addTo(map);

    center();
  }

  $: updateMapContents(positions, fixes);

  onMount(async () => {
    // import * as L from 'leaflet';
    L = (await import('leaflet')).default
    await import('@elfalem/leaflet-curve');
    mounted = true;


    const implementMap = (container: HTMLDivElement) => {
      map = helpers.createMap(L, container, { noLegal: true, noMapControls: true });

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

<div class="absolute top-0 bottom-0 right-0 left-0 bg-[#FBF8F4] dark:bg-zinc-950">
  <div bind:this={element} style="height:100%;width:100%;position:relative;" {...$$restProps}></div>
  <slot />
</div>