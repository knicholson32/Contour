import { API } from '$lib/types';
import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export const GET = async ({ params }) => {

  if (params.icao === undefined || params.icao === null) return API.response._400({missingPaths: ['icao']});

  params.icao = params.icao.toUpperCase();

  try {
    return json({
      ok: true,
      status: 200,
      type: 'approach',
      options: await prisma.approachOptions.findMany({ where: { airportId: params.icao }})
    } satisfies API.Approach, { status: 200 });

  } catch (e) {
    return API.response.serverError(e);
  }
};
