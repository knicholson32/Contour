import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API, ImageUploadState } from '$lib/types';
import { CategoryClass, EngineType, GearType } from '@prisma/client';
import { categoryClassToString, engineTypeToString, gearTypeToString } from '$lib/types/prisma';
import { delay } from '$lib/helpers/index.js';
import { v4 as uuidv4 } from 'uuid';

import * as helpers from '$lib/server/helpers';

const MAX_MB = 10;

export const load = async ({ fetch, params }) => {

  const entrySettings = await settings.getSet('entry');

  console.log(params);

  const types = await prisma.aircraftType.findMany({ select: { typeCode: true, make: true, model: true, catClass: true, id: true, imageId: true, _count: true }, orderBy: [{ make: 'asc' }, { model: 'asc' }] });
  if (params.id === undefined) {
    if (types.length > 0) throw redirect(301, '/aircraft/type/' + types[0].id + '?active=menu')
    else throw redirect(301, '/aircraft/type/new')
  }

  const currentType = await prisma.aircraftType.findUnique({ where: { id: params.id } });
  if (params.id !== 'new' && currentType === null) throw redirect(301, '/aircraft/type/new');

  let orderGroups: { make: string, types: (typeof types[0])[] }[] = []
  let currentMake = '';
  let currentGroup: (typeof types[0])[] = []
  for (const type of types) {
    if (type.make.trim().toLocaleUpperCase() !== currentMake) {
      if (currentMake !== '') orderGroups.push({ make: currentMake, types: currentGroup });
      currentMake = type.make.trim().toLocaleUpperCase();
      currentGroup = [];
    }
    currentGroup.push(type);
  }
  if (currentMake !== '') orderGroups.push({ make: currentMake, types: currentGroup });

  return {
    entrySettings,
    types,
    type: currentType,
    orderGroups,
    params,
    enums: {
      categoryClass: Object.keys(CategoryClass).map((v) => { return { value: v, title: `${categoryClassToString(v as CategoryClass)} (${v})` }; }),
      gearType: Object.keys(GearType).map((v) => { return { value: v, title: `${gearTypeToString(v as GearType)} (${v})` }; }),
      engineType: Object.keys(EngineType).map((v) => { return { value: v, title: `${engineTypeToString(v as EngineType)} (${v})` }; }),
    }
  }
}

export const actions = {
  createOrModify: async ({ request, params }) => {

    const id = (params.id !== 'new' ? params.id : undefined) ?? uuidv4();


    const data = await request.formData();
    await delay(500);
    for (const key of data.keys()) {
      console.log(key, data.getAll(key));
    }
    const typeCode = data.get('typeCode');
    const subCode = data.get('subCode');
    const make = data.get('make');
    const model = data.get('model');
    const catClass = data.get('catClass');
    const gear = data.get('gear');
    const engine = data.get('engine');
    const complex = data.get('complex');
    const taa = data.get('taa');
    const highPerformance = data.get('highPerformance');
    const pressurized = data.get('pressurized');
    const image = data.get('image');
    const imageState = data.get('image-state');
    if (typeCode === null || typeCode === '') return API.Form.formFailure('?/default', 'typeCode', 'Required field');
    if (make === null || make === '') return API.Form.formFailure('?/default', 'make', 'Required field');
    if (model === null || model === '') return API.Form.formFailure('?/default', 'model', 'Required field');
    if (catClass === null || catClass === '') return API.Form.formFailure('?/default', 'catClass', 'Required field');
    if (gear === null || gear === '') return API.Form.formFailure('?/default', 'gear', 'Required field');
    if (engine === null || engine === '') return API.Form.formFailure('?/default', 'engine', 'Required field');
    if (complex === null || complex === '') return API.Form.formFailure('?/default', 'complex', 'Required field');
    if (taa === null || taa === '') return API.Form.formFailure('?/default', 'taa', 'Required field');
    if (highPerformance === null || highPerformance === '') return API.Form.formFailure('?/default', 'highPerformance', 'Required field');
    if (pressurized === null || pressurized === '') return API.Form.formFailure('?/default', 'pressurized', 'Required field');

    if (params.id === 'new') {
      try {
        const data = {
          id,
          typeCode: (typeCode as string).toLocaleUpperCase(),
          subCode: (subCode as string).toLocaleUpperCase(),
          make: make as string,
          model: model as string,
          catClass: catClass as CategoryClass,
          gear: gear as GearType,
          engine: engine as EngineType,
          complex: complex === 'true',
          taa: taa === 'true',
          highPerformance: highPerformance === 'true',
          pressurized: pressurized === 'true',
        };
        console.log('create', data);
        await prisma.aircraftType.create({ data });
      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', '*', 'Aircraft already exists');
      }
    } else {
      try {
        const data = {
          id,
          typeCode: (typeCode as string).toLocaleUpperCase(),
          subCode: (subCode as string).toLocaleUpperCase(),
          make: make as string,
          model: model as string,
          catClass: catClass as CategoryClass,
          gear: gear as GearType,
          engine: engine as EngineType,
          complex: complex === 'true',
          taa: taa === 'true',
          highPerformance: highPerformance === 'true',
          pressurized: pressurized === 'true',
        };
        console.log('update', data);
        await prisma.aircraftType.update({ where: { id }, data });
      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', '*', 'An unknown error occurred. See logs.');
      }
    }

    try {

      if (imageState === ImageUploadState.UPDATE) {
        if (image !== null && image !== '' && !(image instanceof File && image.size === 0)) {
          const results = await helpers.uploadImage(image, MAX_MB);
          if (results.success !== true) return API.Form.formFailure('?/default', 'image', results.message);

          try {
            await prisma.aircraftType.update({ where: { id }, data: { imageId: results.id } });
          } catch (e) {
            console.log('Error adding image to aircraft type', e);
            return API.Form.formFailure('?/default', 'image', 'Could not add image to aircraft type');
          }
        }
      } else if (imageState === ImageUploadState.DELETE) {
        const imageId = await prisma.aircraftType.findUnique({ where: { id }, select: { imageId: true }});
        if (imageId?.imageId !== null && imageId?.imageId !== undefined) {
          await prisma.aircraftType.update({ where: { id }, data: { imageId: null }, select: { id: true } });
          await prisma.image.delete({ where: { id: imageId.imageId }});
        }
      }
    } catch (e) {
      console.log('Error uploading image to aircraft type', e);
      return API.Form.formFailure('?/default', 'image', 'Could not add image to aircraft type');
    }

    // Clear any hanging images
    await helpers.clearHangingImages()

    throw redirect(301, '/aircraft/type/' + id + '?active=form');
    // return API.Form.formSuccess('?/default');
  },
  delete: async ({ request, params }) => {

    const data = await request.formData();
    const id = data.get('id');
    if (id === null || id === '') return API.Form.formFailure('?/delete', 'id', 'Required field');
    await delay(500);

    try {
      await prisma.aircraftType.delete({ where: { id: id as string }});
    } catch (e) {
      console.log('Error deleting aircraft type', e);
      return API.Form.formFailure('?/default', '*', 'Could not delete. Aircraft of this type still exist.');
    }
    
    // Clear any hanging images
    await helpers.clearHangingImages()

    // Done!
    throw redirect(301, '/aircraft/type');
  },
};