import { ArcLayer, Layer, PathLayer, type Position } from "deck.gl";
import * as DeckTypes from "../../types";
import { v4 as uuidv4 } from 'uuid';
import { MapComponentContext, MapComponentRootState, type LayerModule } from "../../component.svelte";
import { getDistanceFromLatLonInKm } from "$lib/helpers";

export class LegLayer implements LayerModule {
  // Create a new map widget and assign context
  static create(opts: Omit<ConstructorParameters<typeof LegLayer>[0], 'root'>) {
    return new LegLayer({ ...opts, root: MapComponentContext.get()});
  }

  root: MapComponentRootState;

  layers: Layer[] = [];
  id: string;

  layerID: string;

  props: {
    leg: DeckTypes.Leg;
    hidden: boolean;
    triggerCameraMove: boolean;
    showFlightPlan: boolean;
  }


  constructor(options: { leg: DeckTypes.Leg, hidden?: boolean, showFlightPlan?: boolean, triggerCameraMove?: boolean, root: MapComponentRootState } ) {
    this.root = options.root;
    this.props = {
      leg: options.leg,
      hidden: options.hidden ?? false,
      triggerCameraMove: options.triggerCameraMove ?? true,
      showFlightPlan: options.showFlightPlan ?? true
    }
    // Add this layer to the root layer list
    this.id = this.root.register(this, 'legs-layer', 5);
    this.layerID = uuidv4();

    if (options.leg !== undefined) {
      this.props.leg = options.leg;
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
      shouldRender = true;
    }
    if ('showFlightPlan' in props && props.showFlightPlan !== undefined) {
      this.props.showFlightPlan = props.showFlightPlan;
      shouldRender = true;
    }
    if ('leg' in props && props.leg !== undefined) {
      this.props.leg = props.leg;
      shouldRender = true;
    }

    if (shouldRender) this.render();
  }
  
  destroy() {
    this.root.deregister(this.id);
  }

