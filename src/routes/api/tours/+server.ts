import { API } from '$lib/types';
import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export const GET = async ({ url }) => {

  const start = parseInt(url.searchParams.get('start') ?? '-1');
  const end = parseInt(url.searchParams.get('end') ?? '-1');

  if (start === -1 || isNaN(start)) return API.response._400({ missingURLParams: ['start'] });
  if (end === -1 || isNaN(end)) return API.response._400({ missingURLParams: ['end'] });

  if (end < start) return API.response._400({ message: 'End must be after start' });
  if (end > 9223372036854775807) return API.response._400({ message: 'End time too large' }); // 64 bit signed int max

  try {
    return json({
      ok: true,
      status: 200,
      type: 'tours',
      tours: await prisma.tour.findMany({ 
        where: {
          startTime_utc: { gte: start },
          OR: [
            { endTime_utc: { lte: end } },
            { endTime_utc: null }
          ]
        }
      })
    } satisfies API.TourList, { status: 200 });

  } catch (e) {
    return API.response.serverError(e);
  }
};
