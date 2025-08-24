import { Context } from "runed";

import { getDistanceFromLatLonInKm } from "$lib/helpers";
import { type _GlobeView, type _GlobeViewport, WebMercatorViewport, type Deck, type Layer, type MapView, type Position, type Viewport, type Widget } from "deck.gl";
import { v4 as uuidv4 } from 'uuid';


const EARTH_RADIUS = 6370972;
const EARTH_AREA = 4 * Math.PI * EARTH_RADIUS * EARTH_RADIUS;


const MapWidgetsContext = new Context<MapWidgetsRootState>("Map.Widgets");


export class MapWidgetsRootState {
  // Create a new map widget and assign context
  static create(opts: ConstructorParameters<typeof MapWidgetsRootState>[0]) {
    return MapWidgetsContext.set(new MapWidgetsRootState(opts));
  }

  widgets: Widget[] = [];
  draggingNotifiers: DraggingNotifier[] = [];
  deckInstance: Deck<MapView> | Deck<_GlobeView> | null = null;
  usingDarkMode = false;

  constructor (options: {}) {
    // Bind register to this so 'this' works correctly in the function later
    this.register = this.register.bind(this);
    this.deregister = this.deregister.bind(this);
    this.registerDraggingNotifier = this.registerDraggingNotifier.bind(this);
    this.deregisterDraggingNotifier = this.deregisterDraggingNotifier.bind(this);
  }

  registerDraggingNotifier(d: DraggingNotifier) {
    this.draggingNotifiers.push(d);
  }

  deregisterDraggingNotifier(d: DraggingNotifier) {
    this.draggingNotifiers = this.draggingNotifiers.filter((n) => n.id !== d.id);
  }

  dragStart() {
    for (const dragNotifier of this.draggingNotifiers) {
      dragNotifier.onDragStart();
    }
  }

  dragEnd() {
    for (const dragNotifier of this.draggingNotifiers) {
      dragNotifier.onDragEnd();
    }
  }

  register(widget: Widget) {
    this.widgets.push(widget);
    this.#pushWidgetUpdate();
  }

  deregister(widget: Widget) {
    this.widgets = this.widgets.filter((w) => w.id !== widget.id);
    this.#pushWidgetUpdate();
  }

  #pushWidgetUpdate() {
    // Update the deck instance with the proper widgets
    if (this.deckInstance !== null) this.deckInstance.setProps({ widgets: this.widgets });
  }

  updateDeckInstance (deck: Deck<MapView> | Deck<_GlobeView>, usingDarkMode: boolean) {
    // Update dark mode
    this.usingDarkMode = usingDarkMode;
    // Update deck instance
    this.deckInstance = deck;
    this.#pushWidgetUpdate();
  }

  getWidgets () {
    return this.widgets;
  }

  getViewport () {
    if (this.deckInstance === null) return null;
    try {
      const viewports = this.deckInstance.getViewports();
      if (viewports.length === 0) return null;
      return viewports[0];
    } catch(e) {
      return null;
    }
  }
}

export class DraggingNotifier {
  // Create a new map widget and assign context
  static create(opts: Omit<ConstructorParameters<typeof DraggingNotifier>[0], 'root'>) {
    return new DraggingNotifier({ ...opts, root: MapWidgetsContext.get()});
  }

  id;
  root: MapWidgetsRootState;
  onDragStart: () => void;
  onDragEnd: () => void;

  constructor (options: { root: MapWidgetsRootState, onDragStart?: () => void, onDragEnd?: () => void }) {
    this.root = options.root;
    const noop = () => {}
    this.onDragEnd = options.onDragEnd ?? noop;
    this.onDragStart = options.onDragStart ?? noop;
    this.id = uuidv4();


    this.root.registerDraggingNotifier(this);
  }

  destroy() {
    this.root.deregisterDraggingNotifier(this);
  }
}

export class GeoReferencedTooltipWidget implements Widget {


  // Create a new map widget and assign context
  static create(opts: Omit<ConstructorParameters<typeof GeoReferencedTooltipWidget>[0], 'root'>) {
    return new GeoReferencedTooltipWidget({ ...opts, root: MapWidgetsContext.get()});
  }

  element?: HTMLDivElement;
  // tar?: HTMLDivElement;
  // children?: HTMLCollection;
  
  props: {
    position: Position;
    hidden: boolean;
    fade: boolean;
  }
  id: string;


  root: MapWidgetsRootState;
  viewport?: Viewport;
  _stopProcessing = false;
  _stopUpdating = false;

  hiddenTimeout: NodeJS.Timeout | null = null;
  timeToHidden: number | null = null;
  

  constructor(options: { position: Position, id?: string, hidden: boolean, fade: boolean, root: MapWidgetsRootState }) {
    this.props = {
      position: options.position,
      hidden: options.hidden,
      fade: options.fade
    }

    this.root = options.root;

    // this.onRedraw = this.onRedraw.bind(this);

    if (options.id === undefined) this.id = uuidv4();
    else this.id = options.id;

    // Add this widget to the root widget list
    this.root.register(this);
  }

