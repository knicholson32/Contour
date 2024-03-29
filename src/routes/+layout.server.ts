import * as settings from '$lib/server/settings';

const MAX_MB = 10;

export const load = async ({  }) => {

  return {
    entrySettings: await settings.getSet('entry'),
    generalSettings: await settings.getSet('general'),
    debug: await settings.get('system.debug'),
    MAX_MB,
  };
};
