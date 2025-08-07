import { redirect } from '@sveltejs/kit';

export const load = async ({ fetch, params, parent, url }) => {
  redirect(301, '/logbook/reports/full');
};