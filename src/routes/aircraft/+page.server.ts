import { redirect } from '@sveltejs/kit';

export const load = async ({ fetch, params }) => {
  redirect(301, '/aircraft/entry');
}