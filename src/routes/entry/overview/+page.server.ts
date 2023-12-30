import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {

  const entrySettings = await settings.getSet('entry');

  if (entrySettings['entry.tour.current'] === -1) {
    const tour = await prisma.tour.create({ data: {} });
    await settings.set('entry.tour.current', tour.id);
    entrySettings['entry.tour.current'] = tour.id;
  }

  const currentTour = await prisma.tour.findUnique({
    where: { id: entrySettings['entry.tour.current'] },
    include: {
      days: {
        include: {
          legs: {
            orderBy: {
              id: 'asc'
            }
          }
        },
        orderBy: {
          id: 'asc'
        }
      }
    }
  });

  const tourOptions = await prisma.tour.findMany({
    where: {  },
    take: 5,
    orderBy: {
      id: 'desc'
    },
    include: {
      days: {
        include: {
          legs: {
            orderBy: {
              id: 'asc'
            },
            select: {
              startTime: true,
              endTime: true
            }
          }
        },
        orderBy: {
          id: 'asc'
        }
      }
    }
  });

  return {
    entrySettings,
    currentTour,
    tourOptions
  };
};

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    console.log(data);

    const flightIDs = data.getAll('flightID');

    for(const k of data.entries()) {
      if (flightIDs.includes(k[0]) && k[1] !== '') {
        console.log(k[0], k[1]);
      }
    }

    // const aeroAPI = (data.get('general.aeroAPI') ?? undefined) as undefined | string;
    // if (aeroAPI !== undefined) await settings.set('general.aeroAPI', aeroAPI);
  }
};
