import { API } from '$lib/types';
import * as settings from '$lib/server/settings';

export const GET = async ({ }) => {
  try {
    const debug = await settings.get('system.debug');
    console.log('debug', debug);
    return API.response.success();
  } catch (e) {
    return API.response.serverError(e);
  }
};
