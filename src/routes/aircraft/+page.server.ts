import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { CategoryClass, EngineType, GearType, Prisma } from '@prisma/client';
import { categoryClassToString, engineTypeToString, gearTypeToString } from '$lib/types/prisma';
import { delay } from '$lib/helpers/index.js';
import { v4 as uuidv4 } from 'uuid';

export const load = async ({ fetch, params }) => {

  const entrySettings = await settings.getSet('entry');

  const findMany = { include: { type: true } };
  type AC = (Prisma.AircraftGetPayload<{ include: { type: true } }> & { imageBase64: string | undefined })[];

  let aircraft: AC = await prisma.aircraft.findMany({ include: { type: true } }) as AC;

  for (const a of aircraft) {
    if (a.imageId !== null) {
      const r = await fetch(`/api/image/${a.imageId}/128`);
      const STRING_CHAR = (new Uint8Array(await (r).arrayBuffer())).reduce((data, byte) => data + String.fromCharCode(byte), '');
      a.imageBase64 = `data:${r.headers.get('content-type') ?? 'image/jpg'};base64, ` + btoa(STRING_CHAR);
    } else if (a.type.imageId !== null) {
      const r = await fetch(`/api/image/${a.type.imageId}/128`);
      const STRING_CHAR = (new Uint8Array(await (r).arrayBuffer())).reduce((data, byte) => data + String.fromCharCode(byte), '');
      a.imageBase64 = `data:${r.headers.get('content-type') ?? 'image/jpg'};base64, ` + btoa(STRING_CHAR);
    }
  }

  return {
    entrySettings,
    aircraft,
    enums: {
      categoryClass: Object.keys(CategoryClass).map((v) => { return { value: v, title: `${categoryClassToString(v as CategoryClass)} (${v})` }; }),
      gearType: Object.keys(GearType).map((v) => { return { value: v, title: `${gearTypeToString(v as GearType)} (${v})` }; }),
      engineType: Object.keys(EngineType).map((v) => { return { value: v, title: `${engineTypeToString(v as EngineType)} (${v})` }; }),
    }
  }
}

export const actions = {
  default: async ({ request }) => {


  }
};
