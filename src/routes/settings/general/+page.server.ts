import { addIfDoesNotExist } from '$lib/server/db/airports.js';
import * as settings from '$lib/server/settings';
import API from '$lib/types/api.js';
import { error } from '@sveltejs/kit';
import crypto from 'node:crypto';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {

	const settingValues = { ...await settings.getSet('general'), ...await settings.getSet('tour'), ...await settings.getSet('entry')}

	return {
		settingValues,
		version: process.env.GIT_COMMIT ?? 'Unknown'
	};
};

export const actions = {
	updateAeroAPI: async ({ request }) => {
		const data = await request.formData();

		const aeroAPI = (data.get('general.aeroAPI') ?? undefined) as undefined | string;
		if (aeroAPI !== undefined) await settings.set('general.aeroAPI', aeroAPI);
	},
	updateEmail: async ({ request }) => {
		const data = await request.formData();

		const name = (data.get('general.name') ?? undefined) as undefined | string;
		if (name !== undefined) await settings.set('general.name', name);

		const email = (data.get('general.email') ?? undefined) as undefined | string;
		if (email !== undefined) await settings.set('general.email', email);

		const prefersGlobe = (data.get('general.prefers_globe') ?? undefined) as undefined | string;
		if (prefersGlobe !== undefined) await settings.set('general.prefers_globe', prefersGlobe === 'true');

		const hash = email === undefined ? '00000000000000000000000000000000' : crypto.createHash('md5').update(email.trim().toLocaleLowerCase()).digest('hex');
		await settings.set('general.gravatar.hash', hash);

		const showAirport = (data.get('tour.defaultStartApt') ?? undefined) as undefined | string;
		if (showAirport !== undefined) {
			const success = await addIfDoesNotExist(showAirport, await settings.get('general.aeroAPI'));
			if (success) await settings.set('tour.defaultStartApt', showAirport);
			else return API.Form.formFailure('?/updateEmail', 'tour.defaultStartApt', 'Airport does not exist');
		}

		const blockStartPad = parseFloat((data.get('entry.day.entry.day.blockStartPad') ?? 'NaN') as string);
		const blockEndPad = parseFloat((data.get('entry.day.entry.day.blockEndPad') ?? 'NaN') as string);

		if (blockStartPad !== undefined && !isNaN(blockStartPad)) await settings.set('entry.day.blockStartPad', blockStartPad * 3600)
		if (blockEndPad !== undefined && !isNaN(blockEndPad)) await settings.set('entry.day.blockEndPad', blockEndPad * 3600)

	},
	updateLocalization: async ({ request }) => {
		const data = await request.formData();

		const timezone = (data.get('general.timezone') ?? undefined) as undefined | string;
		if (timezone !== undefined) await settings.set('general.timezone', timezone);

		const prefers_utc = (data.get('general.prefers_utc') ?? undefined) as undefined | string;
		if (prefers_utc !== undefined) await settings.set('general.prefers_utc', prefers_utc === 'true');
	}
};
