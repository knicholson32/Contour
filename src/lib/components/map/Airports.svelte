<script lang="ts">
  
  import 'leaflet/dist/leaflet.css';
  import { onMount } from 'svelte';
  import type * as Types from '@prisma/client';

  export let airports: Types.Airport[];

  let element: HTMLDivElement;

  
  let apt: L.LatLngExpression[] = [];

  let L: typeof import('leaflet');
  let map: L.Map;

  let aptLayer: L.Polyline<any, any> | null = null;
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

  const updateMapContents = (airports: Types.Airport[]) => {
    if (!mounted) return;

    if (aptLayer !== null) map.removeLayer(aptLayer);
    if (markerLayer !== null) map.removeLayer(markerLayer);

    apt = [];
    for (const p of airports) apt.push([ p.latitude, p.longitude ]);

    aptLayer = L.polyline(apt, { color: '#E4E', opacity: 1, dashArray: [10, 15] });
    aptLayer.addTo(map);

    markerLayer = L.layerGroup();
 		for(let i = 0; i < airports.length; i++) {
			markerLayer.addLayer(markerIcon(airports[i], i));
 		}
  	markerLayer.addTo(map);

    map.fitBounds(aptLayer.getBounds()).zoomOut(1, { animate: false });
  }

  $: updateMapContents(airports);

  onMount(async () => {
    // import * as L from 'leaflet';
    L = (await import('leaflet')).default
    mounted = true;

    const createMap = (container: HTMLDivElement): L.Map => {
      let m = L.map(container, { dragging: !L.Browser.mobile });
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,
            &copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`,
          subdomains: 'abcd',
          maxZoom: 14,
        }
      ).addTo(m);

      return m;
    }

    const implementMap = (container: HTMLDivElement) => {
      map = createMap(container);

      updateMapContents(airports);

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

<div bind:this={element} style="height:400px;width:100%" {...$$restProps} />