import { IconLayer, Layer, TextLayer, type Color } from "deck.gl";
import * as DeckTypes from "../../types";
import { v4 as uuidv4 } from 'uuid';
import { CollisionFilterExtension, type CollisionFilterExtensionProps } from "@deck.gl/extensions";
import { MapComponentContext, MapComponentRootState, type LayerModule } from "../../component.svelte";
import type { getColor } from "@unovis/ts";

const HIGHLIGHT_BG: Color = [255, 255, 255, 255];
const HIGHLIGHT_TEXT: Color = [0, 0, 0, 255];

const BG: Color = [0, 0, 0, 255];
const TEXT: Color = [255, 255, 255, 255];

export class AirportLayer implements LayerModule {
  // Create a new map widget and assign context
  static create(opts: Omit<ConstructorParameters<typeof AirportLayer>[0], 'root'>) {
    return new AirportLayer({ ...opts, root: MapComponentContext.get()});
  }

  root: MapComponentRootState;

  props: {
    airports: DeckTypes.Airports;
    label: boolean;
    hidden: boolean;
    highlight: string[]
  }

  highlightSet: Set<string>;

  // airportsWithHighlight: (DeckTypes.Airport & { colors: { bg: Color, text: Color } })[];

  id: string;
  layers: Layer[] = [];
  layerID: string;

  shallowUpdate = 0;

  constructor(options: { airports?: DeckTypes.Airports, hidden?: boolean, label?: boolean, highlight?: string[], root: MapComponentRootState } ) {
    this.root = options.root;
    // Add this layer to the root layer list
    this.id = this.root.register(this, 'airport-layer', 10);
    this.layerID = uuidv4();
    this.props = {
      hidden: options.hidden ?? false,
      label: options.label ?? true,
      airports: options.airports ?? [],
      highlight: options.highlight ?? []
    }
    this.highlightSet = new Set(this.props.highlight);
    // this.airportsWithHighlight = [];
    // this.#derivedAirportWithHighlight();

    this.getBG = this.getBG.bind(this);
    this.getText = this.getText.bind(this);
    this.getPriority = this.getPriority.bind(this);
  }



  #updateHighlights() {
  //   // for (let i = 0; i < this.airportsWithHighlight.length; i++) {
  //   //   if (this.props.highlight.includes(this.airportsWithHighlight[i].id)) {
  //   //     this.airportsWithHighlight[i].colors = {
  //   //       bg: HIGHLIGHT_BG,
  //   //       text: HIGHLIGHT_TEXT
  //   //     }
  //   //     // console.log(JSON.stringify(this.airportsWithHighlight[i]));
  //   //     // console.log('h', this.airportsWithHighlight[i].id, this.airportsWithHighlight[i].colors, HIGHLIGHT_BG);
  //   //   } else {
  //   //     // console.log('n', this.props.highlight, this.airportsWithHighlight[i].id)
  //   //     this.airportsWithHighlight[i].colors.bg = BG;
  //   //     this.airportsWithHighlight[i].colors.text = TEXT;
  //   //   }
  //   // }
  //   this.shallowUpdate = this.shallowUpdate + 1;
  //   // this.airportsWithHighlight = JSON.parse(JSON.stringify(this.airportsWithHighlight));
  //   // console.log(this.airportsWithHighlight);
  //   // for (const layer of this.layers) layer.setNeedsRedraw();
  //   // for (const layer of this.layers) layer.setNeedsUpdate();
  // }

