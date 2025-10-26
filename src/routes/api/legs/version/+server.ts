import * as settings from '$lib/server/settings';
import prisma from '$lib/server/prisma';
import { json, redirect } from '@sveltejs/kit';

import * as DeckTypes from '$lib/components/map/deck/types.js';
import { addIfDoesNotExist } from '$lib/server/db/airports.js';
import { getDistanceFromLatLonInKm } from '$lib/helpers/index.js';
import { API } from '$lib/types';
import { jsonCompressed } from '$lib/types/responses';

export const GET = async ({ request, url }) => {
  try {

    const version = await settings.get('entry.dataVersion');

    // return jsonCompressed({ ok: true, version }, request.headers);
    const headers = new Headers();
    headers.set('cache-control', 'max-age=0');
    return json({ ok: true, version }, {status: 200, headers });
    

  } catch (e) {
    return API.response.serverError(e);
  }
};


