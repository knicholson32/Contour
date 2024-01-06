import * as settings from '$lib/server/settings';

const MAX_MB = 10;

export const load = async ({  }) => {

  return {
    entrySettings: await settings.getSet('entry'),
    MAX_MB,
  };
};
