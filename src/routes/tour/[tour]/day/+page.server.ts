import prisma from "$lib/server/prisma";
import * as settings from '$lib/server/settings';
import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {

  const entrySettings = await settings.getSet('entry');

  // const currentDay = await prisma.dutyDay.findUnique({where: { id: entrySettings["entry.day.current"] }});
  // if (currentDay !== null) throw redirect(301, '/day/' + currentDay.id);

  if (isNaN(parseInt(params.tour))) throw redirect(301, '/tour');

  const days = await prisma.dutyDay.findMany({
    where: {
      tourId: parseInt(params.tour)
    },
    select: {id: true},
    orderBy: {
      startTime_utc: 'desc'
    },
    take: 1
  });

  if (days.length > 0) throw redirect(301, '/tour/' + params.tour + '/day/' + days[0].id);

  throw redirect(301, '/tour/' + params.tour + '/day/new');
};

