<script lang="ts">
  
  import { mount, onMount, type Snippet } from 'svelte';
	import { getContext } from 'svelte';
  import { browser } from '$app/environment';
  import { AmbientLight, LightingEffect, type _GlobeView, type _GlobeViewport, type Deck, type Layer, type MapView } from 'deck.gl';
  import type { Prisma } from "@prisma/client";
  import '@deck.gl/widgets/stylesheet.css';
  import { MapWidgetsRootState } from './widgets/widget.svelte';
  import { MapComponentRootState } from './component.svelte';
  import type { Padding } from './types';
  import { useGlobeGlobal } from './components/states';

  
  
  let element: HTMLDivElement | null = null;
  let mapWidgets: HTMLDivElement | null = $state(null);
  let opacity = $state(0);
  let useTransition = $state(true);

  const globalSettings = getContext<{ "general.prefers_globe": boolean } | undefined>('settings')
  const startAirport = getContext< Prisma.AirportGetPayload<{}> | null>('startAirport');

  if ($useGlobeGlobal === null) {
    $useGlobeGlobal = globalSettings?.['general.prefers_globe'] ?? true;
  }

  let {
    startCenteredOn,
    padding = 150,
    offset = [0, 0],
    corePadding = { left: 0, right: 0, top: 0, bottom: 0 },
    globe = $useGlobeGlobal,
    customControlPositioning = $bindable('bottom-4 left-4'),
    children,
  }: {
    startCenteredOn?: [number, number],
    padding?: number | Required<Padding>,
    offset?: [number, number],
    corePadding?: Required<Padding>,
    globe?: boolean,
    customControlPositioning?: string
    children?: Snippet
  } = $props();

  const mapRootState = MapWidgetsRootState.create({});
  const mapComponentState = MapComponentRootState.create({ startAirport, padding, offset });
  $effect(() => mapComponentState.updateOffset(offset));
  $effect(() => mapComponentState.updatePadding(padding));

  let useGlobe = $state(globe);
  let usingDarkMode = $state(false);
  let mounted = false;


  let Core: typeof import('@deck.gl/core');
  let GeoLayers: typeof import('@deck.gl/geo-layers');
  let Layers: typeof import('@deck.gl/layers');
  let Extensions: typeof import('@deck.gl/extensions');
  let Widgets: typeof import('@deck.gl/widgets');

  let deckInstance: Deck<MapView> | Deck<_GlobeView>;

  let layers: (Layer | Layer[] | null)[] = [];

  const initializeMap = () => {
    const devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    const tileSet = usingDarkMode
      ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}@2x.png?api_key=ad49e48b-b4ff-4da3-a7d4-2dc77d16ae77'
      : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png';


    const tiles = new GeoLayers.TileLayer({
      // data: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      data: tileSet,
      maxRequests: 20,
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      zoomOffset: devicePixelRatio === 1 ? -1 : 0,

      renderSubLayers: props => {
        const {
          bbox: {west, south, east, north}
        } = props.tile;

        return new Layers.BitmapLayer(props, {
          data: undefined,
          image: props.data,
          _imageCoordinateSystem: Core.COORDINATE_SYSTEM.CARTESIAN,
          bounds: [west, south, east, north]
        });
      }
    });

    const start = mapComponentState.getStartView();

    deckInstance = new Core.Deck({
      // parameters: {
      //   cullMode: 'back'
      // },
      views: useGlobe ? new Core._GlobeView({ resolution: 1, padding: corePadding }) : new Core.MapView({ repeat: true }),
      // parent: element,
      canvas: 'deck-canvas',
      initialViewState: {
        longitude: startCenteredOn === undefined || startCenteredOn.length !== 2 ? (start === undefined ? 0 : start.longitude) : startCenteredOn[1],
        latitude: startCenteredOn === undefined || startCenteredOn.length !== 2 ? (start === undefined ? 0 : start.latitude) : startCenteredOn[0],
        zoom: start === undefined ? 3 : start.zoom,
        minZoom: 1,
        maxZoom: 14,
      },
      pickingRadius: 4,
      controller: { inertia: false },
      // controller: { keyboard: false, inertia: true },
      // getTooltip: ({tile}: TileLayerPickingInfo) => tile && `x:${tile.index.x}, y:${tile.index.y}, z:${tile.index.z}`,
      layers: [tiles, ...layers],
      onDragStart: () => {
        mapWidgets?.classList.add('dragging');
        mapRootState.dragStart();
      },
      onDragEnd: () => {
        mapWidgets?.classList.remove('dragging');
        mapRootState.dragEnd();
      },
      // getTooltip,
      // onViewStateChange: ({ viewState, interactionState, oldViewState }) => {
      //   return viewState;
      // },
      onLoad: () => {
        // If the legs are fetched from a URL, fetch them after everything else
        // if (typeof legs === 'string') renderLegs();
        setTimeout(() => opacity = 100, 1);
      },
      effects: [new LightingEffect({ l1: new AmbientLight({ color: [255, 255, 255], intensity: usingDarkMode ? 2 : 4 }) })]
    });

    mapRootState.updateDeckInstance(deckInstance, usingDarkMode);
    mapComponentState.updateDeckInstance(deckInstance, usingDarkMode);

  }




  const mountAsync = async () => {
    const mm = window.matchMedia('(prefers-color-scheme: dark)');
    usingDarkMode = mm.matches;
    mm.onchange = () => {
      const previousMode = usingDarkMode;
      usingDarkMode = mm.matches;
      if (usingDarkMode !== previousMode) {
        useTransition = false;
        opacity = 0;
        useGlobe = globe;
        setTimeout(async () => {
          try {
            deckInstance.finalize();
            deckInstance.setProps({ canvas: undefined });
          } catch (e) {

          }
          useTransition = true;
          initializeMap();
        }, 100);
      }
    }
    
    
    Core = (await import('@deck.gl/core'));
    GeoLayers = (await import('@deck.gl/geo-layers'));
    Layers = (await import('@deck.gl/layers'));
    Extensions = (await import('@deck.gl/extensions'));
    Widgets = (await import('@deck.gl/widgets'));
    
    mounted = true;

    if (element !== null) mapComponentState.setWidthHeight({ width: element.clientWidth, height: element.clientHeight });


    // await initializeLayers();
    initializeMap();
  }


  onMount(() => {

    if(!browser) return;

    mountAsync();

    return () => {
      deckInstance.finalize();
      deckInstance.setProps({ canvas: undefined });
    }
  });



  const changeVariant = async (globe?: boolean) => {
    if (globe === undefined) globe = !useGlobe;
    if (globe === useGlobe || deckInstance === undefined) return;
    useTransition = false;
    opacity = 0;
    useGlobe = globe;
    setTimeout(async () => {
      try {
        deckInstance.finalize();
        deckInstance.setProps({ canvas: undefined });
      } catch (e) {

      }
      useTransition = true;
      initializeMap();
    }, 100);
    console.log(await fetch(`/api/settings/map/prefers-globe/set?value=${useGlobe}`));
    $useGlobeGlobal = useGlobe;
  }
  




</script>

<div class="{useGlobe ? 'dark:bg-black bg-zinc-950' : 'dark:bg-[#222222] bg-[#D9E8EB]'} flex-grow flex">
  <div bind:this={element} id="deck" class="flex-grow {useTransition ? 'transition-opacity duration-500' : ''} " style="opacity: {opacity}%;">
    <canvas id="deck-canvas"></canvas>
  </div>
</div>


<div class="absolute z-10 inline-flex gap-2 items-center justify-center border border-zinc-300 dark:border-zinc-950/50 bg-zinc-100/70 dark:bg-zinc-900/50 backdrop-blur-lg px-3 py-2 rounded-lg group {customControlPositioning}">
  <button type="button" onclick={() => changeVariant(false)} class="{!useGlobe ? 'opacity-100' : 'opacity-50'} cursor-pointer text-xxs uppercase">Map</button>
  <button type="button" onclick={() => changeVariant(true)} class="{useGlobe ? 'opacity-100' : 'opacity-50'} cursor-pointer text-xxs uppercase">Globe</button>
</div>

<div bind:this={mapWidgets} id="map-widgets" class="{useTransition ? 'transition-opacity duration-700' : ''}" style="opacity: {opacity}%;">
  {@render children?.()}
</div>