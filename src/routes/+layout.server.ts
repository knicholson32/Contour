import type { GitCommit } from '$lib/server/api/git/schema';
import * as settings from '$lib/server/settings';

const MAX_MB = 10;

export const load = async ({ fetch, url }) => {

  const commit = process.env.GIT_COMMIT ?? '';
  const set = await settings.getMany('system.debug', 'system.lastSeenCommit', 'entry.tour.current', 'general.gravatar.hash', 'general.name', 'general.email', 'general.timezone');
  let contourUpdates = false
  if (set['system.lastSeenCommit'] !== commit && url.pathname !== '/changelog') contourUpdates = true;

  return {
    settings: set,
    MAX_MB,
    contourUpdates,
    lastCommit: commit
  };
};