import { API } from '$lib/types';
import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import { addIfDoesNotExist } from '$lib/server/db/airports.js';
import * as settings from '$lib/server/settings';

export const POST = async ({ params }) => {

  if (params.icao === undefined || params.icao === null) return API.response._400({missingPaths: ['icao']});

  const aeroAPIKey = await settings.get('general.aeroAPI');

  if (aeroAPIKey === '') return API.response._400({ message: 'Configure Aero API key in settings' });

  try {
    await addIfDoesNotExist(params.icao, aeroAPIKey);

    const airport = await prisma.airport.findUnique({
      where: {
        id: params.icao
      },
      select: {
        name: true,
        id: true,
        timezone: true
      }
    });
    
    if (airport === null) return API.response._404();

    return json({
      ok: true,
      status: 200,
      type: 'airport',
      airport: airport
    } satisfies API.Airport, { status: 200 });

  } catch (e) {
    return API.response.serverError(e);
  }
};
