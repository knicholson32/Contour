import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { CategoryClass, EngineType, GearType } from '@prisma/client';
import { categoryClassToString, engineTypeToString, gearTypeToString } from '$lib/types/prisma';
import { delay } from '$lib/helpers/index.js';
import { v4 as uuidv4 } from 'uuid';

export const load = async ({ fetch, params }) => {

  const entrySettings = await settings.getSet('entry');

  return {
    entrySettings,
    types: await prisma.aircraftType.findMany()
  }
}

export const actions = {
  default: async ({ request }) => {


  }
};
