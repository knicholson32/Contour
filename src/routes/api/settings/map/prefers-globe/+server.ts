import { API } from '$lib/types';
import * as settings from '$lib/server/settings';
import { json } from '@sveltejs/kit';

export const GET = async ({ }) => {
  try {
    const prefersGlobe = await settings.get('general.prefers_globe');
    return json({
      ok: true,
      status: 200,
      type: 'settings-prefers-globe',
      data: {
        prefers_globe: prefersGlobe
      }
    } satisfies API.SettingsPrefersGlobe, {status: 200});
  } catch (e) {
    return API.response.serverError(e);
  }
};
