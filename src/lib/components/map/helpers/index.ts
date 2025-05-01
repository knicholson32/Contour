import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { getDistanceFromLatLonInKm } from '$lib/helpers';
import type { CurvePathData } from '@elfalem/leaflet-curve';
import type * as Types from '@prisma/client';
import type { LayerGroup } from 'leaflet';

export type CreateMapOptions = { 
  noLegal?: boolean, 
  noMapControls?: boolean
}

const defaultOptions: CreateMapOptions = {};

export type Point = [number, number];
export interface BezierCurve {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
  distance: number;
}
export const lerp = (p1: Point, p2: Point, t: number): Point => {
  return [
    p1[0] + (p2[0] - p1[0]) * t,
    p1[1] + (p2[1] - p1[1]) * t,
  ];
}


export const computeBezierPath = (points: Point[]): BezierCurve[] => {
  const n = points.length - 1;
  if (n < 2) throw new Error("Need at least 3 points");

  const result: BezierCurve[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = points[i - 1] || points[i]; // previous or same
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2; // next or same

    // Catmull-Rom to Bezier conversion
    const cp1: Point = [
      p1[0] + (p2[0] - p0[0]) / 6,
      p1[1] + (p2[1] - p0[1]) / 6,
    ];
    const cp2: Point = [
      p2[0] - (p3[0] - p1[0]) / 6,
      p2[1] - (p3[1] - p1[1]) / 6,
    ];

    result.push({
      start: p1,
      control1: cp1,
      control2: cp2,
      end: p2,
      distance: getDistanceFromLatLonInKm(p1[0], p1[1], p2[0], p2[1]),
    });
  }

  return result;
}

export const drawLegData = (L: typeof import('leaflet'), map: L.Map | LayerGroup, points: Point[], airports: Types.Airport[], options?: { link?: string, noCurves?: boolean}) => {
  let airportStartJoin = false;
  let airportEndJoin = false;
  if (options === undefined) options = {};
  const noCurves = options.noCurves || false;
  const link = options.link || undefined;
  // Check that the first position is the airport
  if (airports.length > 0 && (points[0][0] !== airports[0].latitude || points[0][1] !== airports[0].longitude)) airportStartJoin = true;

  // Check that the last position is the airport
  if (airports.length > 0 && (points[points.length - 1][0] !== airports[airports.length - 1].latitude || points[points.length - 1][1] !== airports[airports.length - 1].longitude)) airportEndJoin = true;

  // Try to make curves work. If there are less than 3 points, just draw a line.
  try {
    if (noCurves) throw Error('No curves');
    const curves = computeBezierPath(points);
    const curveEntries: CurvePathData = [];
    const uncertainCurves: BezierCurve[] = [];
    for (let i = 0; i < curves.length; i++) {
      const curve = curves[i];
      // If this curve is too long, add it to the uncertain curves
      if (curve.distance > 500 || (i > 0 && curves[i-1].distance > 500) || (i < curves.length - 1 && curves[i+1].distance > 500)) {
        uncertainCurves.push(curve);
        continue;
      }
      curveEntries.push('M');
      curveEntries.push(curve.start);
      curveEntries.push('C');
      curveEntries.push(curve.control1);
      curveEntries.push(curve.control2);
      curveEntries.push(curve.end);
    }

    const uncertainCurveEntries: CurvePathData = [];
    for (const curve of uncertainCurves) {
      uncertainCurveEntries.push('M');
      uncertainCurveEntries.push(curve.start);
      uncertainCurveEntries.push('L');
      uncertainCurveEntries.push(curve.end);
    }

    const mainCurve = L.curve(curveEntries, { color: '#E4E', opacity: 1 });
    const uncertainPosCurves = L.curve(uncertainCurveEntries, { color: '#E4E', opacity: 1, dashArray: [5, 5], weight: 1 });
    if (link) {
      mainCurve.on('click', () => goto(link));
      uncertainPosCurves.on('click', () => goto(link));
    }
    
    mainCurve.addTo(map);
    uncertainPosCurves.addTo(map);
  } catch (e) {
    // Fallback to straight lines if there was an error
    // TODO: If there is a long distance between two points, draw a straight line between them in a different color, as is done in the curves
    const line = L.polyline(points, { color: '#E4E', opacity: 1, smoothFactor: 1 });
    if (link) line.on('click', () => goto(link));
    line.addTo(map);
  }

  if (airportStartJoin) {
    L.polyline([points[0], [airports[0].latitude, airports[0].longitude]], { color: '#333', dashArray: [5, 5], opacity: 0.25, weight: 1}).addTo(map);
  }

  if(airportEndJoin) {
    L.polyline([[airports[airports.length - 1].latitude, airports[airports.length - 1].longitude], points[points.length - 1]], { color: '#333', dashArray: [5, 5], opacity: 0.25, weight: 1 }).addTo(map);
  }
}

export const createMap = (L: typeof import('leaflet'), container: HTMLDivElement, options: CreateMapOptions = defaultOptions): L.Map => {

  let noLegal = false;
  let noMapControls = false;

  if (options.noLegal === true) noLegal = true;
  if (options.noMapControls === true) noMapControls = true;

  let theme: Theme = 'voyager';
  if (browser && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'smoothDark';

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

export type Theme = 'smoothDark' | 'smoothLight' | 'voyager' | 'darkMatter' | 'darkMatterNoLabels';

export const generateTileLayer = (L: typeof import('leaflet'), theme: Theme): L.TileLayer => {
  let tileLayer;
  switch (theme) {
    case 'smoothDark':
      tileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=ad49e48b-b4ff-4da3-a7d4-2dc77d16ae77', {
        minZoom: 0,
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      break;
    case 'smoothLight':
      tileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=ad49e48b-b4ff-4da3-a7d4-2dc77d16ae77', {
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