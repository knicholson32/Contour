<script lang="ts">
  
  import 'leaflet/dist/leaflet.css';
  import { onMount } from 'svelte';
  import type * as Types from '@prisma/client';
  import * as helpers from './helpers';
  import './helpers/leaflet.css';
  import { browser } from '$app/environment';
  import { LegData } from './helpers/LegData';
  import chroma from "chroma-js";

  import { type Overview } from './types';


  let {
    visitedAirports,
    legs,
    largestSegment,
    paddingTopLeft = [40, 40],
    paddingBottomRight = [40, 40]
  }: {
    visitedAirports: Overview.VisitedAirport[],
    legs: Overview.Leg[],
    largestSegment: number,
    paddingTopLeft?: [number, number]
    paddingBottomRight?: [number, number]
  } = $props();


  let element: HTMLDivElement;


  function markerIcon(airport: Overview.VisitedAirport) {
    let html = `
      <div class="relative left-1/2 -translate-x-[50%] top-1/2 -translate-y-[50%] w-2.5 h-2.5 rounded-full bg-sky-300 border-2 border-sky-900">
        <div class="absolute left-3 top-1/2 -translate-y-[50%] font-bold text-white bg-zinc-900 px-1 rounded-full text-xxs hover:text-lg hover:px-2">${airport.id}</div>
      </div>
    `;
    // <div class="absolute -translate-x-[25%] -translate-y-[25%] text-zinc-100 bg-zinc-900 inline-flex items-center whitespace-nowrap white rounded-lg px-1 opacity-90 text-xxs hover:text-lg">${airport.id}</div>
    // <div class="absolute -translate-x-[25%] hover:opacity-10 transition-opacity rounded-full overflow-hidden inline-flex items-center justify-left">
    // </div>
    const icon = L.divIcon({
      html,
      className: 'relative'
    });
    return L.marker([airport.latitude, airport.longitude], { icon });
  }
  

  let L: typeof import('leaflet');
  let map: L.Map;

  let posLayer: L.LayerGroup | null = null;
  let markerLayer: L.LayerGroup<any> | null = null;

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
      let smallestLat = visitedAirports[0].latitude;
      let largestLat = visitedAirports[0].latitude;
      let smallestLon = visitedAirports[0].longitude;
      let largestLon = visitedAirports[0].longitude;
      for (const a of visitedAirports) {
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

  const color1 = '#7dd3fc'; // Sky 300
  const color2 = '#34d399'; // Emerald 400
  const color3 = '#a855f7'; // Purple 500
  const color4 = '#ec4899'; // Pink 500

  console.log(largestSegment);
  largestSegment = 5;

  const colorScale = chroma.scale([color1, color2, color3, color4]);

  
  const updateMapContents = (legs: Overview.Leg[], airports: Overview.VisitedAirport[]) => {
    if (!mounted) return;

    if (posLayer !== null) map.removeLayer(posLayer);



    posLayer = L.layerGroup();
    // const points: helpers.Point[] = [];
    for (const l of legs) {
      const pos: L.LatLngExpression[] = [];
      pos.push(l.start);
      pos.push(l.end);
      const s = l.segments;
      // console.log(s / largestSegment)
      const color = colorScale((s - 1) / (largestSegment - 1)).hex();
      (L.polyline(pos, { color: 'var(--color-sky-900)', opacity: 0.8, weight: 5 })).addTo(posLayer);
      (L.polyline(pos, { color: color, opacity: 0.8, weight: 3 })).addTo(posLayer);
    }

    
    posLayer.addTo(map);

    markerLayer = L.layerGroup();
 		for(let i = 0; i < airports.length; i++) markerLayer.addLayer(markerIcon(airports[i]));
  	markerLayer.addTo(map);

    center();
  }


  onMount(async () => {
    // import * as L from 'leaflet';
    L = (await import('leaflet')).default
    await import('@elfalem/leaflet-curve');
    LegData.initialize();
    mounted = true;


    const implementMap = (container: HTMLDivElement) => {
      map = helpers.createMap(L, container, { noLegal: true, noMapControls: true });

      updateMapContents(legs, visitedAirports);

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

<div class="flex-grow bg-[#FBF8F4] dark:bg-zinc-950">
  <div bind:this={element} style="height:100%;width:100%;position:relative;"></div>
</div>