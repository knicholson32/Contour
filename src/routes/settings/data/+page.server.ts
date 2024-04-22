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

	const settingValues = await settings.getMany('data.approaches.lastSync', 'data.aircraftReg.lastSync', 'data.approaches.source', 'entry.entryMXMode');

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

	let years: string | null = null;

	const y0 = await prisma.aircraftRegistrationLookup.findFirst({ where: { manufactureYear: { not: 0 } }, orderBy: { manufactureYear: 'asc' }, select: { manufactureYear: true }});
	const y1 = await prisma.aircraftRegistrationLookup.findFirst({ where: { manufactureYear: { not: 0 } }, orderBy: { manufactureYear: 'desc' }, select: { manufactureYear: true }});

	if (y0 !== null && y1 !== null) years = `${y0.manufactureYear} - ${y1.manufactureYear}`;


	return {
		settingValues,
		effectiveDate,
		numApproaches: await prisma.approachOptions.count(),
		numRegs: await prisma.aircraftRegistrationLookup.count(),
		years,
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



			// Clear the current approach table (except the custom approach entries)
			await prisma.approachOptions.deleteMany({ where: { custom: false } });

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


				// TODO: Break this into a shared function. Also used in InstrumentApproach.svelte
				const composite = `${type}${tag === '' ? '' : ' ' + tag}${runway === '' ? '' : ' Rwy ' + runway}`;

				// console.log(apt, composite, app);

				inserts.push(prisma.approachOptions.create({
					data: {
						airportId: apt,
						type,
						tag,
						runway,
						composite
					}
				}));
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

	},

	updateRegLookup: async ({ request }) => {
		const data = await request.formData();

		const update = data.get('update.switch') === 'true';

		if (update === false) return;

		// https://www.faa.gov/licenses_certificates/aircraft_certification/aircraft_registry/releasable_aircraft_download
		const source = `https://registry.faa.gov/database/ReleasableAircraft.zip`;

		try {
			const { entries } = await unzip(source);

			// print all entries and their sizes
			// console.log(entries);
			let found = {
				master: false,
				acftref: false
			}
			for (const entry of Object.entries(entries)) {
				const [key, _] = entry;
				if (key === 'MASTER.txt') {
					found.master = true;
				}
				if (key === 'ACFTREF.txt') {
					found.acftref = true;
				}
			}

			if (found.master === false || found.acftref === false) {
				if (found.master === true) throw Error('Could not find \'ACFTREF.txt\' file in zip');
				if (found.acftref === true) throw Error('Could not find \'MASTER.txt\' file in zip');
				throw Error('Could not find \'MASTER.txt\' or \'ACFTREF.txt\' file in zip');
			}

			console.log(found);

			// read an entry as text
			// const aircraftRef = (await entries['ACFTREF.txt'].text()).split('\n');
			const master = (await entries['MASTER.txt'].text()).split('\n');


			// Clear the current approach table (except the custom approach entries)
			await prisma.aircraftRegistrationLookup.deleteMany({ });

			const inserts: Types.Prisma.PrismaPromise<any>[] = [];
			// Loop through each position
			for (const line of master) {
				const fields = line.split(',');
				if (fields.length < 5) continue;
				const reg = fields[0].trim();
				if (reg === 'N-NUMBER') continue;

				const serial = fields[1].trim();
				// const manufactureCode = fields[2].trim();
				const year = parseInt(fields[4].trim());
				if (isNaN(year)) continue;

				inserts.push(prisma.aircraftRegistrationLookup.create({
					data: {
						reg,
						serial,
						manufactureYear: year,
					}
				}));
			}

			try {

				// if (inserts.length > 1000) {
				// 	while (inserts.length > 0) {
				// 		const insertsPage = inserts.splice(0, 1000)
				// 		// Execute the prisma transaction that  will add all the points
				// 		console.log('1000 set');
				// 		await prisma.$transaction(insertsPage)
				// 	}
				// } else {
					await prisma.$transaction(inserts)
				// }


				// await settings.set('data.approaches.source', option);
				await settings.set('data.aircraftReg.lastSync', Math.floor(Date.now() / 1000));

			} catch (e) {
				const err = e as Error;
				console.log('Unable to add aircraft registrations!', e);
				return API.Form.formFailure('?/updateRegLookup', 'update.switch', 'Unable to save: ' + err.message);
			}




		} catch (e) {
			const err = e as Error;
			console.log('ERROR: Source not found', source, e);
			return API.Form.formFailure('?/updateRegLookup', 'update.switch', 'Source error: ' + err.message);
		}

		console.log('Approaches');

	}
};
