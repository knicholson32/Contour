import { redirect } from '@sveltejs/kit';

export const load = async ({ fetch, params }) => {
  throw redirect(301, '/aircraft/entry');
}