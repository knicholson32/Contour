import * as settings from '$lib/server/settings';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {

	const settingValues = await settings.getSet('general');

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
	updateLocalization: async ({ request }) => {
		const data = await request.formData();

		const timezone = (data.get('general.timezone') ?? undefined) as undefined | string;
		if (timezone !== undefined) await settings.set('general.timezone', timezone);
	}
};
