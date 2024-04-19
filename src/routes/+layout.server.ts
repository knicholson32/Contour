import type { GitCommit } from '$lib/server/api/git/schema';
import * as settings from '$lib/server/settings';

const MAX_MB = 10;

export const load = async ({ fetch }) => {

  const commit = process.env.GIT_COMMIT ?? '';

  const set = await settings.getMany('system.debug', 'system.lastSeenCommit', 'entry.tour.current', 'general.gravatar.hash', 'general.name', 'general.email', 'general.timezone');

  let contourUpdates = false

  if (set['system.lastSeenCommit'] !== commit || true) contourUpdates = true;

  return {
    settings: set,
    MAX_MB,
    contourUpdates
  };
};


// let newItems: GitCommit[] | null = null;

// if (set['system.lastSeenCommit'] !== commit || true) {
//   const res = await fetch(`https://api.github.com/repos/knicholson32/Contour/commits?per_page=100&sha=${set['system.lastSeenCommit']}`);
//   if (res.ok === true) {
//     getCommits = await res.json() as GitCommit[];
//   }
// }
