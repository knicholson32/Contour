import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';
import * as helpers from '$lib/helpers';
import * as aeroAPI from '$lib/server/api/flightaware';
import { redirect } from '@sveltejs/kit';
import * as options from '$lib/server/db/options';
import type { API } from '$lib/types';

const FORTY_EIGHT_HOURS = 48 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;
const EIGHT_HOURS = 8 * 60 * 60;

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {

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

  if (currentTour !== null) throw redirect(301, 'tour/' + currentTour.id);

  const tourOptions = await prisma.tour.findMany({
    where: {},
    take: 5,
    orderBy: {
      id: 'desc'
    }
  });

  if (tourOptions.length === 0) throw redirect(301, 'tour/new');

  throw redirect(301, 'tour/' + tourOptions[0].id);

};
