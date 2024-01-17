import prisma from "$lib/server/prisma";
import * as settings from '$lib/server/settings';
import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {

  const entrySettings = await settings.getSet('entry');

  const currentDay = await prisma.dutyDay.findUnique({
    where: { id: entrySettings["entry.day.current"] },
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

  if (currentDay !== null) throw redirect(301, '/day/' + currentDay.id);

  const days = await prisma.dutyDay.findMany({
    select: {
      id: true,
      startAirportId: true,
      endAirportId: true,
    },
    orderBy: {
      endTime_utc: 'desc'
    },
    take: 1
  });

  if (days.length > 0) throw redirect(301, '/day/' + days[0].id);

  throw redirect(301, '/day/new');
};

