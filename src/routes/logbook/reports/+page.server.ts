import { redirect } from '@sveltejs/kit';

export const load = async ({ fetch, params, parent, url }) => {
  throw redirect(301, '/logbook/reports/8710');
};