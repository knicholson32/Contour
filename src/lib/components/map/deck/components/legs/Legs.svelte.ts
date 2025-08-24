import { ArcLayer, Layer, PathLayer, type PickingInfo } from "deck.gl";
import * as DeckTypes from "../../types";
import { v4 as uuidv4 } from 'uuid';
import { MapComponentContext, MapComponentRootState, type LayerModule } from "../../component.svelte";
import { numToColor, rgbToHex } from "$lib/helpers";
import type {MjolnirEvent} from 'mjolnir.js';

export class LegsLayer implements LayerModule {
  // Create a new map widget and assign context
  static create(opts: Omit<ConstructorParameters<typeof LegsLayer>[0], 'root'>) {
    return new LegsLayer({ ...opts, root: MapComponentContext.get()});
  }

  root: MapComponentRootState;

  layers: Layer[] = [];
  id: string;

  layerID: string;

  props: {
    legs: DeckTypes.Legs;
    hidden: boolean;
    triggerCameraMove: boolean;
    highlight: string[];
    dimOthersOnHighlight: boolean,
    autoHighlight: boolean,
    pickable: boolean,
    showFlightPlan: boolean,
    onclick: (id: string) => void;
    onhover: (id: string | null, event: MjolnirEvent) => void;
  }



  constructor(options: { legs?: DeckTypes.Legs, hidden?: boolean, triggerCameraMove?: boolean, showFlightPlan?: boolean, pickable?: boolean, autoHighlight?: boolean, highlight?: string[] | null, dimOthersOnHighlight?: boolean, root: MapComponentRootState, onclick?: (id: string) => void, onhover?: (id: string | null, event: MjolnirEvent) => void } ) {
    this.root = options.root;
    const noop = (id: string | null) => {}
    this.props = {
      legs: [],
      hidden: options.hidden ?? false,
      triggerCameraMove: options.triggerCameraMove ?? true,
      highlight: options.highlight ?? [],
      dimOthersOnHighlight: options.dimOthersOnHighlight ?? true,
      autoHighlight: options.autoHighlight ?? true,
      pickable: options.pickable ?? false,
      showFlightPlan: options.showFlightPlan ?? true,
      onclick: options.onclick ?? noop,
      onhover: options.onhover ?? noop,
    }
    // Add this layer to the root layer list
    this.id = this.root.register(this, 'legs-layer', 5);
    this.layerID = uuidv4();

    if (options.legs !== undefined) {
      this.props.legs = options.legs;
      this.render();
    }
  }

  setProps (props: Partial<typeof this.props>) {
    let shouldRender = false;
    if ('hidden' in props && props.hidden !== undefined) {
      this.props.hidden = props.hidden;
      const newLayers: Layer[] = [];
      for (const l of this.layers) {
        const props = {...l.props};
        props.visible = this.props.hidden;
        newLayers.push(l.clone(props));
      }
      this.layers = newLayers;
      this.root.updateLayer(this.id, this.layers);
    }
    if ('triggerCameraMove' in props && props.triggerCameraMove !== undefined) {
      this.props.triggerCameraMove = props.triggerCameraMove;
    }
    if ('legs' in props && props.legs !== undefined) {
      this.props.legs = props.legs;
      shouldRender = true;
    }
    if ('highlight' in props && props.highlight !== undefined) {
      this.props.highlight = props.highlight;
      let savedTriggerMove = this.props.triggerCameraMove;
      this.props.triggerCameraMove = false;
      this.render();
      this.props.triggerCameraMove = savedTriggerMove;
    }
    if ('onclick' in props && props.onclick !== undefined) {
      this.props.onclick = props.onclick;
      shouldRender = true;
    }
    if ('onhover' in props && props.onhover !== undefined) {
      this.props.onhover = props.onhover;
      shouldRender = true;
    }
    if ('pickable' in props && props.pickable !== undefined) {
      this.props.pickable = props.pickable;
      shouldRender = true;
    }
    if ('showFlightPlan' in props && props.showFlightPlan !== undefined) {
      this.props.showFlightPlan = props.showFlightPlan;
      shouldRender = true;
    }
    if ('dimOthersOnHighlight' in props && props.dimOthersOnHighlight !== undefined) {
      this.props.dimOthersOnHighlight = props.dimOthersOnHighlight;
      shouldRender = true;
    }

    if (shouldRender) this.render();
  }
  
