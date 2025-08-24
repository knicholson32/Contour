import { Context } from "runed";

import { type _GlobeView, _GlobeViewport, type Deck, FlyToInterpolator, type Layer, LinearInterpolator, type MapView, type Position, SolidPolygonLayer, WebMercatorViewport } from "deck.gl";
import { v4 as uuidv4 } from 'uuid';
import { easeInOutCubic, easeInOutQuad, easeInOutSine, easeOutCubic, getDistanceFromLatLonInKm } from "$lib/helpers";
import type { Padding } from "./types";
import type { Prisma } from "@prisma/client";

const MAX_ZOOM_BOUNDS = 12;
const ZOOM_WHEN_SINGLE_POINT = 12;
const HOME_AIRPORT_ZOOM = 3;

export const MapComponentContext = new Context<MapComponentRootState>("Map.Components");

type LayerInstance = {
  module: LayerModule,
  zOrder: number,
  layerList: Layer[]
}

export interface LayerModule {
  render: (updateID?: boolean) => void,
}

// TODO: Transform the Airport and Leg layer generation into composite layers
// @see https://deck.gl/docs/developer-guide/custom-layers/composite-layers

// TODO: Incremental loading could be used to increase performance as data is
// streamed to the front end.
// @see https://deck.gl/docs/developer-guide/performance#handle-incremental-data-loading

export class MapComponentRootState {
  // Create a new map widget and assign context
  static create(opts: ConstructorParameters<typeof MapComponentRootState>[0]) {
    return MapComponentContext.set(new MapComponentRootState(opts));
  }

  // widgets: Widget[] = [];
  deckInstance: Deck<MapView> | Deck<_GlobeView> | null = null;

  layerCount = 0;
  layers: {[key: string]: LayerInstance} = {};
  deferUpdate = false;
  padding: number | Required<Padding>;
  startAirport: Prisma.AirportGetPayload<{}> | null;
  
  start?: {
    latitude: number,
    longitude: number,
    zoom: number
  }

  offset: [number, number];

  bounds: [[number, number], [number, number]] | null = null;

  size?: {
    width: number,
    height: number
  }

  polyID: string;

  usingDarkMode = false;

  constructor (options: { startAirport?: Prisma.AirportGetPayload<{}> | null, padding?: number | Required<Padding>, offset?: [number, number] }) {


    this.padding = options.padding === undefined ? 150 : options.padding;
    this.offset = options.offset === undefined ? [0, 0] : options.offset;
    this.startAirport = options.startAirport ?? null

    // Bind register to this so 'this' works correctly in the function later
    this.register = this.register.bind(this);
    this.deregister = this.deregister.bind(this);
    this.updateLayer = this.updateLayer.bind(this);

    this.polyID = uuidv4();
  }

  register(module: LayerModule, name: string, zOrder: number) {
    // Add the empty layer for this new layer
    const newID = name + '-' + uuidv4();
    this.layers[newID] = {
      module: module,
      zOrder: zOrder,
      layerList: []
    };
    return newID;
  }

  deregister(id: string) {
    delete this.layers[id];
    this.#pushLayerUpdate();
  }

  setWidthHeight(data: { width: number, height: number }) {
    this.size = data;
    if (this.bounds !== null) {
      const viewport = new WebMercatorViewport({
        width: this.size.width,
        height: this.size.height,
        longitude: 0,
        latitude: 0,
        zoom: 12,
        pitch: 0,
        bearing: 0
      });
      try {
        let {longitude, latitude, zoom} = viewport.fitBounds(this.bounds, { maxZoom: MAX_ZOOM_BOUNDS, offset: this.offset, padding: this.padding });
        // Check if we are zooming to one point. Don't zoom in all the way
        if (this.bounds[0][0] === this.bounds[1][0] && this.bounds[0][1] === this.bounds[1][1]) zoom = ZOOM_WHEN_SINGLE_POINT;
        this.start = {
          latitude,
          longitude,
          zoom
        }
        
      } catch (e) {
        try {
          // TODO: Maybe remove this offset to hopefully yield a better solve if we have to retry?
          let {longitude, latitude, zoom} = viewport.fitBounds(this.bounds, { maxZoom: MAX_ZOOM_BOUNDS, offset: this.offset, padding: 5 });
          // Check if we are zooming to one point. Don't zoom in all the way
          if (this.bounds[0][0] === this.bounds[1][0] && this.bounds[0][1] === this.bounds[1][1]) zoom = ZOOM_WHEN_SINGLE_POINT;
          this.start = {
            latitude,
            longitude,
            zoom
          }
        } catch (e) {
          this.start = {
            latitude: 0,
            longitude: 0,
            zoom: 3
          }
        }
      } finally {
        this.bounds = null;
      }
    }
    
  }

