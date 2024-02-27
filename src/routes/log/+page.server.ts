import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';

export const load = async ({ fetch, params, parent }) => {

  const legs = await prisma.leg.findMany({ include: { aircraft: { include: { type: { select: { typeCode: true, catClass: true }} }} } });

  return {
    params,
    legs
  }
}