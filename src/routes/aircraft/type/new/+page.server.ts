import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { CategoryClass, EngineType, GearType } from '@prisma/client';
import { categoryClassToString, engineTypeToString, gearTypeToString } from '$lib/types/prisma';
import { delay } from '$lib/helpers/index.js';
import { v4 as uuidv4 } from 'uuid';
import * as helpers from '$lib/server/helpers';

const MAX_MB = 10;

export const load = async ({ fetch, params }) => {

  const entrySettings = await settings.getSet('entry');

  return {
    entrySettings,
    enums: {
      categoryClass: Object.keys(CategoryClass).map((v) => { return { value: v, title: `${categoryClassToString(v as CategoryClass)} (${v})` }; }),
      gearType: Object.keys(GearType).map((v) => { return { value: v, title: `${gearTypeToString(v as GearType)} (${v})` }; }),
      engineType: Object.keys(EngineType).map((v) => { return { value: v, title: `${engineTypeToString(v as EngineType)} (${v})` }; }),
    },
    MAX_MB
  }
}

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    await delay(500);
    const type = data.get('type');
    const subType = data.get('subType');
    const make = data.get('make');
    const model = data.get('model');
    const catClass = data.get('catClass');
    const gear = data.get('gear');
    const engine = data.get('engine');
    const complex = data.get('complex');
    const taa = data.get('taa');
    const hp = data.get('hp');
    const press = data.get('press');
    const image = data.get('image');
    if (type === null || type === '') return API.Form.formFailure('?/default', 'type', 'Required field');
    if (make === null || make === '') return API.Form.formFailure('?/default', 'make', 'Required field');
    if (model === null || model === '') return API.Form.formFailure('?/default', 'model', 'Required field');
    if (catClass === null || catClass === '') return API.Form.formFailure('?/default', 'catClass', 'Required field');
    if (gear === null || gear === '') return API.Form.formFailure('?/default', 'gear', 'Required field');
    if (engine === null || engine === '') return API.Form.formFailure('?/default', 'engine', 'Required field');
    if (complex === null || complex === '') return API.Form.formFailure('?/default', 'complex', 'Required field');
    if (taa === null || taa === '') return API.Form.formFailure('?/default', 'taa', 'Required field');
    if (hp === null || hp === '') return API.Form.formFailure('?/default', 'hp', 'Required field');
    if (press === null || press === '') return API.Form.formFailure('?/default', 'press', 'Required field');

    const id = uuidv4();

    try {
      const data = {
        id,
        typeCode: type as string,
        subCode: subType as string,
        make: make as string,
        model: model as string,
        catClass: catClass as CategoryClass,
        gear: gear as GearType,
        engine: engine as EngineType,
        complex: complex === 'true',
        taa: taa === 'true',
        highPerformance: hp === 'true',
        pressurized: press === 'true',
      };
      console.log('create', data);
      await prisma.aircraftType.create({ data });
    } catch (e) {
      console.log(e);
      return API.Form.formFailure('?/default', '*', 'Aircraft already exists');
    }

    if (image !== null && image !== '') {
      const results = await helpers.uploadImage(image, MAX_MB);
      if (results.success !== true) return API.Form.formFailure('?/default', 'image', results.message);

      try {
        await prisma.aircraftType.update({ where: { id }, data: { imageId: results.id } });
      } catch (e) {
        try {
          await prisma.aircraftType.delete({ where: { id: type as string } });
        } catch (e) { }
        console.log('Error adding image to aircraft type', e);
        return API.Form.formFailure('?/default', 'image', 'Could not add image to aircraft type');
      }
    }

    throw redirect(301, '/aircraft/type');

  }
};
