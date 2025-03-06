import { redirect } from '@sveltejs/kit';
import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API, ImageUploadState } from '$lib/types';
import { DB } from '$lib/types';
import { delay } from '$lib/helpers/index.js';
import type * as Types from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import Fuse from 'fuse.js';

import * as helpers from '$lib/server/helpers';
import { generateDeadheads } from '$lib/server/db/deadhead.js';

const MAX_MB = 10;

export const load = async ({ fetch, params, url }) => {

  const entrySettings = await settings.getSet('entry');
  // const debug = await settings.get('system.debug');

  let aircrafts = await prisma.aircraft.findMany({ include: { type: true, _count: true, legs: { select: { totalTime: true } } }, orderBy: [{ type: { typeCode: 'asc' } }, { registration: 'asc' }] });

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
        "registration",
        "type.make",
        "type.model",
        "type.typeCode",
        "serial",
        "year",
        "notes",
      ]
    };

    const fuse = new Fuse(aircrafts, fuseOptions);
    aircrafts = fuse.search(search).flatMap((v) => v.item);
    if (params.id === undefined) {
      if (aircrafts.length > 0) redirect(301, '/aircraft/entry/' + aircrafts[0].registration + '?active=menu&search=' + search);
      else redirect(301, '/aircraft/entry/new');
    }
  } else {
    if (params.id === undefined) {
      if (aircrafts.length > 0) redirect(301, '/aircraft/entry/' + aircrafts[0].registration + '?active=menu');
      else redirect(301, '/aircraft/entry/new');
    }
  }

  const aircraftTimes: { [key: string]: string } = {};
  for (const ac of aircrafts) {
    const legTimes = ac.legs.map((v) => v.totalTime);
    if (legTimes.length !== 0) aircraftTimes[ac.id] = (legTimes.reduce((p, c) => p + c)).toFixed(1);
    else aircraftTimes[ac.id] = (0).toFixed(1);
  }


  let currentAircraft = await prisma.aircraft.findUnique({ where: { id: params.id }, include: { type: true, _count: true, legs: { select: { totalTime: true, diversionAirportId: true } } } });
  if (currentAircraft === null) currentAircraft = await prisma.aircraft.findUnique({ where: { registration: params.id.toUpperCase() }, include: { type: true, _count: true, legs: { select: { totalTime: true, diversionAirportId: true } } } });
  if (params.id !== 'new' && currentAircraft === null) redirect(301, '/aircraft/entry/new');

  // TODO: Remove this database auto-mod
  if (currentAircraft?.simulator === true && currentAircraft.simulatorType === null) {
    await prisma.aircraft.update({ where: { id: currentAircraft.id }, data: { simulatorType: 'ATD' }});
    currentAircraft.simulatorType = 'ATD';
  }

  let orderGroups: { typeCode: string, regs: (typeof aircrafts[0])[] }[] = []
  let currentType = '';
  let currentGroup: (typeof aircrafts[0])[] = []
  for (const ac of aircrafts) {
    if (ac.type.typeCode.trim().toLocaleUpperCase() !== currentType) {
      if (currentType !== '') orderGroups.push({ typeCode: currentType, regs: currentGroup });
      currentType = ac.type.typeCode.trim().toLocaleUpperCase();
      currentGroup = [];
    }
    currentGroup.push(ac);
  }
  if (currentType !== '') orderGroups.push({ typeCode: currentType, regs: currentGroup });

  const types = await prisma.aircraftType.findMany();
  const typeOptions: { title: string; value: string; unset?: boolean }[] = [];
  const simTypeOptions: { title: string; value: string; unset?: boolean }[] = [
    { title: 'FFS', value: 'FFS' },
    { title: 'FTD', value: 'FTD' },
    { title: 'ATD', value: 'ATD' },
  ];

  for (const t of types) {
    typeOptions.push({
      title: t.typeCode + ` (${t.model})`,
      value: t.id
    });
  }

  let avgLegLen = 0;
  let diversionPercent = 0;
  if (currentAircraft !== null) {
    for (const leg of currentAircraft.legs) {
      avgLegLen += leg.totalTime;
      if (leg.diversionAirportId !== null) diversionPercent++;
    }
    avgLegLen = currentAircraft.legs.length === 0 ? 0 : avgLegLen / currentAircraft.legs.length;
    diversionPercent = currentAircraft.legs.length === 0 ? 0 : diversionPercent / currentAircraft.legs.length;
  }

  let lookupYear: string | null = null;
  let lookupSerial: string | null = null;


  if (currentAircraft !== null) {
    const res = await (await fetch(`/api/aircraft/faa/${currentAircraft.registration}`)).json() as API.Response;
    if (res.ok === true) {
      const regInfo = res as API.FAAReg;
      lookupYear = regInfo.aircraft.manufactureYear.toFixed(0);
      lookupSerial = regInfo.aircraft.serial;
    }
  }

  // Get all tail numbers (so we know if one exists)
  const tails = aircrafts.map((v) => v.registration);
  return {
    entrySettings,
    aircrafts,
    aircraftTimes,
    aircraft: currentAircraft,
    typeOptions,
    simTypeOptions,
    orderGroups,
    avgLegLen,
    lookupYear,
    lookupSerial,
    diversionPercent,
    tails,
    types,
    params,
    regDefault: url.searchParams.get('reg'),
    enums: {
      categoryClass: DB.categoryClassObj.map((v) => { return { value: v, title: `${DB.categoryClassToString(v as DB.CategoryClass)} (${v})` }; }),
      gearType: DB.gearTypeObj.map((v) => { return { value: v, title: `${DB.gearTypeToString(v as DB.GearType)} (${v})` }; }),
      engineType: DB.engineTypeObj.map((v) => { return { value: v, title: `${DB.engineTypeToString(v as DB.EngineType)} (${v})` }; }),
    }
  }
}