  // #derivedAirportWithHighlight() {
  //   this.airportsWithHighlight = this.props.airports.map((a) => {
  //     return { ...a, colors: { bg: BG, text: TEXT } }
  //   });
  //   if (this.props.highlight.length !== 0) this.#updateHighlights()
  }

  setProps (props: Partial<typeof this.props>) {
    let shouldRender = false;
    if ('airports' in props && props.airports !== undefined) {
      this.props.airports = props.airports;
      // this.#derivedAirportWithHighlight();
      shouldRender = true;
    }
    if ('hidden' in props && props.hidden !== undefined) {
      this.props.hidden = props.hidden;
      shouldRender = true;
    }
    if ('label' in props && props.label !== undefined) {
      this.props.label = props.label;
      shouldRender = true;
    }
    if ('highlight' in props && props.highlight !== undefined) {
      this.props.highlight = props.highlight;
      if (props.highlight.length !== this.highlightSet.size || !props.highlight.every((id) => this.highlightSet.has(id))) {
        this.highlightSet = new Set(props.highlight);
        this.shallowUpdate = this.shallowUpdate + 1;
        shouldRender = true;
      }
    }

    if (shouldRender) this.render();
  }


  destroy() {
    this.root.deregister(this.id);
  }

  getBG(a: DeckTypes.Airport): Color {
    if (this.highlightSet.has(a.id)) return HIGHLIGHT_BG
    return BG;
  }

  getText(a: DeckTypes.Airport): Color {
    if (this.highlightSet.has(a.id)) return HIGHLIGHT_TEXT
    return TEXT;
  }

  getPriority(a: DeckTypes.Airport): number {
    if (this.highlightSet.has(a.id)) return 1000;
    return a.priority ?? 0;
  }
  
  render(updateID: boolean = false) {

    const shallowUpdate = this.shallowUpdate;
    // console.log('render');
    // console.log(JSON.stringify(this.airportsWithHighlight))
    if (updateID) this.layerID = uuidv4();
    this.layers = [];

    this.layers.push(
      new IconLayer<typeof this.props.airports[0]>({
        parameters: { cullMode: 'front' },
        id: this.id + '-icons-' + this.layerID,
        data: this.props.airports,
        visible: !this.props.hidden,
        getColor: [255, 0, 255, 255],
        getIcon: (d) => 'marker',
        getPosition: (d) => [d.longitude, d.latitude],
        getPolygonOffset: ({layerIndex}) => [0, -layerIndex * 20000], // TODO: This seems like a hack to get culling to work. @see https://deck.gl/docs/api-reference/core/layer#getpolygonoffset
        getPixelOffset: [-5, 0],
        getSize: 8,
        iconAtlas: '/MapPin.svg',
        // billboard: true,
        iconMapping: { marker: {x: 0, y: 0, width: 100, height: 100, anchorX: 0 }},
      })
    );

    if (this.props.label) {
      const l = new TextLayer<DeckTypes.Airport, CollisionFilterExtensionProps>({
        parameters: { cullMode: 'none', depthCompare: 'always' },
        id: this.id + '-labels-' + this.layerID,
        data: this.props.airports,
        visible: !this.props.hidden,
        getPosition: node => [node.longitude, node.latitude],
        getText: node => node.id,
        // getPolygonOffset: ({layerIndex}) => [0, -layerIndex * 20000], // TODO: This seems like a hack to get culling to work. @see https://deck.gl/docs/api-reference/core/layer#getpolygonoffset
        getSize: 10,
        getPixelOffset: [30, 0],
        getAlignmentBaseline: 'center',
        getTextAnchor: 'middle',
        background: true,
        getCollisionPriority: this.getPriority,
        updateTriggers: {
          // This tells deck.gl to recalculate radius when `year` changes
          getBackgroundColor: shallowUpdate,
          getColor: shallowUpdate,
          getCollisionPriority: shallowUpdate
        },
        backgroundBorderRadius: 4,
        backgroundPadding: [3, 2],
        getBackgroundColor: this.getBG,
        getColor: this.getText,
        collisionTestProps: {
          sizeScale: 5,
          radiusScale: 1
        },
        collisionGroup: 'airports',
        fontFamily: 'Helvetica Neue, Arial, Helvetica, sans-serif',
        fontWeight: 'bold',
        getBorderWidth: this.root.usingDarkMode ? undefined : 1,
        getBorderColor: this.root.usingDarkMode ? undefined : [0, 0, 0],
        extensions: [new CollisionFilterExtension()],
      });
      this.layers.push(l);
    }

    this.root.updateLayer(this.id, this.layers);
  }
}