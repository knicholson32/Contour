import prisma from '$lib/server/prisma';
import { legSelector, type Entry } from '$lib/types';
import type { Prisma } from '@prisma/client';
import Fuse from 'fuse.js';


const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


export type LegOptions = {
  positionsOnly?: boolean,
  search?: string | null
}
const optionDefault: LegOptions = {}
export const fetchLegsForSideMenu = async (dayId: number | null, tourId: number | null, options: LegOptions = optionDefault) => {

  

  let _legs: Entry[] | null = null;
  let legs: { text: string, entries: Entry[], visible: boolean }[] = [];

  let displayType: 'generic' | 'day' | 'tour' = 'generic';

  let positionsOnly = false;
  if (options.positionsOnly === true) positionsOnly = true;

  // Gather all the legs for the menu based on the following priority:
  //  * Day
  //  * Tour
  //  * All
  if (dayId !== null) {
    _legs = await prisma.leg.findMany({ 
      where: {
        dayId: dayId,
      }, 
      select: legSelector, 
      orderBy: [{ startTime_utc: 'desc' }, { relativeOrder: 'desc' }]
    });
    displayType = 'day';
  } else if (tourId !== null) {
    _legs = await prisma.leg.findMany({ 
      where: {
        day: { tourId: tourId }
      }, 
      select: legSelector, 
      orderBy: [{ startTime_utc: 'desc' }, { relativeOrder: 'desc' }]
    });
    displayType = 'tour';
  } else {
    _legs = await prisma.leg.findMany({
      select: legSelector, 
      orderBy: [{ startTime_utc: 'desc' }, { relativeOrder: 'desc' }]
    });
    displayType = 'generic';
  }

  if (options.search !== undefined && options.search !== null && options.search !== '') {
    const fuseOptions = {
      // isCaseSensitive: false,
      // includeScore: false,
      shouldSort: false,
      // includeMatches: false,
      // findAllMatches: false,
      // minMatchCharLength: 1,
      // location: 0,
      threshold: 0.0,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      keys: [
        "destinationAirportId",
        "originAirportId",
        "diversionAirportId",
        "aircraft.registration",
        "aircraft.type.typeCode",
      ]
    };

    const fuse = new Fuse(_legs, fuseOptions);
    _legs = fuse.search(options.search).flatMap((v) => v.item);
  }

  if (positionsOnly) _legs = _legs.filter((l) => l._count.positions > 0);

  // See if there are any legs that don't have a date assigned. We will put these in their own group
  if (_legs.findIndex((l) => l.startTime_utc === null) !== -1) {
    let entries: Entry[] = [];
    // Add each leg to the unassigned date group
    for (const leg of _legs) if (leg.startTime_utc === null) entries.push(leg);
    // Submit the group
    legs.push({ text: 'No Date', entries, visible: true });
    // Remove each of the legs added here from the primary leg list
    // _legs = _legs.filter((leg) => entries.findIndex((entry) => entry.id === leg.id) === -1);
  }


  if (_legs !== null && _legs.length > 0 && _legs[0].startTime_utc !== null) {
    let d: Date;
    if (_legs[0].day === null) d = new Date(_legs[0].startTime_utc * 1000);
    else d = new Date(_legs[0].day.startTime_utc * 1000);

    let smallTarget: number;
    let largeTarget: number;

    if (displayType === 'tour' || displayType === 'day') {
      smallTarget = d.getDate();
      largeTarget = d.getMonth();
    } else {
      smallTarget = d.getMonth();
      largeTarget = d.getFullYear();
    }

    let entries: Entry[] = [];
    for (const leg of _legs) {
      if (leg.startTime_utc === null) continue;
      let d: Date;
      if (leg.day === null) d = new Date(leg.startTime_utc * 1000);
      else d = new Date(leg.day.startTime_utc * 1000);

      let small: number;
      let large: number;
      if (displayType === 'tour' || displayType === 'day') {
        small = d.getDate();
        large = d.getMonth();
      } else {
        small = d.getMonth();
        large = d.getFullYear();
      }
      if (small !== smallTarget || large !== largeTarget) {
        // let v = false;
        // if (entries.findIndex((l) => l.id === params.id) !== -1) v = true;
        if (displayType === 'tour' || displayType === 'day') {
          // Tour or day display, we are doing by day
          legs.push({ text: `${months[largeTarget]} ${smallTarget}`, entries, visible: true });
        } else {
          // Generic display, we are doing by month/year
          legs.push({ text: `${months[smallTarget]} ${largeTarget}`, entries, visible: true });
        }
        entries = [];
        smallTarget = small;
        largeTarget = large;
      }
      // Add this leg to the current year group
      entries.push(leg);
    }
    // Add the last year to the group list
    // let v = false;
    // if (entries.findIndex((l) => l.id === params.id) !== -1) v = true;
    if (displayType === 'tour' || displayType === 'day') {
      // Tour or day display, we are doing by day
      legs.push({ text: `${months[largeTarget]} ${smallTarget}`, entries, visible: true });
    } else {
      // Generic display, we are doing by month/year
      legs.push({ text: `${months[smallTarget]} ${largeTarget}`, entries, visible: true });
    }
    entries = [];
  }

  return legs;
}