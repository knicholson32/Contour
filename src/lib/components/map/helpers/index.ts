import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { getDistanceFromLatLonInKm } from '$lib/helpers';
import type { CurvePathData } from '@elfalem/leaflet-curve';
import type * as Types from '@prisma/client';
import type { Curve, LayerGroup } from 'leaflet';
import { ZoomHandler } from './zoomHandler';

export const ZOOM_CUTOFF = 8;

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
  curvature: number;
}
export const lerp = (p1: Point, p2: Point, t: number): Point => {
  return [
    p1[0] + (p2[0] - p1[0]) * t,
    p1[1] + (p2[1] - p1[1]) * t,
  ];
}

const distToLine = (p: Point, a: Point, b: Point): number => {
  const ab = { x: b[0] - a[0], y: b[1] - a[1] };
  const ap = { x: p[0] - a[0], y: p[1] - a[1] };
  const abLength = Math.hypot(ab.x, ab.y);
  const projected = (ap.x * ab.x + ap.y * ab.y) / abLength;
  const closest = {
    x: a[0] + (ab.x * projected) / abLength,
    y: a[1] + (ab.y * projected) / abLength,
  };
  return Math.hypot(p[0] - closest.x, p[1] - closest.y);
};

const calculateCurvatureValue = (start: Point, control1: Point, control2: Point, end: Point): number => {
  const d1 = distToLine(control1, start, end);
  const d2 = distToLine(control2, start, end);
  const maxDist = Math.max(d1, d2);
  const chordLength = Math.hypot(end[0] - start[0], end[1] - start[1]);
  return maxDist / chordLength;
}

const averageVector = (v: Point): Point => {
  const mag = Math.hypot(v[0], v[1]);
  return [
    v[0] / mag,
    v[1] / mag,
  ];
}

const fitBezierGroup = (curves: BezierCurve[]): BezierCurve => {
  const first = curves[0];
  const last = curves[curves.length - 1];
  const start = first.start;
  const end = last.end;

  // Outgoing tangent from first
  const tanOut: Point = [
    first.control2[0] - first.start[0],
    first.control2[1] - first.start[1],
  ];

  // Incoming tangent to last
  const tanIn: Point = [
    last.end[0] - last.control1[0],
    last.end[1] - last.control1[1],
  ];

  const chordLength = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const scale = chordLength / 3;

  const unitOut = averageVector(tanOut);
  const unitIn = averageVector(tanIn);

  const control1: Point = [
    start[0] + unitOut[0] * scale,
    start[1] + unitOut[1] * scale,
  ];

  const control2: Point = [
    end[0] - unitIn[0] * scale,
    end[1] - unitIn[1] * scale,
  ];

  const distance = chordLength;

  return { start, control1, control2, end, distance, curvature: calculateCurvatureValue(start, control1, control2, end) };
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
      curvature: calculateCurvatureValue(p1, cp1, cp2, p2)
    });
  }

  return result;
}

export const simplifyBezierPaths = (curves: BezierCurve[], straightnessThreshold = 0.003): BezierCurve[] => {
  const simplified: BezierCurve[] = [];

  let i = 0;
  while (i < curves.length) {
    let j = i;
    while (j + 1 < curves.length) {
      if (curves[j].curvature > straightnessThreshold) break;
      j++;
    }

    if (i === j) {
      simplified.push(curves[i]);
      i++;
    } else {
      const group = curves.slice(i, j + 1);
      const merged = fitBezierGroup(group);
      simplified.push(merged);
      i = j + 1;
    }
  }

  // console.log('Before', curves.length, 'After', simplified.length);

  return simplified;

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