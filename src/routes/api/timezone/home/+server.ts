import { API } from '$lib/types';
import * as settings from '$lib/server/settings';
import { getTimeZones } from '@vvo/tzdb';
import { json } from '@sveltejs/kit';


export const GET = async ({ }) => {
  try {
    const timezoneSettings = await settings.getMany('general.timezone', 'general.prefers_utc');
    const timezoneData = getTimeZones({ includeUtc: true }).find((tz) => timezoneSettings['general.timezone'] === tz.name || tz.group.includes(timezoneSettings['general.timezone']));
    if (timezoneData === undefined) return API.response._400({ message: 'The home timezone is not set.' })

    return json({
      ok: true,
      status: 200,
      type: 'timezone-home',
      data: timezoneData,
      prefers_utc: timezoneSettings['general.prefers_utc']
    } satisfies API.HomeTimeZone, { status: 200 });
  } catch (e) {
    return API.response.serverError(e);
  }
};