  destroy() {
    this.root.deregister(this.id);
  }

  render(updateID: boolean = false, noTranslate: boolean = false) {

    // Nothing to do if there were no legs provided
    // if (this.props.legs.length === 0) return;

    if (updateID) this.layerID = uuidv4();


    this.layers = [];

    type ReferencedPositions = {
      id: string
      positions: (DeckTypes.Position | [number, number, number])[]
    }

    const sets: { [key: string]: ReferencedPositions[] } = {};

    const highlightStyles: DeckTypes.SegmentStyle[] = ['norm', 'deadhead', 'alternate', 'uncertain'];

    let currentPickingColor = 1;
    const idToColor: { [key: string]: [number, number, number] } = {};
    const colorToID: { [key: string]: string } = {};

    // There is a bug with the ArcLayer where it won't accept an encodePickingColor function
    // override. This means that the default is used, therefore we need to allow the ArcLayers
    // to claim the first N colors first, and render them first.
    //   'colorToID' must return the correct leg ID, and therefore may have more than one
    //    color that maps to the same ID (since we cannot control ArcLayer)

    const legsWithoutUncertain: typeof this.props.legs = [];

    for (const leg of this.props.legs) {
      let legHadUncertain = false;
      for (const segment of leg.segments) {
        if (segment.style === 'uncertain') {
          legHadUncertain = true;
          const color = numToColor(currentPickingColor);
          colorToID[rgbToHex(color, false)] = leg.id;
          idToColor[leg.id] = numToColor(currentPickingColor);
          currentPickingColor++
        }
      }
      if (!legHadUncertain) {
        legsWithoutUncertain.push(leg);
      }
    }

    for (const leg of legsWithoutUncertain) {
      const color = numToColor(currentPickingColor);
      idToColor[leg.id] = numToColor(currentPickingColor);
      colorToID[rgbToHex(color, false)] = leg.id;
      currentPickingColor++
    }

    let layerNumber = 0;

    // Go through each leg and extract the segment so we can batch-render
    if (this.props.highlight.length === 0) {
      for (const leg of this.props.legs) {
        for (const segment of leg.segments) {
          const style: DeckTypes.SegmentStyle = segment.style;
          if (!(style in sets)) sets[style] = [];
          if (segment.positions.length < 1) continue;
          sets[style].push({
            id: leg.id,
            positions: segment.positions.map((p) => [p[0], p[1], layerNumber])
          });
          layerNumber += 1
        }
      }
    } else {
      for (const leg of this.props.legs) {
        if (this.props.highlight.includes(leg.id)) {
          // This leg is to be highlighted. Override the style.
          for (const segment of leg.segments) {
            const style: DeckTypes.SegmentStyle = segment.style === 'uncertain' ? 'uncertain-highlight' : (highlightStyles.includes(segment.style) ? 'highlight' : segment.style);
            if (!(style in sets)) sets[style] = [];
            if (segment.positions.length < 1) continue;
            sets[style].push({
              id: leg.id,
              positions: segment.positions.map((p) => [p[0], p[1], layerNumber])
            });
            layerNumber += 0.0001
          }
        } else {
          // This leg may need to be dimmed. Override the style.
          for (const segment of leg.segments) {
            let style: DeckTypes.SegmentStyle = this.props.dimOthersOnHighlight && highlightStyles.includes(segment.style) ? 'dim' : segment.style;
            if (this.props.dimOthersOnHighlight && segment.style === 'uncertain') style = 'uncertain-dim';
            if (!(style in sets)) sets[style] = [];
            if (segment.positions.length < 1) continue;
            sets[style].push({
              id: leg.id,
              positions: segment.positions.map((p) => [p[0], p[1], layerNumber])
            });
            layerNumber += 1
          }
        }
      }
    }

    let currentGlobalIndex = 0;

    for (const key of Object.keys(sets)) {
      const set = sets[key];

      const style = DeckTypes.Styles.getStyle(key as DeckTypes.SegmentStyle);

      if ((key as DeckTypes.SegmentStyle).indexOf('uncertain') === 0) {
        const filteredSets = sets[key].filter((s) => s.positions.length > 1);
        if (style.dark.back !== undefined && style.dark.thickness.back !== undefined) {
          const arcBack = new ArcLayer<ReferencedPositions>({
            id: style.ordering + 'b_uncertain-' + this.layerID,
            data: filteredSets,
            greatCircle: true,
            getHeight: 0,
            getSourcePosition: ((d) => d.positions[0]),
            getTargetPosition: ((d) => d.positions[1]),
            getSourceColor: this.root.usingDarkMode ? style.dark.back : style.light.back,
            getTargetColor: this.root.usingDarkMode ? style.dark.back : style.light.back,
            getWidth: this.root.usingDarkMode ? style.dark.thickness.back : style.light.thickness.back,
            getTilt: 0,
            widthUnits: 'pixels',
            pickable: this.props.pickable,
            autoHighlight: this.props.autoHighlight,
            highlightColor: this.root.usingDarkMode ? DeckTypes.Styles.getStyle('uncertain-highlight').dark.back : DeckTypes.Styles.getStyle('uncertain-highlight').light.back,
            onHover: !this.props.pickable ? undefined : (pickingInfo, event) => {
              for (const layer of this.layers) layer.updateAutoHighlight(pickingInfo);
              if (pickingInfo.index === -1) {
                this.props.onhover(null, event);
                event.rootElement.classList.remove('!cursor-pointer');
              } else {
                this.props.onhover(set[pickingInfo.index].id, event);
                event.rootElement.classList.add('!cursor-pointer');
              }
              return true;
            },
            onClick: !this.props.pickable ? undefined : (pickingInfo) => {
              try {
                this.props.onclick(set[pickingInfo.index].id);
              } catch (e) {
                console.error(e);
              }
              return true;
            }
          });
          this.layers.push(arcBack);
        }

        const arcFront = new ArcLayer<ReferencedPositions>({
          id: style.ordering + 'f_uncertain-' + this.layerID,
          data: set,
          greatCircle: true,
          getHeight: 0,
          getSourcePosition: ((d) => d.positions[0]),
          getTargetPosition: ((d) => d.positions[1]),
          getSourceColor: this.root.usingDarkMode ? style.dark.front : style.light.front,
          getTargetColor: this.root.usingDarkMode ? style.dark.front : style.light.front,
          getWidth: this.root.usingDarkMode ? style.dark.thickness.front : style.light.thickness.front,
          widthUnits: 'pixels',
          pickable: this.props.pickable,
          autoHighlight: this.props.autoHighlight,
          highlightColor: this.root.usingDarkMode ? DeckTypes.Styles.getStyle('uncertain-highlight').dark.front : DeckTypes.Styles.getStyle('uncertain-highlight').light.front,
          onHover: !this.props.pickable ? undefined : (pickingInfo, event) => {
            for (const layer of this.layers) layer.updateAutoHighlight(pickingInfo);
            if (pickingInfo.index === -1) {
              this.props.onhover(null, event);
              event.rootElement.classList.remove('!cursor-pointer');
            } else {
              this.props.onhover(set[pickingInfo.index].id, event);
              event.rootElement.classList.add('!cursor-pointer');
            }
            return true;
          },
          onClick: !this.props.pickable ? undefined : (pickingInfo) => {
            try {
              this.props.onclick(set[pickingInfo.index].id);
            } catch (e) {
              console.error(e);
            }
            return true;
          }
        });
        
        // // arcFront.encodePickingColor = (i: number) => {
        // //   console.log('INDEX', i);
        // //   if (set[i] === undefined) return [0, 0, 0];
        // //   return idToColor[set[i].id]
        // // };
        // arcFront.decodePickingColor = (color: [number, number, number]) => {
        //   return set.findIndex((s) => s.id === colorToID[rgbToHex(color, false)]);
        // }
        // arcFront.encodePickingColor = (i) => {
        //   console.log('INDEXf', i);
        //   return [25, 25, 25];
        // }
        this.layers.push(arcFront);
      } else if ((key as DeckTypes.SegmentStyle).indexOf('plan') === 0) {
        if (!this.props.showFlightPlan) continue;
        let positions: [[number, number, number] | DeckTypes.Position, [number, number, number] | DeckTypes.Position][] = [];
        for (const s of set) {
          if (s.positions.length < 2) continue;
          let lastPosition = s.positions[0];
          const posList: [[number, number, number] | DeckTypes.Position, [number, number, number] | DeckTypes.Position][] = [];
          for (let i = 1; i < s.positions.length; i++) {
            posList.push([lastPosition, s.positions[i]]);
            lastPosition = s.positions[i];
          }
          positions = positions.concat(posList);
        }
        if (style.dark.back !== undefined && style.dark.thickness.back !== undefined) {
          const arcBack = new ArcLayer<[DeckTypes.Position, DeckTypes.Position]>({
            id: style.ordering + 'b_plan-' + this.layerID,
            data: positions,
            greatCircle: true,
            getHeight: 0.001,
            getSourcePosition: ((d) => d[0]),
            getTargetPosition: ((d) => d[1]),
            getSourceColor: this.root.usingDarkMode ? style.dark.back : style.light.back,
            getTargetColor: this.root.usingDarkMode ? style.dark.back : style.light.back,
            getWidth: this.root.usingDarkMode ? style.dark.thickness.back : style.light.thickness.back,
            getTilt: 0,
            widthUnits: 'pixels',
          });
          this.layers.push(arcBack);
        }
        const arcFront = new ArcLayer<[DeckTypes.Position, DeckTypes.Position]>({
          id: style.ordering + 'f_plan-' + this.layerID,
          data: positions,
          greatCircle: true,
          getHeight: 0.001,
          getSourcePosition: ((d) => d[0]),
          getTargetPosition: ((d) => d[1]),
          getSourceColor: this.root.usingDarkMode ? style.dark.front : style.light.front,
          getTargetColor: this.root.usingDarkMode ? style.dark.front : style.light.front,
          getWidth: this.root.usingDarkMode ? style.dark.thickness.front : style.light.thickness.front,
          widthUnits: 'pixels',
        });
        this.layers.push(arcFront);
      } else {
        if (style.dark.back !== undefined && style.dark.thickness.back !== undefined) {
          const back = new PathLayer<ReferencedPositions>({
            id: style.ordering + 'b' + '_' + key + '_back-' + this.layerID,
            data: set,
            getColor: this.root.usingDarkMode ? style.dark.back : style.light.back,
            getPath: (d) => d.positions,
            positionFormat: 'XYZ',
            getPolygonOffset: ({layerIndex}) => [0, -layerIndex * 20000], // TODO: This seems like a hack to get culling to work. @see https://deck.gl/docs/api-reference/core/layer#getpolygonoffset.
            getWidth: this.root.usingDarkMode ? style.dark.thickness.back : style.light.thickness.back,
            visible: !this.props.hidden,
            capRounded: true,
            jointRounded: true,
            widthUnits: 'pixels',
            // billboard: true,
            pickable: this.props.pickable,
            autoHighlight: this.props.autoHighlight,
            highlightColor: this.root.usingDarkMode ? DeckTypes.Styles.getStyle('highlight').dark.back : DeckTypes.Styles.getStyle('highlight').light.back,
            onHover: !this.props.pickable ? undefined : (pickingInfo, event) => {
              for (const layer of this.layers) layer.updateAutoHighlight(pickingInfo);
              if (pickingInfo.index === -1) {
                this.props.onhover(null, event);
                event.rootElement.classList.remove('!cursor-pointer');
              } else {
                this.props.onhover(set[pickingInfo.index].id, event);
                event.rootElement.classList.add('!cursor-pointer');
              }
              return true;
            },
            onClick: !this.props.pickable ? undefined : (pickingInfo) => {
              try {
                this.props.onclick(set[pickingInfo.index].id);
              } catch (e) {
                console.error(e);
              }
              return true;
            }
          });
          back.encodePickingColor = (i: number) => {
            if (set[i] === undefined) return [0, 0, 0];
            return idToColor[set[i].id]
          };
          back.decodePickingColor = (color: [number, number, number]) => set.findIndex((s) => s.id === colorToID[rgbToHex(color, false)]);
          this.layers.push(back);
        }

        const front = new PathLayer<ReferencedPositions>({
          id: style.ordering + 'f' + '_' + key + '_' + this.layerID,
          data: set,
          getColor: this.root.usingDarkMode ? style.dark.front : style.light.front,
          getPath: (d) => d.positions,
          getPolygonOffset: ({layerIndex}) => [0, -layerIndex * 20000], // TODO: This seems like a hack to get culling to work. @see https://deck.gl/docs/api-reference/core/layer#getpolygonoffset.
          positionFormat: 'XYZ',
          getWidth: this.root.usingDarkMode ? style.dark.thickness.front : style.light.thickness.front,
          visible: !this.props.hidden,
          capRounded: true,
          jointRounded: true,
          widthUnits: 'pixels',
          // billboard: true,
          pickable: this.props.pickable,
          autoHighlight: this.props.autoHighlight,
          highlightColor: this.root.usingDarkMode ? DeckTypes.Styles.getStyle('highlight').dark.front : DeckTypes.Styles.getStyle('highlight').light.front,
          onHover: !this.props.pickable ? undefined : (pickingInfo, event) => {
            for (const layer of this.layers) layer.updateAutoHighlight(pickingInfo);
            if (pickingInfo.index === -1) {
              this.props.onhover(null, event);
              event.rootElement.classList.remove('!cursor-pointer');
            } else {
              this.props.onhover(set[pickingInfo.index].id, event);
              event.rootElement.classList.add('!cursor-pointer');
            }
            return true;
          },
          onClick: !this.props.pickable ? undefined : (pickingInfo) => {
            try {
              this.props.onclick(set[pickingInfo.index].id);
            } catch (e) {
              console.error(e);
            }
            return true;
          }
        });

        front.encodePickingColor = (i: number) => {
          if (set[i] === undefined) return [0, 0, 0];
          return idToColor[set[i].id]
        };
        front.decodePickingColor = (color: [number, number, number]) => set.findIndex((s) => s.id === colorToID[rgbToHex(color, false)]);

        this.layers.push(front);
      }

      currentGlobalIndex++;
    }

    this.layers.sort((a, b) => (parseInt(a.id.charAt(0)) - parseInt(b.id.charAt(0))) + (a.id.charCodeAt(1) - b.id.charCodeAt(1)))

    this.root.updateLayer(this.id, this.layers);
    if (!noTranslate && this.props.triggerCameraMove) this.translateTo();
  }

  translateTo() {
    if (this.props.legs.length === 0) {
      // Translate to home airport by default
      this.root.translateHome();
    } else {
      let lat = {
        min: 90,
        max: -90
      }
      let lon = {
        min: 180,
        max: -180
      }
      for (const leg of this.props.legs) {
        for (const seg of leg.segments) {
          // Skip this segment if it is the flight plan. We don't want to zoom based on that.
          if (seg.style === 'plan') continue;
          for (const pos of seg.positions) {
            if (pos[0] < lon.min) lon.min = pos[0];
            if (pos[0] > lon.max) lon.max = pos[0];
            if (pos[1] < lat.min) lat.min = pos[1];
            if (pos[1] > lat.max) lat.max = pos[1];
          }
        }
      }
      this.root.translateTo([[lon.min, lat.min], [lon.max, lat.max]]);
    }
  }

}