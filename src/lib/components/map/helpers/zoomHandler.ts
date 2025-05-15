import type { LegData } from "./LegData";

export class ZoomHandler {

  map: L.Map;
  showingCurves = false;

  callbacks: LegData[] = [];

  constructor (map: L.Map) {
    map.off('zoom');
    map.on('zoom', this.handler, this);
    this.map = map;
  }

  add (legData: LegData) {
    // Exit if this LegData already has a callback
    for (const ld of this.callbacks) if (legData === ld) return;
    // Add the callback
    this.callbacks.push(legData);
  }

  handler () {
    const currentZoom = this.map.getZoom();
    for (const callback of this.callbacks) callback.zoomUpdate(currentZoom);
  }



}