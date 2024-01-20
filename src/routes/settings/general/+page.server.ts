import * as settings from '$lib/server/settings';
import { error } from '@sveltejs/kit';
import crypto from 'node:crypto';

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
	updateEmail: async ({ request }) => {
		const data = await request.formData();

		const name = (data.get('general.name') ?? undefined) as undefined | string;
		if (name !== undefined) await settings.set('general.name', name);

		const email = (data.get('general.email') ?? undefined) as undefined | string;
		if (email !== undefined) await settings.set('general.email', email);

		const hash = email === undefined ? '00000000000000000000000000000000' : crypto.createHash('md5').update(email.trim().toLocaleLowerCase()).digest('hex');
		await settings.set('general.gravatar.hash', hash);
	},
	updateLocalization: async ({ request }) => {
		const data = await request.formData();

		const timezone = (data.get('general.timezone') ?? undefined) as undefined | string;
		if (timezone !== undefined) await settings.set('general.timezone', timezone);
	}
};
