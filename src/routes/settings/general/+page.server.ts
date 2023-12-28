import * as settings from '$lib/server/settings';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {
	return {
		settingValues: {
			'general.timezone': await settings.get('general.timezone')
		},
		version: process.env.GIT_COMMIT ?? 'Unknown'
	};
};

export const actions = {
	updateLocalization: async ({ request }) => {
		const data = await request.formData();

		const timezone = (data.get('general.timezone') ?? undefined) as undefined | string;
		if (timezone !== undefined) await settings.set('general.timezone', timezone);

		console.log(s.abc12);
	}
};
