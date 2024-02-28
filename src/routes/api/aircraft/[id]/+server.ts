import { API } from '$lib/types';
import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export const GET = async ({ params }) => {

  if (params.id === undefined || params.id === null) return API.response._400({missingPaths: ['id']});
  
  const ac = await prisma.aircraft.findUnique({ where: { id: params.id }, include: { type: true } });
  if (ac === null) return API.response._404();

  try {
    return new Response(JSON.stringify({
      ok: true,
      status: 200,
      type: 'aircraft',
      aircraft: ac
    } satisfies API.Aircraft), {
      status: 200,
      headers: [
        ['Cache-Control', 'max-age=60']
      ]
    })

  } catch (e) {
    return API.response.serverError(e);
  }
};
