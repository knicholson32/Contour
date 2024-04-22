import { API } from '$lib/types';
import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export const GET = async ({ params }) => {

  if (params.reg === undefined || params.reg === null) return API.response._400({ missingPaths: ['reg'] });

  let reg = params.reg.toUpperCase().trim();
  if (reg.startsWith('N') || reg.startsWith('n')) reg = reg.substring(1);

  const ac = await prisma.aircraftRegistrationLookup.findUnique({ where: { reg } });
  if (ac === null) return API.response._404();

  try {
    return new Response(JSON.stringify({
      ok: true,
      status: 200,
      type: 'faa',
      aircraft: ac
    } satisfies API.FAAReg), {
      status: 200,
      headers: [
        ['Cache-Control', 'max-age=60']
      ]
    })

  } catch (e) {
    return API.response.serverError(e);
  }
};
