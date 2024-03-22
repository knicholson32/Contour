import prisma from '$lib/server/prisma';
import * as settings from '$lib/server/settings';
import { API } from '$lib/types';
import { unzip } from 'unzipit';
import type * as Types from '@prisma/client';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {

	const indexRaw = await fetch('https://aeronav.faa.gov/Upload_313-d/cifp/');
	if (indexRaw.status !== 200) console.log('ERROR: Unable to fetch aeronav data: Status', indexRaw.status, indexRaw.statusText);
	const index = await indexRaw.text()

	const settingValues = await settings.getMany('data.approaches.lastSync', 'data.approaches.source', 'entry.entryMXMode');

	const regex = /\/CIFP_[0-9]+.zip/gm;

	const optionsRaw: string[] = [];
	const options: { title: string, value: string, date?: Date, unset?: boolean }[] = [{
		title: 'Select an Option',
		unset: true,
		value: 'unset'
	}];
	let m;
	while ((m = regex.exec(index)) !== null) {
		if (m.index === regex.lastIndex) regex.lastIndex++;
		m.forEach((match, groupIndex) => optionsRaw.push(match));
	}

	for (const o of optionsRaw) {
		const splitter = /(?<year>[0-9][0-9])(?<month>[0-9][0-9])(?<day>[0-9][0-9])/gm;
		const g = splitter.exec(o)?.groups as undefined | { year: string, month: string, day: string };

		if (g !== undefined) {
			options.push({
				value: `CIFP_${g.year}${g.month}${g.day}.zip`,
				title: `Effective ${g.day}-${months[parseInt(g.month) - 1]}-20${g.year}`,
				date: new Date(`${g.month}-${g.day}-${g.year}`)
			});
		}
	}

	options.sort((a, b) => {
		if (b.date === undefined || a.date === undefined) return 0;
		return b.date.getTime() - a.date.getTime();
	});

	let effectiveDate = 'None';
	if (settingValues['data.approaches.source'] !== '') {
		const splitter = /(?<year>[0-9][0-9])(?<month>[0-9][0-9])(?<day>[0-9][0-9])/gm;
		const g = splitter.exec(settingValues['data.approaches.source'])?.groups as undefined | { year: string, month: string, day: string };
		if (g !== undefined) effectiveDate = `${g.day}-${months[parseInt(g.month) - 1]}-20${g.year}`;
	}


	return {
		settingValues,
		effectiveDate,
		numApproaches: await prisma.approachOptions.count(),
		options
	};
};

export const actions = {
	updateOptions: async ({ request }) => {
		const data = await request.formData();

		const entryMXMode = (data.get('entry.entryMXMode') ?? undefined) as undefined | string;
		if (entryMXMode !== undefined) await settings.set('entry.entryMXMode', entryMXMode === 'true');

	},
	updateApproaches: async ({ request }) => {
		const data = await request.formData();

		const option = data.get('approach.option') as string | null;

		console.log(option);

		if (option === null) return API.Form.formFailure('?/updateApproaches', 'approach.option', 'Required field');

		const source = `https://aeronav.faa.gov/Upload_313-d/cifp/${option}`;
		// const zipRaw = await fetch(source);
		// if (zipRaw.status !== 200) {
		// 	console.log('ERROR: Source not found', source, zipRaw);
		// 	return API.Form.formFailure('?/updateApproaches', 'approach.option', 'Source not found: ' + zipRaw.statusText);
		// }

		// console.log(zipRaw.type);
		// zipRaw.headers.forEach((v, k) => {
		// 	console.log(k, '=', v);
		// });


	
		// const timezone = (data.get('general.timezone') ?? undefined) as undefined | string;
		// if (timezone !== undefined) await settings.set('general.timezone', timezone);

		try {
			const { entries } = await unzip(source);

			// print all entries and their sizes
			// console.log(entries);
			let found = false;
			for (const entry of Object.entries(entries)) {
				const [key, _] = entry;
				if (key === 'IN_CIFP.txt') {
					found = true;
					break;
				}
			}

			if (found === false) throw Error('Could not find \'IN_CIFP.txt\' file in zip');

			console.log(found);

			// read an entry as text
			const text = (await entries['IN_CIFP.txt'].text()).split('\n');



			// Clear the current approach table
			await prisma.approachOptions.deleteMany({});

			const inserts: Types.Prisma.PrismaPromise<any>[] = [];
			// Loop through each position
			for (const line of text) {
				const fields = line.split('\t');
				const apt = fields[0];
				const t = fields[1];
				const app = fields[2];
				if (t !== 'SIAP') continue;

				let type: string;
				switch (app.charAt(0)) {
					case 'R':
						type = 'RNAV (GPS)';
						break;
					case 'H':
						// type = 'HI-VOR or TACAN';
						type = 'RNAV (RNP)';
						break;
					case 'D':
						type = 'VOR/DME';
						break;
					case 'X':
						type = 'LDA';
						break;
					case 'B':
						type = 'LOC BC';
						break;
					case 'I':
						type = 'ILS';
						break;
					case 'L':
						switch (app.substring(0, 3)) {
							case 'LDA':
								type = 'LDA';
								break;
							case 'LBC':
								type = 'LOC BC';
								break;
							default:
								type = 'LOC';
								break;
						}
						break;
					case 'N':
					case 'Q':
						type = 'NDB';
						break;
					case 'S':
						type = 'VOR';
						break;
					case 'G':
					case 'P':
						type = 'GPS';
						break;
					case 'U':
						type = 'SDF';
						break;
					case 'V':
						switch (app.substring(0, 3)) {
							case 'VOR':
								type = 'VOR';
								break;
							case 'VDM':
								type = 'VOR/DME';
								break;
							default:
								type = 'VOR';
								break;
						}
						break;
					default:
						console.log(apt, app);
						continue;
				}

				const rwRegex = /(?<runway>[0-9][0-9][RLC]?)/gm;
				let r = rwRegex.exec(app.substring(1));
				const runway = r?.groups?.runway ?? '';

				const tagRegex = /[-]?(?<tag>[ABDEFGHIJKMNOPQSTUWXYZ]?)$/gm;
				let tagRaw = tagRegex.exec(app.substring(1));
				const tag = tagRaw?.groups?.tag ?? '';


				const composite = `${type}${tag === '' ? '' : ' ' + tag}${runway === '' ? '' : ' Rwy ' + runway}`;

				// console.log(apt, composite, app);

				inserts.push(prisma.approachOptions.create({ data: {
					airportId: apt,
					type,
					tag,
					runway,
					composite
				}}));
			}

			try {
				// Execute the prisma transaction that will add all the points
				await prisma.$transaction(inserts)


				await settings.set('data.approaches.source', option);
				await settings.set('data.approaches.lastSync', Math.floor(Date.now() / 1000));

			} catch (e) {
				const err = e as Error;
				console.log('Unable to add approaches!', e);
				return API.Form.formFailure('?/updateApproaches', 'approach.option', 'Unable to save: ' + err.message);
			}

			


		} catch (e) {
			const err = e as Error;
			console.log('ERROR: Source not found', source, e);
			return API.Form.formFailure('?/updateApproaches', 'approach.option', 'Source error: ' + err.message);
		}

		console.log('Approaches');

	}
};
