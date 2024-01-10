import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { delay } from '$lib/helpers';
import { v4 as uuidv4 } from 'uuid';
import * as helpers from '$lib/server/helpers';

const MAX_MB = 10;

export const load = async ({ fetch, url }) => {

  const entrySettings = await settings.getSet('entry');

  // if (entrySettings['entry.tour.current'] === -1) {
  //   const tour = await prisma.tour.create({ data: { }});
  //   await settings.set('entry.tour.current', tour.id);
  // }
  // if (entrySettings['entry.day.current'] === -1) throw redirect(302, '/entry/new');
  // throw redirect(302, '/entry/overview');

  const types = await prisma.aircraftType.findMany();
  const typeOptions: { title: string; value: string; unset?: boolean }[] = []

  for (const t of types) {
    typeOptions.push({
      title: t.typeCode + ` (${t.model})`,
      value: t.id
    });
  }

  // Get all tail numbers (so we know if one exists)
  const tails = (await prisma.aircraft.findMany({ select: { registration: true } })).map((v) => v.registration);

  return {
    entrySettings,
    typeOptions: typeOptions,
    types,
    tails,
    MAX_MB,
    regDefault: url.searchParams.get('reg')
  }
}

export const actions = {
  default: async ({ request, url }) => {

    const data = await request.formData();
    await delay(500);
    const type = data.get('type');
    const tail = data.get('tail');
    const year = data.get('year');
    const serial = data.get('serial');
    const sim = data.get('sim');
    const advanced = data.get('advanced');
    const complex = data.get('complex');
    const taa = data.get('taa');
    const hp = data.get('hp');
    const press = data.get('press');
    const imageClear = data.get('image-clear');
    const imageIsDefault = data.get('image-isDefault');
    const image = data.get('image');
    const notes = data.get('notes');
    if (type === null || type === '') return API.Form.formFailure('?/default', 'type', 'Required field');
    if (tail === null || tail === '') return API.Form.formFailure('?/default', 'tail', 'Required field');
    if (sim === null || sim === '') return API.Form.formFailure('?/default', 'sim', 'Required field');
    const isAdvanced = advanced !== null && advanced !== '' && advanced as string === 'true';
    if (isAdvanced) {
      if (complex === null || complex === '') return API.Form.formFailure('?/default', 'complex', 'Required field (modify defaults is active)');
      if (taa === null || taa === '') return API.Form.formFailure('?/default', 'taa', 'Required field (modify defaults is active)');
      if (hp === null || hp === '') return API.Form.formFailure('?/default', 'hp', 'Required field (modify defaults is active)');
      if (press === null || press === '') return API.Form.formFailure('?/default', 'press', 'Required field (modify defaults is active)');
    }
    const typeDB = await prisma.aircraftType.findUnique({ where: { id: type as string } });
    if (typeDB === null) {
      return API.Form.formFailure('?/default', 'type', 'Type does not exist. Pick another type.');
    }

    if (await prisma.aircraft.findUnique({ where: { registration: tail as string }}) !== null) {
      return API.Form.formFailure('?/default', 'tail', 'Aircraft already exists');
    }

    try {
      const result = await prisma.aircraft.create({ data: {
        registration: (tail as string).toLocaleUpperCase(),
        aircraftTypeId: type as string,
        year: (year === null || year === '' || isNaN(parseInt(year as string))) ? null : parseInt(year as string),
        serial: (serial === null || serial === '') ? null : serial as string,
        simulator: (sim as string) === 'true',
        complex: isAdvanced && complex !== null && complex !== '' ? complex as string === 'true' : null,
        taa: isAdvanced && taa !== null && taa !== '' ? taa as string === 'true' : null,
        highPerformance: isAdvanced && hp !== null && hp !== '' ? hp as string === 'true' : null,
        pressurized: isAdvanced && press !== null && press !== '' ? press as string === 'true' : null,
        notes: (notes === null || notes === '') ? null : notes as string
      }});
    } catch (e) {
      console.log('error creating new aircraft', e);
      return API.Form.formFailure('?/default', '*', 'Error saving data. See logs.');
    }

    if (image !== null && image !== '' && !(imageIsDefault !== null && imageIsDefault !== '' && imageIsDefault === 'true')) {
      const results = await helpers.uploadImage(image, MAX_MB);
      if (results.success !== true) return API.Form.formFailure('?/default', 'image', results.message);

      try {
        await prisma.aircraft.update({ where: { registration: tail as string}, data: { imageId: results.id }});
      } catch(e) {
        try {
          await prisma.aircraft.delete({ where: { registration: tail as string }});
        } catch (e) {}
        console.log('Error adding image to aircraft', e);
        return API.Form.formFailure('?/default', 'image', 'Could not add image to aircraft');
      }
    }
    const ref = url.searchParams.get('ref');
    if (ref !== null) throw redirect(301, ref);
    else throw redirect(301, '/aircraft');

  }

};