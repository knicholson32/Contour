import type { GitCommit } from '$lib/server/api/git/schema';
import { getPackageVersion } from '$lib/server/helpers/index.js';
import * as settings from '$lib/server/settings';

const MAX_MB = 10;

export const load = async ({ parent, fetch, url }) => {

  const commit = process.env.GIT_COMMIT ?? '';
  const set = await settings.getMany('system.debug', 'system.lastSeenCommit', 'entry.tour.current', 'general.gravatar.hash', 'general.name', 'general.email', 'general.timezone');
  let contourUpdates = false
  if (set['system.lastSeenCommit'] !== commit && url.pathname !== '/changelog') contourUpdates = true;

  /*
  contour  | {
  contour  |   GIT_REF_PROTECTED: '',
  contour  |   HOST_HEADER: 'x-forwarded-host',
  contour  |   DATABASE_URL: 'file:/db/contour.db?connection_limit=1',
  contour  |   NODE_VERSION: '22.15.0',
  contour  |   GIT_REF: '',
  contour  |   CI: '',
  contour  |   HOSTNAME: '443e147aca07',
  contour  |   ORIGIN: 'http://localhost:5173',
  contour  |   YARN_VERSION: '1.22.22',
  contour  |   GIT_COMMIT: '18112ba7c6a536f175ddedff8b4e9521f91b0aa8',
  contour  |   SHLVL: '2',
  contour  |   PORT: '3000',
  contour  |   HOME: '/root',
  contour  |   OLDPWD: '/',
  contour  |   PROTOCOL_HEADER: 'x-forwarded-proto',
  contour  |   PGID: '1000',
  contour  |   REGISTRY_IMAGE: '',
  contour  |   PATH: '/pnpm:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
  contour  |   BODY_SIZE_LIMIT: '11000000',
  contour  |   PUID: '1000',
  contour  |   PROC_SHELL: '/bin/sh',
  contour  |   PWD: '/app',
  contour  |   TZ: 'America/New_York',
  contour  |   PNPM_HOME: '/pnpm',
  contour  |   VIPSHOME: '/target'
  contour  | }
*/

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