  onAdd(params: { deck: Deck<any>; viewId: string | null; }) {
    // this.element = document.createElement('div');
    // this.element.classList.add('transition-opacity', 'absolute', 'z-20', '-translate-x-[50%]', '-translate-y-[50%]');
    // if (this.children !== undefined) {
    //   this.element.append(...this.children);
    //   this.children = this.element.children;
    //   if (this.tempContainer !== undefined) {
    //     this.tempContainer.remove();
    //     this.tempContainer === undefined;
    //   }
    //   console.log('temp container set (onAdd)', this.tempContainer, this.children);
    // }

    this.onRedraw({ viewports: params.deck.getViewports(), layers: [] });
    return null;
  }

  setTarget(el: HTMLDivElement) {
    this.element = el;
    this.element.style.opacity = '0%';
    this.element.className = '';
    this.element.classList.add('absolute', 'z-20', '-translate-x-[50%]', '-translate-y-[50%]', 'pointer-events-none');
    if (this.props.fade) this.element.classList.add('transition-opacity', 'duration-500');
    else this.element.classList.remove('transition-opacity', 'duration-500');
    // this.tempContainer = el;
    // this.children = this.tempContainer.children;
    // if (this.element === undefined) return;
    // this.element.append(...this.children);
    // this.tempContainer.remove();
    // this.tempContainer = undefined;
    // this.children = this.element.children;
    // console.log('temp container set', this.tempContainer, this.children);
  }

  onRemove() {
    // if (this.children === undefined) return;
    // // We need to preserve the children contents just in case we add
    // // this widget to another deck instance
    // this.tempContainer = document.createElement('div');
    // this.tempContainer.style.display = 'none';
    // this.tempContainer.append(...this.children);
    // console.log('temp container remove', this.tempContainer, this.children);
  }

  onRedraw (params: { viewports: Viewport[]; layers: Layer[]; }) {
    if (params.viewports.length === 0 || this.element === undefined) return;


    if (this._stopProcessing === true) return;

    const viewport = params.viewports[0] as _GlobeViewport | WebMercatorViewport;
    this.viewport = viewport;
    const point = this.props.position;
    const res = viewport.project(point as number[]);


    let tooDistant = false;

    if (viewport.id === 'GlobeView') {

      // We type to any because only WebMercatorViewport has an altitude param. This is
      // faster than checking the type of object the viewport is
      let altitude = (viewport as any).altitude as number | undefined;


      if (altitude === undefined) {
        // This is the GlobeViewport

        // Calculate the distance between the center of the screen and the point
        const distance = getDistanceFromLatLonInKm(point[1], point[0], viewport.latitude, viewport.longitude);
        
        altitude = (Math.hypot(...viewport.cameraPosition) * viewport.distanceScales.metersPerUnit[2]) - EARTH_RADIUS;

        // @see https://math.stackexchange.com/questions/1329130/what-fraction-of-a-sphere-can-an-external-observer-see/1329567#1329567
        const maxViewLengthMeters = EARTH_RADIUS * Math.acos(EARTH_RADIUS / (EARTH_RADIUS + altitude));


        // TODO: Right now, when the widget goes off-screen it stops calculating position data, which
        // means it freezes. Noticeable when panning the glove quickly.
        tooDistant = distance * 1000 > maxViewLengthMeters;

        // We will also hide or show based on whether or not it is off the screen by a margin or not
        tooDistant = tooDistant || Math.abs(res[0]) > viewport.width * 3 || Math.abs(res[1]) > viewport.height * 3;

        if (tooDistant) {
          if (this.timeToHidden === null) {
            // This is the first frame we've gone off screen. Calculate when we should stop calculating
            this.timeToHidden = Date.now() + 600;
          }

          if (Date.now() > this.timeToHidden) {
            this._stopUpdating = true;
            this.timeToHidden = null;
          }
        } else {
          this._stopUpdating = false;
          this.timeToHidden = null;
        }
      }
    }


    this.element.style.opacity = (tooDistant || this.props.hidden) ? '0%' : '100%';
    if (!this._stopUpdating) {
      this.element.style.left = res[0] + 'px';
      this.element.style.top = res[1] + 'px';
    }

  }

  #updateViewport() {
    this.viewport = this.root.getViewport() ?? undefined;
  }

  setProps (props: Partial<typeof this.props>) {
    if ('hidden' in props && props.hidden !== undefined) {
      this.props.hidden = props.hidden;
      if (this.hiddenTimeout !== null) clearTimeout(this.hiddenTimeout);
      if (this.props.hidden) {
        if (this.props.fade) {
          this.hiddenTimeout = setTimeout(() => {
            this._stopProcessing = true
          }, 600);
        }
      } else {
        this._stopProcessing = false;
        this._stopUpdating = false;
        this.timeToHidden = null;
      }

      this.#updateViewport();
      if (this.viewport !== undefined) this.onRedraw({ viewports: [this.viewport], layers: []});
    }
    if ('position' in props && props.position !== undefined) {
      this.props.position = props.position;
      this.#updateViewport();
      if (this.viewport !== undefined) this.onRedraw({ viewports: [this.viewport], layers: []});
    }
    if ('fade' in props && props.fade !== undefined) {
      this.props.fade = props.fade;
      if (this.element !== undefined) {
        if (this.props.fade) {
          this.element.classList.add('transition-opacity', 'duration-500');
        } else {
          this.element.classList.remove('transition-opacity', 'duration-500');
        }
      }
      this.#updateViewport();
      if (this.viewport !== undefined) this.onRedraw({ viewports: [this.viewport], layers: []});
    }
  }

  destroy() {
    this.root.deregister(this);
  }
}