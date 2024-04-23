import { browser } from '$app/environment';

export type CreateMapOptions = { 
  noLegal?: boolean, 
  noMapControls?: boolean
}

const defaultOptions: CreateMapOptions = {};

export const createMap = (L: typeof import('leaflet'), container: HTMLDivElement, options: CreateMapOptions = defaultOptions): L.Map => {

  let noLegal = false;
  let noMapControls = false;

  if (options.noLegal === true) noLegal = true;
  if (options.noMapControls === true) noMapControls = true;

  let theme: Theme = 'voyager';
  if (browser && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'darkMatterNoLabels';

  let m = L.map(container, { 
    dragging: !L.Browser.mobile,
    attributionControl: false,
    zoomControl: !noMapControls,
    zoomSnap: 0.1,
    zoomDelta: 10,
    wheelPxPerZoomLevel: 6,
    bounceAtZoomLimits: true,
    minZoom: 3,
    maxZoom: 13,
    zoomAnimation: true,
    fadeAnimation: true,
    // zoomAnimationThreshold: 2,
  });
  const tileLayer = generateTileLayer(L, theme);
  tileLayer.addTo(m);

  if (!noLegal) {
    L.control.attribution({
      position: 'bottomleft'
    }).addTo(m);
  }

  return m;
}

export type Theme = 'smoothDark' | 'voyager' | 'darkMatter' | 'darkMatterNoLabels';

export const generateTileLayer = (L: typeof import('leaflet'), theme: Theme): L.TileLayer => {
  let tileLayer;
  switch (theme) {
    case 'smoothDark':
      tileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        minZoom: 0,
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      break;
    case 'darkMatter':
      tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      });
      break;
    case 'darkMatterNoLabels':
      tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      });
      break;
    case 'voyager':
    default:
      tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,
                &copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`,
        subdomains: 'abcd',
        maxZoom: 14,
      });
      break;
  }

  return tileLayer;
}