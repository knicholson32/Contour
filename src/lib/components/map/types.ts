import type * as Types from '@prisma/client';

export namespace Overview {
  export const VisitedAirportSelect = { id: true, latitude: true, longitude: true, name: true };
  export type VisitedAirport = Types.Prisma.AirportGetPayload<{ select: typeof VisitedAirportSelect }>;
  export type Leg = { id: string, start: [number, number], end: [number, number], apt: { start: string, end: string }, segments: number };
}