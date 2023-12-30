import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import * as aeroAPI from '$lib/server/api/flightaware';
import { redirect } from '@sveltejs/kit';
import * as options from '$lib/server/db/options';
import { finalizeFlight } from '$lib/server/db/legs';

const FORTY_EIGHT_HOURS = 48 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const EIGHT_HOURS = 8 * 60 * 60;

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {

  const entrySettings = await settings.getSet('entry');

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

  if (await settings.get('general.aeroAPI') === '') throw redirect(301, '/settings/general')

  return {
    entrySettings,
    currentTour,
    tourOptions,
    currentDay: await prisma.day.findUnique({ where: { id: entrySettings['entry.day.current'] }})
  };
};

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    console.log(data);

    const flightIDs = data.getAll('flightID');

    // Tour selection
    const tourAttach = (data.get('tourAttach') ?? undefined) as undefined | string;
    let tour = -1;
    if (tourAttach !== undefined) {
      if (tourAttach === 'unset') tour = (await prisma.tour.create({ data: {} })).id;
      else tour = parseInt(tourAttach);
      await settings.set('entry.tour.current', tour);
    } else {
      return { action: '?/day', name: 'tourAttach', success: false, message: 'Tour selection required' };
    }

    // Times
    const startTime = (data.get('startTime-date') ?? undefined) as undefined | string;
    if (startTime === undefined) return { action: '?/day', name: 'startTime', success: false, message: 'Start time required' };

    const startTime_tz = (data.get('startTime-tz') ?? undefined) as undefined | string;
    if (startTime_tz === undefined) return { action: '?/day', name: 'startTime', success: false, message: 'Start timezone required' };

    const endTime = (data.get('endTime-date') ?? undefined) as undefined | string;
    if (endTime === undefined) return { action: '?/day', name: 'endTime', success: false, message: 'End time required' };

    const endTime_tz = (data.get('endTime-tz') ?? undefined) as undefined | string;
    if (endTime_tz === undefined) return { action: '?/day', name: 'endTime', success: false, message: 'Start timezone required' };

    const flightEntries: { [key: string]: string[]} = {};

    const aeroAPIKey = await settings.get('general.aeroAPI');
    if (aeroAPIKey === '') return { action: '?/day', name: 'tourAttach', success: false, message: 'API Key Required. See settings.' };

    const promiseList = [];

    // Consolidate flight entries
    for(const k of data.entries()) {
      // We are looping through every form inout, so we need to check that we are looking at
      // a valid flight entry (string and a member of `flightIDs`)
      if (k[0] !== '' && flightIDs.includes(k[0]) && typeof k[1] === 'string' && k[1] !== '') {
        // If this flight ID has not been seen yet, add an array for the URLs
        if (!(k[0] in flightEntries)) flightEntries[k[0]] = [];
        // If the URL is not valid, error
        if (!helpers.validateUrl(k[1])) {
          console.log('invalid', k[0], k[1]);
          return { action: k[0], name: k[0], success: false, message: 'Invalid URL' };
        }
        // Add the fa_flight_id to the flight ID
        promiseList.push(new Promise<void>(async (resolve, reject) => {
          const fa_flight_id = await aeroAPI.getFlightIDFromURL(k[1] as string);
          if (fa_flight_id === null) {
            reject ({ action: k[0], name: k[0], success: false, message: 'Invalid URL' });
          } else {
            if (!flightEntries[k[0]].includes(fa_flight_id)) flightEntries[k[0]].push(fa_flight_id);
            resolve();
          }
        }));
      }
    }

    try {
      await Promise.allSettled(promiseList);
    } catch (e) {
      return e as { action: string, name: string, success: boolean, message: string };
    }

    // Create day
  // id Int @id @default(autoincrement())
  // tourId Int
  // tour Tour @relation(fields: [tourId], references: [id], onDelete: Restrict)
  // legs Leg[]
  // startTime_utc Int
  // startTimezone String
  // endTime_utc Int
  // endTimezone String

    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);

    let dayId = await settings.get('entry.day.current');

    if (dayId === -1) {
      const day =  await prisma.day.create({ data: {
        tourId: tour,
        startTime_utc: startTimeDate.getTime() / 1000,
        startTimezoneOffset: startTimeDate.getTimezoneOffset(),
        endTime_utc: endTimeDate.getTime() / 1000,
        endTimezoneOffset: endTimeDate.getTimezoneOffset()
      }});
      await settings.set('entry.day.current', day.id);
    } else {
      await prisma.day.update({ where: { id: dayId }, data: {
        startTime_utc: startTimeDate.getTime() / 1000,
        startTimezoneOffset: startTimeDate.getTimezoneOffset(),
        endTime_utc: endTimeDate.getTime() / 1000,
        endTimezoneOffset: endTimeDate.getTimezoneOffset()
      }});
    }


    console.log(flightEntries);

    // Make a single request and cache the leg data concerning these Flight IDs from flightaware
    await options.getOptionsAndCache(aeroAPIKey, tour, Object.keys(flightEntries));

    // Loop through each URL and get the `fa_flight_id`

    // Loop through each aircraft flight ID (IE. EJA762)
    for (const flightID of Object.keys(flightEntries)) {
      // Loop through each leg entry (IE. AAL1002-1703678982-airline-1015p)
      for (const fa_flight_id of flightEntries[flightID]) {
        // See if the flightaware entry has been cached as an option
        const entry = await options.getFlightOptionFaFlightID(fa_flight_id);
        if (entry === undefined) {
          // It has not. We need to get the flight ourselves somehow
          console.log('CACHE MISS!', fa_flight_id);
        } else {
          // It has. We need to convert this to a full entry
          await finalizeFlight(dayId, aeroAPIKey, entry);
        }
      }
    }

    // for (const key of Object.keys(flightEntries)) {
    //   const flightID = 
    // }

    if (Object.keys(flightEntries).length === 0) return { action: '?/flightSet', name: 'flightID', success: false, message: 'At least one leg is required' };

    // throw redirect(301, '/entry/overview');

    // const aeroAPI = (data.get('general.aeroAPI') ?? undefined) as undefined | string;
    // if (aeroAPI !== undefined) await settings.set('general.aeroAPI', aeroAPI);
  }
};
