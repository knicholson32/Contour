import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';

export const load = async ({ fetch, params, parent, url }) => {
  // throw redirect(301, '/logbook/reports');
};