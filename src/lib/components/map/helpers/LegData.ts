import type { Curve, LayerGroup } from "leaflet";
import type * as Types from '@prisma/client';
import { computeBezierPath, simplifyBezierPaths, ZOOM_CUTOFF, type BezierCurve, type Point } from ".";
import { getDistanceFromLatLonInKm } from "$lib/helpers";
import type { CurvePathData } from "@elfalem/leaflet-curve";
import { goto } from "$app/navigation";
import { ZoomHandler } from "./zoomHandler";

export class LegData {
  airportLines: L.Polyline[];
  uncertain: Curve | null;
  lines: L.Polyline[];
  curves: Curve | null;
  defaultZoomLevel: number;
  showingCurves: boolean = false;

  static zoomHandler: ZoomHandler | null = null;

  L: typeof import('leaflet')
  map: L.Map;
  layer: L.Map | LayerGroup
  
  constructor (L: typeof import('leaflet'), map: L.Map, points: Point[], airports: Types.Airport[], options?: { link?: string, noCurves?: boolean}) {

    this.L = L;
    this.map = map;
    this.layer = map;

    let uncertainPosCurves: Curve | null = null;
    let curves: Curve | null = null;
    let lines: L.Polyline[] = [];
  
    let airportStartJoin = false;
    let airportEndJoin = false;
    if (options === undefined) options = {};
    const noCurves = options.noCurves || false;
    const link = options.link || undefined;

    // Check that the first position is the airport
    if (airports.length > 0 && points.length > 0 && (points[0][0] !== airports[0].latitude || points[0][1] !== airports[0].longitude)) airportStartJoin = true;
  
    // Check that the last position is the airport
    if (airports.length > 0 && points.length > 0 && (points[points.length - 1][0] !== airports[airports.length - 1].latitude || points[points.length - 1][1] !== airports[airports.length - 1].longitude)) airportEndJoin = true;
  
    // Try to make curves work. If there are less than 3 points, just draw a line.
    try {
      if (noCurves) throw Error('No curves');
      const paths = computeBezierPath(points);
  
      const continuousSegments: BezierCurve[][] = [[]];
      for (let i = 0; i < paths.length; i++) {
        const curve = paths[i];
        if (curve.distance > 500 || (i > 0 && paths[i-1].distance > 500) || (i < paths.length - 1 && paths[i+1].distance > 500)) {
          if (continuousSegments[continuousSegments.length - 1].length > 0) continuousSegments.push([]);
        } else continuousSegments[continuousSegments.length - 1].push(curve);
      }
  
      const continuousLineSegments: L.LatLngExpression[][] = [[points[0]]];
      if (points.length > 1) {
        let lastDist = 0;
        let nextDist = null;
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          let dist: number = 0;
          if (nextDist !== null) {
            dist = nextDist
            nextDist = null;
          } else dist = getDistanceFromLatLonInKm(p1[0], p1[1], p2[0], p2[1]);
  
          if (i < points.length - 2) {
            nextDist = getDistanceFromLatLonInKm(p2[0], p2[1], points[i + 2][0], points[i + 2][1])
          }
  
          if (dist > 500 || lastDist > 500 || (nextDist !== null && nextDist > 500)) {
            if (continuousLineSegments[continuousLineSegments.length - 1].length > 0) continuousLineSegments.push([]);
          } else continuousLineSegments[continuousLineSegments.length - 1].push(p2);
          lastDist = dist;
        }
      }
  
      const curveSegments: CurvePathData = [];
      const uncertainSegments: CurvePathData = [];
      for (let i = 0; i < paths.length; i++) {
        const curve = paths[i];
        // If this curve is too long, add it to the uncertain curves
        if (curve.distance > 500 || (i > 0 && paths[i-1].distance > 500) || (i < paths.length - 1 && paths[i+1].distance > 500)) {
          uncertainSegments.push('M');
          uncertainSegments.push(curve.start);
          uncertainSegments.push('L');
          uncertainSegments.push(curve.end);
          continue;
        }
      }
  
      for (const seg of continuousSegments) {
        const simplified = simplifyBezierPaths(seg);
        for (const curve of simplified) {
          curveSegments.push('M');
          curveSegments.push(curve.start);
          curveSegments.push('C');
          curveSegments.push(curve.control1);
          curveSegments.push(curve.control2);
          curveSegments.push(curve.end);
        }
      }
  
      curves = L.curve(curveSegments, { color: '#E4E', opacity: 1 });
  
      uncertainPosCurves = L.curve(uncertainSegments, { color: '#E4E', opacity: 1, dashArray: [5, 5], weight: 1 });
      lines = [];
      for (const segment of continuousLineSegments) {
        lines.push(L.polyline(segment, { color: '#E4E', opacity: 1 }));
      }
      if (link) {
        curves.on('click', () => goto(link));
        for (const line of lines) line.on('click', () => goto(link));
        uncertainPosCurves.on('click', () => goto(link));
      }
      
      
  
    } catch (e) {
      // Fallback to straight lines if there was an error
      // TODO: If there is a long distance between two points, draw a straight line between them in a different color, as is done in the curves
      lines = []
      const line = L.polyline(points, { color: '#E4E', opacity: 1, smoothFactor: 1 });
      if (link) line.on('click', () => goto(link));
      lines.push(line);
      console.log('FALLBACK', e);
    }
  
