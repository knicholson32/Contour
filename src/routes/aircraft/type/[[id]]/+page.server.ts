import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API, ImageUploadState } from '$lib/types';
import { delay } from '$lib/helpers/index.js';
import { v4 as uuidv4 } from 'uuid';
import { DB } from '$lib/types';

import * as helpers from '$lib/server/helpers';
import Fuse from 'fuse.js';

const MAX_MB = 10;

export const load = async ({ fetch, params, url }) => {

  const entrySettings = await settings.getSet('entry');

  let types = await prisma.aircraftType.findMany({ select: { typeCode: true, make: true, model: true, catClass: true, id: true, imageId: true, _count: true }, orderBy: [{ make: 'asc' }, { model: 'asc' }] });
  if (params.id === undefined) {
    if (types.length > 0) redirect(301, '/aircraft/type/' + types[0].id + '?active=menu');
    else redirect(301, '/aircraft/type/new' + url.search);
  }

  let search = url.searchParams.get('search');
  if (search === '') search = null;
  if (search !== null) {
    const fuseOptions = {
      // isCaseSensitive: false,
      // includeScore: false,
      shouldSort: false,
      // includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      threshold: 0.3,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      keys: [
        "make",
        "model",
        "typeCode"
      ]
    };
    const fuse = new Fuse(types, fuseOptions);
    types = fuse.search(search).flatMap((v) => v.item);
  }

  const currentType = await prisma.aircraftType.findUnique({ where: { id: params.id } });
  if (params.id !== 'new' && currentType === null) redirect(301, '/aircraft/type/new');

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

  const legs = await prisma.leg.findMany({ where: { aircraft: { aircraftTypeId: params.id } }, select: { totalTime: true, diversionAirportId: true }});

  let totalTime = 0;
  let numDiversions = 0;
  for (const l of legs) {
    totalTime += l.totalTime;
    if (l.diversionAirportId !== null) numDiversions++;
  }


  return {
    entrySettings,
    types,
    type: currentType,
    orderGroups,
    numLegs: legs.length,
    numDiversions,
    totalTime,
    enums: {
      categoryClass: Object.keys(DB.CategoryClass).map((v) => { return { value: v, title: `${DB.categoryClassToString(v as DB.CategoryClass)} (${v})` }; }),
      gearType: Object.keys(DB.GearType).map((v) => { return { value: v, title: `${DB.gearTypeToString(v as DB.GearType)} (${v})` }; }),
      engineType: Object.keys(DB.EngineType).map((v) => { return { value: v, title: `${DB.engineTypeToString(v as DB.EngineType)} (${v})` }; }),
    }
  }
}

export const actions = {
  createOrModify: async ({ request, params, url }) => {

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
    let typeRatingRequired = data.get('typeRatingRequired');
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

    if (typeRatingRequired === null) typeRatingRequired = engine !== null && (engine as string).startsWith('T') ? 'true' : 'false';

    // Check enums
    if (!DB.validate.categoryClass(catClass as string)) return API.Form.formFailure('?/default', 'catClass', 'Invalid selection');
    if (!DB.validate.gearType(gear as string)) return API.Form.formFailure('?/default', 'gear', 'Invalid selection');
    if (!DB.validate.engineType(engine as string)) return API.Form.formFailure('?/default', 'engine', 'Invalid selection');

    if (params.id === 'new') {
      try {
        const data = {
          id,
          typeCode: (typeCode as string).toLocaleUpperCase(),
          subCode: (subCode as string).toLocaleUpperCase(),
          make: make as string,
          model: model as string,
          catClass: catClass as string,
          gear: gear as string,
          engine: engine as string,
          complex: complex === 'true',
          taa: taa === 'true',
          highPerformance: highPerformance === 'true',
          pressurized: pressurized === 'true',
          typeRatingRequired: typeRatingRequired === 'true'
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
          catClass: catClass as string,
          gear: gear as string,
          engine: engine as string,
          complex: complex === 'true',
          taa: taa === 'true',
          highPerformance: highPerformance === 'true',
          pressurized: pressurized === 'true',
          typeRatingRequired: typeRatingRequired === 'true'
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

    
    const ref = url.searchParams.get('ref');
    console.log('ref', ref);
    if (ref !== null) redirect(301, ref);
    else redirect(301, '/aircraft/type/' + id + '?active=form');
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
    redirect(301, '/aircraft/type');
  },
};