  render(updateID: boolean = false) {

    if (updateID) this.layerID = uuidv4();


    this.layers = [];

    const sets: { [key: string]: DeckTypes.Position[][] } = {};
    

    let addedPoints = 0;

    // console.time('PointExpansion')
    // Go through each leg and extract the segment so we can batch-render

    for (const segment of this.props.leg.segments) {
      const style = segment.style;
      if (!(style in sets)) sets[style] = [];
      if (segment.positions.length < 1) continue;

      // IF GLOBE:
      // We need to expand the positions to make sure there is a segment every so often. We do this so
      // as the globe curves down, the line doesn't clip into it.
      // TODO: Don't do this if we aren't rendering as a globe
      // TODO: This is disabled because the getPolygonOffset solution seems to be working for now...
      if (false) {
        // Initialize an array to hold the positions
        let lastPosition = segment.positions[0];
        const positions: typeof segment.positions = [lastPosition];
        // Loop through each segment and check spacing distances
        for (let i = 1; i < segment.positions.length; i++) {
          const position = segment.positions[i];
          const distance = getDistanceFromLatLonInKm(lastPosition[1], lastPosition[0], position[1], position[0]);
          const MIN_DIST = 10;
          if (distance > MIN_DIST) {
            // Add points!
            // TODO: This should actually follow a great-circle interpolation, not this linear basic interpolation
            const x = (position[0] - lastPosition[0]) / (distance / MIN_DIST);
            const y = (position[1] - lastPosition[1]) / (distance / MIN_DIST);
            for (let j = 0; j < distance / MIN_DIST; j++) {
              positions.push([lastPosition[0] + j * x, lastPosition[1] + j * y]);
              addedPoints++;
            }
            positions.push(position);
          } else {
            // No need to add points between
            positions.push(position);
          }
          lastPosition = position;
        }
        // Save the expanded positions
        sets[style].push(positions);
      } else {
        sets[style].push(segment.positions);
      }

    }
    // console.timeEnd('PointExpansion')

    // console.log(addedPoints); //, sets);

    for (const key of Object.keys(sets)) {
      const set = sets[key];

      const style = DeckTypes.Styles.getStyle(key as DeckTypes.SegmentStyle);

      if ((key as DeckTypes.SegmentStyle).indexOf('uncertain') === 0) {
        const filteredSets = sets[key].filter((s) => s.length > 1);
        if (style.dark.back !== undefined && style.dark.thickness.back !== undefined) {
          const arcBack = new ArcLayer<DeckTypes.Position[]>({
            id: style.ordering + 'b_uncertain-' + this.layerID,
            data: filteredSets,
            greatCircle: true,
            getHeight: 0,
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

        const arcFront = new ArcLayer<DeckTypes.Position[]>({
          id: style.ordering + 'f_uncertain-' + this.layerID,
          data: set,
          greatCircle: true,
          getHeight: 0,
          getSourcePosition: ((d) => d[0]),
          getTargetPosition: ((d) => d[1]),
          getSourceColor: this.root.usingDarkMode ? style.dark.front : style.light.front,
          getTargetColor: this.root.usingDarkMode ? style.dark.front : style.light.front,
          getWidth: this.root.usingDarkMode ? style.dark.thickness.front : style.light.thickness.front,
          widthUnits: 'pixels',
        });
        this.layers.push(arcFront);
      } else if ((key as DeckTypes.SegmentStyle).indexOf('plan') === 0) {
        if (!this.props.showFlightPlan) continue;
        let positions: [DeckTypes.Position, DeckTypes.Position][] = [];
        for (const s of set) {
          if (s.length < 2) continue;
          let lastPosition = s[0];
          const posList: [DeckTypes.Position, DeckTypes.Position][] = [];
          for (let i = 1; i < s.length; i++) {
            posList.push([lastPosition, s[i]]);
            lastPosition = s[i];
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
          this.layers.push(
            new PathLayer<DeckTypes.Position[]>({
              id: style.ordering + key + '_back-' + this.layerID,
              data: set,
              getColor: this.root.usingDarkMode ? style.dark.back : style.light.back,
              getPath: (d) => d,
              getPolygonOffset: ({layerIndex}) => [0, -layerIndex * 21000], // TODO: This seems like a hack to get culling to work. @see https://deck.gl/docs/api-reference/core/layer#getpolygonoffset.
              getWidth: this.root.usingDarkMode ? style.dark.thickness.back : style.light.thickness.back,
              visible: !this.props.hidden,
              capRounded: true,
              jointRounded: true,
              widthUnits: 'pixels',
            })
          );
        }

        this.layers.push(
          new PathLayer<DeckTypes.Position[]>({
            id: style.ordering + key + '_front-' + this.layerID,
            data: set,
            getColor: this.root.usingDarkMode ? style.dark.front : style.light.front,
            getPath: (d) => d,
            getPolygonOffset: ({layerIndex}) => [0, -layerIndex * 21000], // TODO: This seems like a hack to get culling to work. @see https://deck.gl/docs/api-reference/core/layer#getpolygonoffset.
            getWidth: this.root.usingDarkMode ? style.dark.thickness.front : style.light.thickness.front,
            visible: !this.props.hidden,
            capRounded: true,
            jointRounded: true,
            widthUnits: 'pixels',
          })
        );
      }
    }

    this.layers.sort((a, b) => parseInt(a.id.charAt(0)) - parseInt(b.id.charAt(0)))


    this.root.updateLayer(this.id, this.layers);
    if (this.props.triggerCameraMove) this.translateTo();
  }

  translateTo() {
    let lat = {
      min: 90,
      max: -90
    }
    let lon = {
      min: 180,
      max: -180
    }
    for (const seg of this.props.leg.segments) {
      // Skip this segment if it is the flight plan. We don't want to zoom based on that.
      if (seg.style === 'plan') continue;
      for (const pos of seg.positions) {
        if (pos[0] < lon.min) lon.min = pos[0];
        if (pos[0] > lon.max) lon.max = pos[0];
        if (pos[1] < lat.min) lat.min = pos[1];
        if (pos[1] > lat.max) lat.max = pos[1];
      }
    }
    this.root.translateTo([[lon.min, lat.min], [lon.max, lat.max]]);
  }

}