    const airportLines = [];
    if (airportStartJoin) airportLines.push(L.polyline([points[0], [airports[0].latitude, airports[0].longitude]], { color: '#333', dashArray: [5, 5], opacity: 0.25, weight: 1}));
    if (airportEndJoin) airportLines.push(L.polyline([[airports[airports.length - 1].latitude, airports[airports.length - 1].longitude], points[points.length - 1]], { color: '#333', dashArray: [5, 5], opacity: 0.25, weight: 1 }))
  
    // We don't know the zoom. Calculate the assumed zoom based on the bounding box for the points
    let defaultZoomLevel = 0;
    if (points.length > 0) {
      let smallestLat = points[0][0];
      let smallestLon = points[0][1];
      let largestLat = points[0][0];
      let largestLon = points[0][1];
      for (const point of points) {
        if (point[0] < smallestLat) smallestLat = point[0]
        if (point[1] < smallestLon) smallestLon = point[1]
        if (point[0] > largestLat) largestLat = point[0]
        if (point[1] > largestLon) largestLon = point[1]
      }
      defaultZoomLevel = map.getBoundsZoom([[smallestLat, smallestLon], [largestLat, largestLon]], true);
    }
  
  
    this.airportLines = airportLines;
    this.uncertain = uncertainPosCurves,
    this.curves = curves;
    this.lines = lines;
    this.defaultZoomLevel = defaultZoomLevel;
  }

  static initialize () {
    LegData.zoomHandler = null;
  }

  default () {
    for (const line of this.lines) {
      line.options.color = '#E4E';
      line.options.weight = 2;
      line.options.opacity = 1;
      line.options.dashArray = [];
    }
    if (this.curves !== null) {
      this.curves.options.color = '#E4E';
      this.curves.options.weight = 2;
      this.curves.options.opacity = 1;
      this.curves.options.dashArray = [];
    }

    this.refresh();
  }

  highlight () { 
    for (const line of this.lines) {
      line.options.color = '#E4E';
      line.options.weight = 5;
      line.options.opacity = 1;
      line.options.dashArray = [];
    }
    if (this.curves !== null) {
      this.curves.options.color = '#E4E';
      this.curves.options.weight = 5;
      this.curves.options.opacity = 1;
      this.curves.options.dashArray = [];
    }

    this.refresh();
  }

  muted () { 
    for (const line of this.lines) {
      line.options.color = '#E4E';
      line.options.weight = 2;
      line.options.opacity = 0.6;
      line.options.dashArray = [2, 5];
    }
    if (this.curves !== null) {
      this.curves.options.color = '#E4E';
      this.curves.options.weight = 2;
      this.curves.options.opacity = 0.6;
      this.curves.options.dashArray = [2, 5];
    }

    this.refresh();
  }

  zoomUpdate (currentZoom: number) {
    try {
      if (currentZoom > ZOOM_CUTOFF && this.curves !== null) {
        if (!this.showingCurves) {
          for (const line of this.lines) {
            try {
              line.removeFrom(this.map);
            } catch (e) {}
          }
          this.curves.addTo(this.layer);
          this.showingCurves = true;
          // console.log('showingCurves', this.showingCurves);
        }
      } else if (this.showingCurves) {
        try {
          this.curves?.removeFrom(this.map);
        } catch (e) {}
        for (const line of this.lines) line.addTo(this.layer);
        this.showingCurves = false;
        // console.log('showingCurves', this.showingCurves);
      }
    } catch (e) {
      console.error(e);
    }
  }

  addTo (layer?: L.Map | LayerGroup) {
    if (layer !== undefined) this.layer = layer;

    this.refresh()
    
    // Add the zoom handler if it doesn't exist
    if (LegData.zoomHandler === null) LegData.zoomHandler = new ZoomHandler(this.map);

    // Add this Leg to the callback list
    LegData.zoomHandler.add(this);
  }


  refresh () {
    // Remove old leg data, if it exists
    // Remove lines between the end of the path and the airports
    for (const airportLine of this.airportLines) {
      try {
        airportLine.remove();
      } catch (e) {}
    }

    // Remove uncertain lines
    if (this.uncertain !== null) {
      try {
        this.uncertain.remove();
      } catch (e) {}
    }

    // Remove basic lines
    for (const line of this.lines) {
      try {
        line.remove();
      } catch (e) {}
    }

    // Remove curves
    if (this.curves !== null) {
      try {
        this.curves.remove();
      } catch (e) {

      }
    }


    // Draw the new lines we know we can draw
    // Draw lines between the end of the path and the airports
    for (const airportLine of this.airportLines) airportLine.addTo(this.layer);

    // Draw uncertain lines
    if (this.uncertain !== null) this.uncertain.addTo(this.layer);


    // Calculate current map zoom level (or use the default if the map isn't loaded yet).
    let currentZoom = this.map.getZoom();
    if (currentZoom === undefined) currentZoom = this.defaultZoomLevel;

    // Draw based on the current zoom
    if (currentZoom > ZOOM_CUTOFF && this.curves !== null) {
      this.curves.addTo(this.layer);
      this.showingCurves = true;
    } else {
      for (const line of this.lines) line.addTo(this.layer);
      this.showingCurves = false;
    }
  }
}