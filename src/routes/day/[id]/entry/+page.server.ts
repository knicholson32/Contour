import prisma from "$lib/server/prisma";
import * as settings from '$lib/server/settings';
import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {

  const entrySettings = await settings.getSet('entry');

  if (isNaN(parseInt(params.id))) throw redirect(301, '/day');

  const currentDay = await prisma.dutyDay.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      legs: {
        orderBy: {
          startTime: 'desc'
        }
      },
      startAirport: {
        select: {
          id: true,
          timezone: true
        }
      },
      endAirport: {
        select: {
          id: true,
          timezone: true
        }
      },
      tour: true
    },
  });

  if (currentDay === null) throw redirect(301, '/day');

  const legs = await prisma.leg.findMany({
    where: {
      day: {
        id: currentDay.id
      }
    },
    select: {
      id: true,
    },
    orderBy: {
      startTime: 'desc'
    },
    take: 1
  });

  console.log(legs);

  if (legs.length > 0) throw redirect(301, '/day/' + params.id + '/entry/' + legs[0].id);

  throw redirect(301, '/day/' + params.id + '/entry/new');
};

