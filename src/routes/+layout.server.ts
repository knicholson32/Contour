import * as settings from '$lib/server/settings';

export const load = async ({ }) => {

  return {
    entrySettings: await settings.getSet('entry')
  };
};
