import * as settings from '$lib/server/settings';
import type { GitCommit } from '$lib/server/api/git/schema';

export const load = async ({ fetch, params }) => {

  const commit = process.env.GIT_COMMIT ?? '';
  const lastCommit = await settings.get('system.lastSeenCommit');
  if (lastCommit !== commit) await settings.set('system.lastSeenCommit', commit);

  let commits: GitCommit[] | null = null;
  let currentCommit: GitCommit | null = null;

  const res = await fetch(`https://api.github.com/repos/knicholson32/Contour/commits?per_page=100&sha=${commit}`);
  if (res.ok === true) {
    commits = await res.json() as GitCommit[];
  }

  if (commits !== null) {
    currentCommit = commits[0];
    commits = commits.slice(1);
  }

  return {
    lastCommit,
    commit,
    currentCommit,
    commits
  } 
}