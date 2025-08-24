import { API } from '$lib/types';
import * as settings from '$lib/server/settings';
import { json } from '@sveltejs/kit';

export const GET = async ({ url }) => {
  try {
    const valueRaw = url.searchParams.get('value');
    if (valueRaw === null) {
      return API.response._400({ missingURLParams: ['value'] })
    }
    const value = valueRaw === 'true' || valueRaw === '1';

    await settings.set('general.prefers_globe', value);

    return json({
      ok: true,
      status: 200,
      type: 'settings-prefers-globe',
      data: {
        prefers_globe: value
      }
    } satisfies API.SettingsPrefersGlobe, {status: 200});
  } catch (e) {
    return API.response.serverError(e);
  }
};
