import { hexToRgb } from '$lib/helpers';
import type * as Types from '@prisma/client';

// Airports
export const AirportSelect = { id: true, latitude: true, longitude: true };
export type Airport = (Types.Prisma.AirportGetPayload<{ select: typeof AirportSelect }> & { priority?: number });
export type Airports = Airport[];

// Legs
export type Position = [number, number];
export type SegmentStyle = 'norm' | 'uncertain' | 'uncertain-highlight' | 'uncertain-dim' | 'alternate' | 'plan' | 'highlight' | 'dim' | 'deadhead';
export type Segment = {positions: Position[], style: SegmentStyle}
export type LegProcess = { id: string, start: [number, number], end: [number, number], apt: { start: string, end: string }, segments: number };
export type Leg = { id: string, segments: Segment[] };
export type Legs = Leg[];

export type Padding = {
  left?: number,
  right?: number,
  top?: number,
  bottom?: number,
}

export type Color = [number, number, number] | [number, number, number, number] | undefined;
export type Style = { 
  light: {
    front: Color,
    back?: Color,
    thickness: {
      front: number,
      back?: number
    },
  },
  dark: {
    front: Color,
    back?: Color,
    thickness: {
      front: number,
      back?: number
    },
  },
  ordering: number
};

export namespace Styles {

  export const getStyle = (_style: SegmentStyle): Style => {
    switch (_style) {
      case 'highlight': // HIGHLIGHT ------------------------------------
        return { 
          light: {
            front: hexToRgb('#ec4899'), // Pink 500
            back: hexToRgb('#9d174d'), // Pink 800
            thickness: {
              front: 1,
              back: 3
            },
          },
          dark: {
            front: hexToRgb('#ec4899'), // Pink 500
            back: hexToRgb('#000000'), // Black
            thickness: {
              front: 3,
              back: 5
            },
          },
          ordering: 7
        };
      case 'norm': // NORM ----------------------------------------------
        return { 
          light: {
            front: hexToRgb('#38bdf8'), // Sky 600
            back: [...hexToRgb('#164e63'), 200], // Sky 600
            thickness: {
              front: 1,
              back: 3
            },
          },
          dark: {
            front: hexToRgb('#7dd3fc'), // Sky 300
            back: hexToRgb('#0c4a6e'), // Sky 900
            thickness: {
              front: 1,
              back: 3
            },
          },
          ordering: 6
        };
      case 'deadhead': // DEADHEAD ----------------------------------------
        return { 
          light: {
            front: hexToRgb('#ec4809'),
            thickness: {
              front: 3,
            },
          },
          dark: {
            front: hexToRgb('#ec4809'),
            thickness: {
              front: 3,
            },
          },
          ordering: 5
        };
      case 'dim': // DIM ------------------------------------------------
        return { 
          light: {
            front: [...hexToRgb('#94a3b8'), 80], // Slate 400
            thickness: {
              front: 1,
            },
          },
          dark: {
            front: [...hexToRgb('#94a3b8'), 80], // Slate 400
            thickness: {
              front: 1,
            },
          },
          ordering: 5
        };
      case 'plan': // PLAN ----------------------------------------------
        return { 
          light: {
            front: [...hexToRgb('#94a3b8'), 80], // Slate 400
            thickness: {
              front: 1,
            },
          },
          dark: {
            front: [...hexToRgb('#94a3b8'), 80], // Slate 400
            thickness: {
              front: 1,
            },
          },
          ordering: 4
        };
      case 'uncertain': // UNCERTAIN ------------------------------------
        return { 
          light: {
            front: [...hexToRgb('#475569'), 100], // Slate 600
            back: [...hexToRgb('#475569'), 10], // Slate 600
            thickness: {
              front: 1,
              back: 4,
            },
          },
          dark: {
            front: [...hexToRgb('#94a3b8'), 80], // Slate 400
            back: [...hexToRgb('#075985'), 50], // Sky 800
            thickness: {
              front: 1,
              back: 4,
            },
          },
          ordering: 3
        };
      case 'uncertain-highlight': // UNCERTAIN-HIGHLIGHT ----------------
        return { 
          light: {
            front: [...hexToRgb('#ec4899'), 200], // Pink 500
            back: [...hexToRgb('#000000'), 50], // Black
            thickness: {
              front: 3,
            },
          },
          dark: {
            front: [...hexToRgb('#ec4899'), 100], // Pink 500
            back: [...hexToRgb('#000000'), 50], // Black
            thickness: {
              front: 3,
            },
          },
          ordering: 7
        };
      case 'uncertain-dim': // UNCERTAIN-DIM ----------------------------
        return { 
          light: {
            front: [...hexToRgb('#475569'), 80], // Slate 400
            thickness: {
              front: 1,
            },
          },
          dark: {
            front: [...hexToRgb('#94a3b8'), 80], // Slate 400
            thickness: {
              front: 1,
            },
          },
          ordering: 5
        };
      case 'alternate': // ALTERNATE ------------------------------------
        return { 
          light: {
            front: [...hexToRgb('#d97706')], // Amber 400
            back: [...hexToRgb('#b45309')], // Amber 700
            thickness: {
              front: 1,
              back: 3
            },
          },
          dark: {
            front: [...hexToRgb('#fbbf24')], // Amber 400
            back: [...hexToRgb('#b45309'), 50], // Amber 700
            thickness: {
              front: 1,
              back: 4
            },
          },
          ordering: 2
        };
      default:
        throw new Error(`Unknown segment style: ${_style}`);
    }
  }


  // export const Uncertain: Style = { 
  //   light: {
  //     front: hexToRgb('#94a3b8'), // Slate 400
  //     back: hexToRgb('#0f172a'), // Slate 900
  //   },
  //   dark: {
  //     front: hexToRgb('#94a3b8'), // Slate 400
  //     back: hexToRgb('#0f172a'), // Slate 900
  //   },
  //   thickness: {
  //     front: 1,
  //     back: 2
  //   }
  // };





}