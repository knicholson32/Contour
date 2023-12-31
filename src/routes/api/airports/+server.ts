import type { API } from '$lib/types';
import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export const GET = async ({ }) => {
  const airports = await prisma.airport.findMany({
    select: {
      name: true,
      id: true,
      timezone: true
    },
    orderBy: {
      id: 'asc'
    }
  });
  return json({
    ok: true,
    status: 200,
    type: 'airports',
    airports: airports
  } satisfies API.Airports, { status: 200 });
};