export const actions = {
  createOrModify: async ({ request, params, url }) => {

    let id = (params.id !== 'new' ? params.id : undefined) ?? uuidv4();

    const debug = await settings.get('system.debug');

    const data = await request.formData();
    if (debug) for (const key of data.keys()) console.log(key, data.getAll(key));

    if (params.id !== 'new' && await prisma.aircraft.findUnique({ where: { id } }) === null) {
      // This is probably a registration. Get the ID based on registration
      const aircraft = await prisma.aircraft.findUnique({ where: { registration: params.id } });
      if (aircraft === null) return API.Form.formFailure('?/default', '*', 'Aircraft does not exist');
      id = aircraft.id;
    }

    // return API.Form.formFailure('?/default', 'tail', 'Required field');
    
    const type = data.get('type');
    const tail = data.get('tail');
    let year = data.get('year');
    let serial = data.get('serial');
    const sim = data.get('sim');
    const simType = data.get('sim-type') ?? 'ATD';
    const complex = data.get('complex');
    const taa = data.get('taa');
    const hp = data.get('hp');
    const press = data.get('press');
    const image = data.get('image');
    const imageState = data.get('image-state');
    let notes = data.get('notes');
    if (type === null || type === '') return API.Form.formFailure('?/default', 'type', 'Required field');
    if (tail === null || tail === '') return API.Form.formFailure('?/default', 'tail', 'Required field');
    // Assign year to null if it was not filled
    if (year === '') year = null;
    if (serial === '') serial = null;
    if (notes === '') notes = null;
    if (year !== null && isNaN(parseInt(year as string))) return API.Form.formFailure('?/default', 'year', 'Invalid year');

    if (params.id === 'new') {
      try {
        const data = {
          id,
          type: { connect: { id: type as string } },
          registration: (tail as string).toLocaleUpperCase(),
          year: year === null ? null : parseInt(year as string),
          serial: serial as string | null,
          simulator: (sim as string) === 'true',
          simulatorType: (sim as string) === 'true' && simType !== null ? simType as string : null,
          complex: complex === null ? null : complex === 'true',
          taa: taa === null ? null : taa === 'true',
          highPerformance: hp === null ? null : hp === 'true',
          pressurized: press === null ? null : press === 'true',
          notes: notes as string | null
        };
        if (debug) console.log('create', data);
        await prisma.aircraft.create({ data });
      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', '*', 'Aircraft already exists');
      }
    } else {
      try {
        
        const currentData = await prisma.aircraft.findUnique({ where: { id }, include: { type: true }});
        if (currentData === null) return API.Form.formFailure('?/default', '*', 'Aircraft does not exist');

        // console.log('1', (taa === 'true') === currentData?.taa);
        // console.log('2', taa === null ? null : (taa === 'true') === currentData?.taa ? null : (taa === 'true'));

        const data = {
          id,
          type: { connect: { id: type as string } },
          registration: (tail as string).toLocaleUpperCase(),
          year: year === null ? null : parseInt(year as string),
          serial: serial as string | null,
          simulator: (sim as string) === 'true',
          simulatorType: (sim as string) === 'true' && simType !== null ? simType as string : null,
          complex: complex === null ? null : (complex === 'true') === currentData?.type.complex ? null : (complex === 'true'),
          taa: taa === null ? null : (taa === 'true') === currentData?.type.taa ? null : (taa === 'true'),
          highPerformance: hp === null ? null : (hp === 'true') === currentData?.type.highPerformance ? null : (hp === 'true'),
          pressurized: press === null ? null : (press === 'true') === currentData?.type.pressurized ? null : (press === 'true'),
          notes: notes as string | null
        };
        if (debug) console.log('update', data);
        await prisma.aircraft.update({ where: { id }, data });

        if (currentData?.simulator !== data.simulator) {
          // We changed the simulator status. We need to:
          //  1. Recalculate each duty day's deadheads associated with each of these legs

          // Get the legs that use this aircraft
          const legs = await prisma.leg.findMany({ where: { aircraftId: id }, include: { day: { select: { id: true } } }});
          const daysToRecalculate: number[] = [];

          // See if we should recalculate each day
          for (const leg of legs) if (leg.dayId !== null && !daysToRecalculate.includes(leg.dayId)) daysToRecalculate.push(leg.dayId);

          // Recalculate all the deadheads
          // TODO: This could be more efficient with transactions
          for (const dayId of daysToRecalculate) await generateDeadheads(dayId);
        }

      } catch (e) {
        console.log(e);
        return API.Form.formFailure('?/default', '*', 'An unknown error occurred. See logs.');
      }
    }

    try {

      if (debug) console.log(imageState);

      if (imageState as ImageUploadState === ImageUploadState.UPDATE) {
        if (image !== null && image !== '' && !(image instanceof File && image.size === 0)) {
          const results = await helpers.uploadImage(image, MAX_MB);
          if (debug) console.log(image);
          if (results.success !== true) return API.Form.formFailure('?/default', 'image', results.message);
          try {
            await prisma.aircraft.update({ where: { id }, data: { imageId: results.id } });
          } catch (e) {
            console.log('Error adding image to aircraft', e);
            return API.Form.formFailure('?/default', 'image', 'Could not add image to aircraft type');
          }
        }
      } else if (imageState as ImageUploadState === ImageUploadState.DELETE) {
        const imageId = await prisma.aircraftType.findUnique({ where: { id }, select: { imageId: true } });
        if (imageId?.imageId !== null && imageId?.imageId !== undefined) {
          await prisma.aircraftType.update({ where: { id }, data: { imageId: null }, select: { id: true } });
          await prisma.image.delete({ where: { id: imageId.imageId } });
        }
      }
    } catch (e) {
      console.log('Error uploading image to aircraft', e);
      return API.Form.formFailure('?/default', 'image', 'Could not add image to aircraft type');
    }

    // Clear any hanging images
    await helpers.clearHangingImages()

    const ref = url.searchParams.get('ref');
    if (debug) console.log('ref',ref);
    if (ref !== null) redirect(301, ref);
    else redirect(301, '/aircraft/entry/' +(tail as string).toUpperCase() + '?active=form');
  },

  delete: async ({ request, params }) => {

    const data = await request.formData();
    let id = data.get('id');
    if (id === null || id === '') return API.Form.formFailure('?/delete', 'id', 'Required field');
    await delay(500);

    if (await prisma.aircraft.findUnique({ where: { id: (id as string) } }) === null) {
      // This is probably a registration. Get the ID based on registration
      const aircraft = await prisma.aircraft.findUnique({ where: { registration: params.id } });
      if (aircraft === null) return API.Form.formFailure('?/default', '*', 'Aircraft does not exist');
      id = aircraft.id;
    }

    try {
      await prisma.aircraft.delete({ where: { id: id as string } });
    } catch (e) {
      console.log('Error deleting aircraft', e);
      return API.Form.formFailure('?/default', '*', 'Could not delete. Log entries with this aircraft still exist.');
    }

    // Clear any hanging images
    await helpers.clearHangingImages()

    // Done!
    redirect(301, '/aircraft/entry');
  },
};