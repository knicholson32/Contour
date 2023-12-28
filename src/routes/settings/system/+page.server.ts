import * as settings from '$lib/server/settings';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {
	return {
		settingValues: {
			'system.debug': await settings.get('system.debug'),
			'general.timezone': await settings.get('general.timezone')
		},
		tz: (await settings.get('general.timezone')) ?? 'UTC'
	};
};

export const actions = {
	updateDebug: async ({ request }) => {
		const data = await request.formData();

		const debugSwitch = (data.get('system.debug.switch') ?? undefined) as undefined | string;
		if (debugSwitch !== undefined && debugSwitch === 'false') await settings.set('system.debug', 0);

		const debug = (data.get('system.debug') ?? undefined) as undefined | string;
		if (debug !== undefined) await settings.set('system.debug', parseInt(debug));
	},
	updateLocalization: async ({ request }) => {
		const data = await request.formData();

		const timezone = (data.get('general.timezone') ?? undefined) as undefined | string;
		if (timezone !== undefined) await settings.set('general.timezone', timezone);
	}
};
