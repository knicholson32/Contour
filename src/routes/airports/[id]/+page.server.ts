import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { delay } from '$lib/helpers/index.js';
import * as helpers from '$lib/server/helpers';

const MAX_MB = 10;

export const load = async ({ fetch, params }) => {

  const id = params.id;

  const entrySettings = await settings.getSet('entry');
  const airports = await ((await fetch('/api/airports')).json()) as API.Airports;

  return {
    entrySettings,
    airports: (airports.ok === true) ? airports.airports : [] as API.Types.Airport[],
    MAX_MB
  }
}

export const actions = {
  default: async ({ request }) => {

    await delay(5000);

    const data = await request.formData();

    const debugSwitch = (data.get('system.debug.switch') ?? undefined) as undefined | string;
    if (debugSwitch !== undefined && debugSwitch === 'false') await settings.set('system.debug', 0);

    const tail = (data.get('tail') ?? undefined) as undefined | string;

    const image = (data.get('image') ?? undefined) as undefined | string | File;
    const imageIsDefault = (data.get('image-isDefault') ?? undefined) as undefined | string;

    // const debug = (data.get('system.debug') ?? undefined) as undefined | string;
    // if (debug !== undefined) await settings.set('system.debug', parseInt(debug));

    // if (image !== undefined && image !== '' && !(imageIsDefault !== null && imageIsDefault !== '' && imageIsDefault === 'true')) {
    //   const results = await helpers.uploadImage(image, MAX_MB);
    //   if (results.success !== true) return API.Form.formFailure('?/default', 'image', results.message);

    //   try {
    //     await prisma.aircraft.update({ where: { registration: tail as string }, data: { imageId: results.id } });
    //   } catch (e) {
    //     try {
    //       await prisma.aircraft.delete({ where: { registration: tail as string } });
    //     } catch (e) { }
    //     console.log('Error adding image to aircraft', e);
    //     return API.Form.formFailure('?/default', 'image', 'Could not add image to aircraft');
    //   }
    // }


    return API.Form.formFailure('?/default', 'type', 'Required field');
  },
};