  translateHome() {
    if (this.startAirport === null) return;
    if (this.deckInstance === null) {
      this.start = {
        latitude: this.startAirport.latitude,
        longitude: this.startAirport.longitude,
        zoom: HOME_AIRPORT_ZOOM
      }
    } else {
      try {
        const viewports = this.deckInstance.getViewports();
        if (viewports.length === 0) return;
        const viewport = viewports[0] as _GlobeViewport;
        this.deckInstance.setProps({ initialViewState: {
          latitude: this.startAirport.latitude,
          longitude: this.startAirport.longitude,
          zoom: HOME_AIRPORT_ZOOM,
          transitionInterpolator: new FlyToInterpolator({ speed: 2 }),
          transitionDuration: Math.log2(getDistanceFromLatLonInKm(viewport.latitude, viewport.longitude, this.startAirport.latitude, this.startAirport.longitude)) * 300,
          transitionEasing: easeInOutCubic
        } });
      } catch (e) {
        console.debug('Could not use duration. Viewport does not exist.', e);
      }
    }
    // this.root.translateTo([[lon.min, lat.min], [lon.max, lat.max]]);
  }

  translateTo(bounds: [[number, number], [number, number]]) {
    try {
      if (this.deckInstance === null) {
        if (this.size === undefined) {
          this.bounds = bounds;
        } else {
          this.bounds = null;
          const viewport = new WebMercatorViewport({
            width: this.size.width,
            height: this.size.height,
            longitude: 0,
            latitude: 0,
            zoom: 12,
            pitch: 0,
            bearing: 0
          });
          let {longitude, latitude, zoom} = viewport.fitBounds(bounds, { maxZoom: MAX_ZOOM_BOUNDS, offset: this.offset, padding: this.padding });
          // Check if we are zooming to one point. Don't zoom in all the way
          if (bounds[0][0] === bounds[1][0] && bounds[0][1] === bounds[1][1]) zoom = ZOOM_WHEN_SINGLE_POINT;
          this.start = {
            latitude,
            longitude,
            zoom
          }
        }
      } else {
        try {
          const viewports = this.deckInstance.getViewports();
          if (viewports.length === 0) return;
          const viewport = viewports[0] as _GlobeViewport;
          const viewportWebMercator = new WebMercatorViewport(viewport);
          let {longitude, latitude, zoom} = viewportWebMercator.fitBounds(bounds, { maxZoom: MAX_ZOOM_BOUNDS, offset: this.offset, padding: this.padding });
          // Check if we are zooming to one point. Don't zoom in all the way
          if (bounds[0][0] === bounds[1][0] && bounds[0][1] === bounds[1][1]) zoom = ZOOM_WHEN_SINGLE_POINT;

          this.deckInstance.setProps({ initialViewState: {
            latitude,
            longitude,
            zoom,
            transitionInterpolator: new FlyToInterpolator({ speed: 2 }),
            transitionDuration: Math.log2(getDistanceFromLatLonInKm(viewport.latitude, viewport.longitude, latitude, longitude)) * 300,
            transitionEasing: easeInOutCubic
          } });  
        } catch (e) {
          // console.debug('Could not use duration. Viewport does not exist.', e);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  updateLayer(id: string, layers: Layer[]) {
    if (id in this.layers) {
      this.layers[id].layerList = layers;
      if (this.deferUpdate === false) this.#pushLayerUpdate();
    } else {
      console.error('A layer tried to update but it has not been registered!', id);
    }
  }

  updateOffset(offset: [number, number]) {
    this.offset = offset;
  }

  updatePadding(padding: number | Required<Padding>) {
    this.padding = padding;
  }

  #pushLayerUpdate() {
    // If we get to here, reset the update deferral
    this.deferUpdate = false;
    if (this.deckInstance === null) return;

    const layerInstances: LayerInstance[] = [];
    for (const key of Object.keys(this.layers)) {
      const layer = this.layers[key];
      layerInstances.push(layer);
    }
    layerInstances.sort((a, b) => a.zOrder - b.zOrder);
    const layers = layerInstances.map((l) => l.layerList);

    if (this.deckInstance.props.layers.length === 0) {
      console.error('Cannot add layers. No tile layer exists.');
      return;
    }

    const tileLayer = this.deckInstance.props.layers[0];

    // TODO: This layer should only render in globe mode
    const poly = new SolidPolygonLayer({
      id: 'background-' + this.polyID,
      data: [
        [[-180, 90], [0, 90], [180, 90], [180, -90], [0, -90], [-180, -90]]
      ],
      getPolygon: d => d,
      getElevation: -1000,
      stroked: false,
      filled: true,
      extruded: true,
      getFillColor: this.usingDarkMode ? [49, 49, 49] : [152, 166, 168] // Chosen via trial and error :(
    })

    this.deckInstance.setProps({ layers: [tileLayer, poly, layers] });
  }

  updateDeckInstance (deck: Deck<MapView> | Deck<_GlobeView>, usingDarkMode: boolean) {
    // Update dark mode
    this.usingDarkMode = usingDarkMode;
    // Set the new deck instance
    this.deckInstance = deck;
    // Refresh poly ID
    this.polyID = uuidv4();
    // Enable layer update deferral, so we wait until all layers are ready to render before updating
    this.deferUpdate = true;
    // Trigger each module to render
    for (const key of Object.keys(this.layers)) this.layers[key].module.render(true);
    // Disable layer update deferral
    this.deferUpdate = false;
    // Push the layer updates to the deck instance
    this.#pushLayerUpdate();
  }

  getStartView() {
    return this.start;
  }
}
