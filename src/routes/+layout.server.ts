import type { GitCommit } from '$lib/server/api/git/schema';
import { getPackageVersion } from '$lib/server/helpers/index.js';
import * as settings from '$lib/server/settings';

const MAX_MB = 10;

export const load = async ({ parent, fetch, url }) => {

  const commit = process.env.GIT_COMMIT ?? '';
  const set = await settings.getMany('system.debug', 'system.lastSeenCommit', 'entry.tour.current', 'general.gravatar.hash', 'general.name', 'general.email', 'general.timezone');
  let contourUpdates = false
  if (set['system.lastSeenCommit'] !== commit && url.pathname !== '/changelog') contourUpdates = true;

  return {
    settings: set,
    MAX_MB,
    contourUpdates,
    lastCommit: set['system.lastSeenCommit'],
    nodeVersion: process.version,
    parentImage: process.env.PARENT_IMAGE ?? 'None',
    svelteVersion: getPackageVersion('svelte'),
    prismaVersion: getPackageVersion('prisma'),
    buildTime: process.env.BUILD_TIMESTAMP,
  }
};