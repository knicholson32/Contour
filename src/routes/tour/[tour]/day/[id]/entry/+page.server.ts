import prisma from "$lib/server/prisma";
import * as settings from '$lib/server/settings';
import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {

  const entrySettings = await settings.getSet('entry');

  if (isNaN(parseInt(params.id))) throw redirect(301, '/tour/' + params.tour + '/day');

  const currentDay = await prisma.dutyDay.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      legs: {
        orderBy: {
          startTime_utc: 'desc'
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

  if (currentDay === null) throw redirect(301, '/tour/' + params.tour + '/day');
  
  console.log('legs', currentDay.legs);

  if (currentDay.legs.length > 0) throw redirect(301, '/tour/' + params.tour + '/day/' + params.id + '/entry/' + currentDay.legs[0].id);

  throw redirect(301, '/tour/' + params.tour + '/day/' + params.id + '/entry/new');
};

