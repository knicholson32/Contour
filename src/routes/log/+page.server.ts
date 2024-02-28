import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';

const PER_PAGE = 32;

export const load = async ({ fetch, params, parent, url }) => {

  const p = url.searchParams.get('page');
  if (p === null || isNaN(parseInt(p))) throw redirect(301, '/log?page=1&select=' + PER_PAGE);
  const s = url.searchParams.get('select');
  if (s === null || isNaN(parseInt(s))) throw redirect(301, '/log?page=' + p + '&select=' + PER_PAGE);

  const count = await prisma.leg.count();
  const select = parseInt(s);
  const page = parseInt(p) - 1;

  if (page < 0) throw redirect(301, '/log');
  if (select < 0) throw redirect(301, '/log');
  if (page * select > count - 1) throw redirect(301, `/log?page=${Math.ceil(count / select)}&select=${select}`);

  

  const legs = await prisma.leg.findMany({
    include: { aircraft: { include: { type: { select: { typeCode: true, catClass: true }} }} },
    orderBy: { startTime_utc: 'asc' },
    take: select,
    skip: page * select
  });

  return {
    params,
    count,
    legs,
    select,
    page
  }
}