import prisma from '$lib/server/prisma/index.js';
import * as settings from '$lib/server/settings';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {

  const t = await fetch('https://www.flightaware.com/live/flight/AAL1002/history/20231229/1215Z/KMSN/KCLT');

  const lines = (await t.text()).split('\n');

  for (const l of lines) {
    if (l.indexOf('trackpollBootstrap') !== -1) {
      const start = l.indexOf('{');
      const end = l.lastIndexOf(';');
      const line = l.substring(start, end);
      const entry = JSON.parse(line);
      const flightID = (Object.keys(entry.flights)[0]).split(':')[0];
      console.log(flightID);
      break;
    }
  }

  // return {
  //   t
  // };
};
