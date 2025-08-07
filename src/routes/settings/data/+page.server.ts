import prisma from '$lib/server/prisma';
import * as settings from '$lib/server/settings';
import { API, type NavAirway, type NavDPRoute, type NavFix, type NavNav, type NavSTARRoute } from '$lib/types';
import { unzip, type ZipInfo } from 'unzipit';
import type * as Types from '@prisma/client';
import neatCsv from "neat-csv";
import { lookupSIDOrSTAR } from '$lib/server/helpers';
import readXlsxFile from 'read-excel-file/node'
import { getDistanceFromLatLonInKm } from '$lib/helpers';
import { pad } from '$lib/helpers';
import { v4 as uuidv4 } from 'uuid';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthsAlt = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Data Sources
// Approach Data:			https://aeronav.faa.gov/Upload_313-d/cifp/
// Aircraft Data: 		https://registry.faa.gov/database/ReleasableAircraft.zip
// Nav Data: 					https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/XXX-XX-XX/  ->  https://nfdc.faa.gov/webContent/28DaySub/extra/21_Mar_2024_CSV.zip

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {

	const indexRaw = await fetch('https://aeronav.faa.gov/Upload_313-d/cifp/');
	if (indexRaw.status !== 200) console.log('ERROR: Unable to fetch aeronav data: Status', indexRaw.status, indexRaw.statusText);
	const index = await indexRaw.text()

	const settingValues = await settings.getMany(
		'data.approaches.lastSync',
		'data.approaches.source',
		'data.aircraftReg.lastSync',
		'data.navData.lastSync',
		'data.navData.source',
		'data.navData.validDate',
		'entry.entryMXMode'
	);

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


	const navDataOptions: { title: string, value: string, date?: Date, unset?: boolean }[] = [{
		title: 'Select an Option',
		unset: true,
		value: 'unset'
	}];

	const starterDate = new Date('01/26/2023 00:00:00Z');
	const now = new Date();

	while (starterDate < now) starterDate.setUTCDate(starterDate.getUTCDate() + 28);
	starterDate.setUTCDate(starterDate.getUTCDate() - 28 - 28);
	for (let i = 0; i < 3; i++) {
		navDataOptions.push({
			title: `Effective ${starterDate.getUTCDate()}-${months[starterDate.getUTCMonth()]}-${starterDate.getUTCFullYear()}`,
			value: starterDate.getTime().toFixed(0)
		});
		starterDate.setUTCDate(starterDate.getUTCDate() + 28);
	}

	let effectiveDate = 'None';
	if (settingValues['data.approaches.source'] !== '') {
		const splitter = /(?<year>[0-9][0-9])(?<month>[0-9][0-9])(?<day>[0-9][0-9])/gm;
		const g = splitter.exec(settingValues['data.approaches.source'])?.groups as undefined | { year: string, month: string, day: string };
		if (g !== undefined) effectiveDate = `${g.day}-${months[parseInt(g.month) - 1]}-20${g.year}`;
	}

	let effectiveDateNav = 'None';
	if (settingValues['data.navData.validDate'] !== -1) {
		const d = new Date(settingValues['data.navData.validDate'] * 1000);
		effectiveDateNav = `${d.getUTCDate()}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
	}

	let years: string | null = null;

	const y0 = await prisma.aircraftRegistrationLookup.findFirst({ where: { manufactureYear: { not: 0 } }, orderBy: { manufactureYear: 'asc' }, select: { manufactureYear: true }});
	const y1 = await prisma.aircraftRegistrationLookup.findFirst({ where: { manufactureYear: { not: 0 } }, orderBy: { manufactureYear: 'desc' }, select: { manufactureYear: true }});

	if (y0 !== null && y1 !== null) years = `${y0.manufactureYear} - ${y1.manufactureYear}`;


	// const star = await lookupSIDOrSTAR('STAR', 'PIRAT', 'CINNY', { airport: 'KOAK' });
	// console.log(JSON.stringify(star));


	return {
		settingValues,
		effectiveDate,
		effectiveDateNav,
		numFlightOptions: await prisma.option.count(),
		numApproaches: await prisma.approachOptions.count(),
		numRegs: await prisma.aircraftRegistrationLookup.count(),
		numFixes: await prisma.navDataNav.count(),
		numAirways: await prisma.navDataAirway.count(),
		years,
		options,
		navDataOptions
	};
};

export const actions = {
	updateOptions: async ({ request }) => {
		const data = await request.formData();

		const debug = await settings.get('system.debug');

		const entryMXMode = (data.get('entry.entryMXMode') ?? undefined) as undefined | string;
		if (entryMXMode !== undefined) await settings.set('entry.entryMXMode', entryMXMode === 'true');

		const clearOptions = data.get('options.clear') === 'true';
		if (clearOptions) await prisma.option.deleteMany({ });

		const migrateUseBlock = data.get('useBlock.migrate') === 'true';
		if (migrateUseBlock) { 

			// Get all legs for us to parse through
			const legs = await prisma.leg.findMany({ select: { startTime_utc: true, endTime_utc: true, id: true, useBlock: true, aircraft: { select: { simulator: true } }, day: { select: { startTime_utc: true, endTime_utc: true } } } });

			// Use a transaction (faster)
			const mods: Types.Prisma.PrismaPromise<any>[] = [];
			
			// Loop through all the legs
			for (const leg of legs) {

				// If the leg is already using block time, nothing to migrate
				if (leg.useBlock === true) continue;

				// If the leg has a duty day, it probably will be using block
				if (leg.day !== null) {
					// Check if this is a simulator though
					if (leg.aircraft.simulator === true) {
						// Only use block if it is already using block times. We can tell because the start time doesn't match the day's start time
						if (leg.startTime_utc !== leg.day.startTime_utc) {
							// They don't match. Use block.
							if (debug > 0) console.log('Migrating leg', leg.id, ': USE BLOCK', leg.startTime_utc);
							mods.push(prisma.leg.update({ where: { id: leg.id }, data: { useBlock: true } }));			
						}
					} else {
						// It isn't. Use block.
						if (debug > 0) console.log('Migrating leg', leg.id, ': USE BLOCK', leg.startTime_utc);
						mods.push(prisma.leg.update({ where: { id: leg.id }, data: { useBlock: true } }));		
					}
				}
			}

			try {
				// Execute the prisma transaction
				await prisma.$transaction(mods)
			} catch (e) {
				console.log('Error: Unable to migrate useBlock', e);
				return API.Form.formFailure('?/updateOptions', 'useBlock.migrate', 'Unable to migrate: ' + e);
			}
		}

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
			let type: 'txt' | 'xlsx' = 'txt';
			for (const entry of Object.entries(entries)) {
				const [key, _] = entry;
				if (key === 'IN_CIFP.txt') {
					found = true;
					type = 'txt';
					break;
				} else if (key === 'IN_CIFP.xlsx') {
					found = true;
					type = 'xlsx';
					break;
				}
			}

			if (found === false) throw Error('Could not find \'IN_CIFP.txt\' or \'IN_CIFP.xlsx\' file in zip');


			// read an entry as text

			let rows: string[][] = [];

			if (type === 'txt') rows = (await entries['IN_CIFP.txt'].text()).split('\n').map(r => r.split('\t'));
			else if (type === 'xlsx') {
				const xlRow = await readXlsxFile(Buffer.from(await entries['IN_CIFP.xlsx'].arrayBuffer()));
				for (const r of xlRow) rows.push([ r[0].toString(), r[1].toString(), r[2].toString()]);
			}
			else throw Error(`Could not parse file: unimplemented format: '${type}'`);

			

			// Clear the current approach table (except the custom approach entries)
			await prisma.approachOptions.deleteMany({ where: { custom: false } });

			const inserts: Types.Prisma.PrismaPromise<any>[] = [];

			// Loop through each position
			for (const fields of rows) {
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
			await prisma.aircraftRegistrationLookup.deleteMany({});

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
				await prisma.$transaction(inserts)
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

	},

	updateNavData: async ({ request }) => {
		
		const data = await request.formData();
		const option = data.get('nav.option') as string | null;
		if (option === null || option === 'unset' || isNaN(parseInt(option))) return API.Form.formFailure('?/updateApproaches', 'approach.option', 'Required field');
		const optionDate = new Date(parseInt(option));

		const sourceKey = `${pad(optionDate.getUTCDate(), 2)}_${months[optionDate.getUTCMonth()]}_${optionDate.getUTCFullYear()}_CSV.zip`;
		const source = `https://nfdc.faa.gov/webContent/28DaySub/extra/${sourceKey}`;

		const sourceKeyAlt = `${pad(optionDate.getUTCDate(), 2)}_${monthsAlt[optionDate.getUTCMonth()]}_${optionDate.getUTCFullYear()}_CSV.zip`;
		const sourceAlt = `https://nfdc.faa.gov/webContent/28DaySub/extra/${sourceKeyAlt}`;

		// console.log(source);
		// return;

		try {
			let zip: ZipInfo | null = null;

			try {
				console.log('Loading', source)
				zip = await unzip(source);
			} catch (e) {
				try {
					console.log('Loading', sourceAlt)
					zip = await unzip(sourceAlt);
				} catch (e) {
					throw Error('Zip could not load: ' + e);
				}
			}

			if (zip === null) throw Error('Zip could not load');
			const entries = zip.entries;

			// print all entries and their sizes
			let found = {
				nav: false,
				fix: false,
				airway: false,
				sid: false,
				star: false,
			}
			for (const entry of Object.entries(entries)) {
				const [key, _] = entry;
				if (key === 'NAV_BASE.csv') {
					found.nav = true;
				}
				if (key === 'FIX_BASE.csv') {
					found.fix = true;
				}
				if (key === 'AWY_BASE.csv') {
					found.airway = true;
				}
				if (key === 'DP_RTE.csv') {
					found.sid = true;
				}
				if (key === 'STAR_RTE.csv') {
					found.star = true;
				}
			}

			if (found.nav === false || found.fix === false || found.airway === false || found.sid === false || found.star === false) {
				let missing: string[] = [];
				if (found.nav === false) missing.push('NAV_BASE.csv');
				if (found.fix === false) missing.push('FIX_BASE.csv');
				if (found.airway === false) missing.push('AWY_BASE.csv');
				if (found.sid === false) missing.push('DP_RTE.csv');
				if (found.star === false) missing.push('STAR_RTE.csv');
				return API.Form.formFailure('?/updateNavData', 'nav.option', `Missing files in Navigation Data (${source}): ${missing.join(', ')}`);
			}



			const nav = {
				nav: await neatCsv(await entries['NAV_BASE.csv'].text()) as NavNav[],
				fixes: await neatCsv(await entries['FIX_BASE.csv'].text()) as NavFix[],
				airways: await neatCsv(await entries['AWY_BASE.csv'].text()) as NavAirway[],
				sids: await neatCsv(await entries['DP_RTE.csv'].text()) as NavDPRoute[],
				stars: await neatCsv(await entries['STAR_RTE.csv'].text()) as NavSTARRoute[],
			}

			// Clear the current nav data
			await prisma.navDataSIDSTARRouteSegment.deleteMany({});
			await prisma.navDataSIDSTAR.deleteMany({});
			await prisma.navDataAirway.deleteMany({});
			await prisma.navDataNav.deleteMany({});


			let inserts: Types.Prisma.PrismaPromise<any>[] = [];

			// Add the Nav and Fixes to the nav data
			for (const n of nav.nav) {
				inserts.push(prisma.navDataNav.create({
					data: {
						id: n.NAV_ID,
						name: n.NAME,
						type: n.NAV_TYPE,
						latitude: parseFloat(n.LAT_DECIMAL),
						longitude: parseFloat(n.LONG_DECIMAL)
					}
				}));
			}

			for (const n of nav.fixes) {
				inserts.push(prisma.navDataNav.create({
					data: {
						id: n.FIX_ID,
						type: 'FIX',
						latitude: parseFloat(n.LAT_DECIMAL),
						longitude: parseFloat(n.LONG_DECIMAL)
					}
				}));
			}

			let navData = await prisma.$transaction(inserts) as Types.Prisma.NavDataNavGetPayload<{}>[];
			navData = navData.filter((fix) => fix.type !== 'VOT' && fix.type !== 'FAN MARKER');

			inserts = [];
			for (const a of nav.airways) {
				const connectionArr: Types.Prisma.NavDataNavWhereUniqueInput[] = [];
				const airwayEntries = a.AIRWAY_STRING.trim().split(' ');
				let skipAirway = false;
				for (const f of airwayEntries) {
					const fixes = navData.filter((fix) => fix.id === f);
					if (fixes.length === 0) {
						console.error(`No fix found: ${f}`);
					} else if (fixes.length === 1) {
						connectionArr.push({ index: fixes[0].index });
					} else {
						// Check if they all share the same name or if the points are near (ish, within 50Km of the first point) to each other. If so, we will try to pick the VOR if it exists
						if (fixes.every((fix) => fix.name === fixes[0].name) || fixes.every((fix) => getDistanceFromLatLonInKm(fix.latitude, fix.longitude, fixes[0].latitude, fixes[0].longitude) < 50)) {
							const fixesVOR = fixes.filter((fix) => fix.type.indexOf('VOR') !== -1);
							if (fixesVOR.length === 0) {
								connectionArr.push({ index: fixes[0].index });
							} else {
								connectionArr.push({ index: fixesVOR[0].index });
							}
						} else {
							console.error(`Multiple fixes found: ${a.AWY_ID} : ${JSON.stringify(fixes)} : skipping airway!`);
							skipAirway = true;
							break;
						}
					}
				}

				if (!skipAirway) {
					inserts.push(prisma.navDataAirway.create({
						data: {
							id: a.AWY_ID,
							airwayString: a.AIRWAY_STRING,
							region: a.AWY_LOCATION,
							fixes: { connect: connectionArr }
						}
					}));
				}
			}

			
			// Save airway and nav points
			await prisma.$transaction(inserts) as Types.Prisma.NavDataAirwayGetPayload<{}>[];
			inserts = [];

			let ids: string[] = [];

			// SID --------------------------------------------------------
			{
				let parsing = true;

				let row: NavDPRoute | undefined = undefined;
				let set: NavDPRoute[] = [];
				let routeName: string;
				let dpComputerCode: string;

				let index = 0;

				let runwaySets: string[] = [];
				let transitionSets: string[] = [];
				let airportsServiced: string[] = [];

				while (parsing) {
					// Get the current row
					row = nav.sids[index];
					// Get the DP name
					dpComputerCode = row.DP_COMPUTER_CODE;
					// Clear the set ID arrays
					runwaySets = [];
					transitionSets = [];
					airportsServiced = [];
					// Loop until we get to another DP
					while (row !== undefined && row.DP_COMPUTER_CODE === dpComputerCode) {
						// Clear the current set
						set = [];
						// Get the current row
						row = nav.sids[index];
						// Get the route name. We will use the route name to get a set of points
						routeName = row.ROUTE_NAME;
						// Loop until we get to another row
						while (row !== undefined && row.ROUTE_NAME === routeName) {
							// Add this row to the set
							set.push(row);
							// Get and assign the next row
							row = nav.sids[index++];
						}
						// Go back an index so we can get this row again for the next round
						index--;

						// We need to parse the set
						if (set.length > 0) {

							// Resolve the points for this segment
							const points: string[] = [];
							const fixIndices: number[] = [];
							// Add each point to an array in reverse order (because it is a SID)
							for (const s of set) if (!points.includes(s.POINT)) points.unshift(s.POINT);
							// Get all fixes based on the list of point names
							const fixes = await prisma.navDataNav.findMany({ where: { id: { in: points } } });
							// Generate an array to assist in connecting fixes to this segment
							const fixesConnect: Types.Prisma.NavDataNavWhereUniqueInput[] = [];
							// Loop through the points (fixes) and connect them
							for (const point of points) {
								const pt = fixes.find((v) => v.id === point);
								if (pt !== undefined) {
									fixesConnect.push({ index: pt.index });
									fixIndices.push(pt.index);
								}
							}

							// Check if this is a runway segment (body) or a transition segment
							if (set[0].ROUTE_PORTION_TYPE === 'BODY') {
								// It is a runway segment. We need to duplicate this segment for each runway option

								// Get the airport-runway combos for this set
								const aptRunways = set[0].ARPT_RWY_ASSOC.split(', ');

								// Loop for each of those combos
								for (const aptRunway of aptRunways) {
									// Generate an ID for this segment
									const id = uuidv4();
									// Add the ID to the list of IDs to add to this SID entry
									runwaySets.push(id);
									// Generate the identifier
									const split = aptRunway.split('/');
									const airport = isNaN(parseInt(split[0].charAt(0))) ? 'K' + split[0] : split[0];
									if (!airportsServiced.includes(airport)) airportsServiced.push(airport);
									const runway = split.length > 1 ? split[1] : null
									// Add the segment
									inserts.push(prisma.navDataSIDSTARRouteSegment.create({
										data: {
											id,
											airport: airport,
											runway: runway,
											name: set[0].ROUTE_NAME,
											type: set[0].ROUTE_PORTION_TYPE,
											fixes: { connect: fixesConnect },
											fixesOrder: fixIndices.join(', ')
										}
									}));
								}
							} else {
								// It is a transition segment. Add it normally.
								// Generate an ID for this segment
								const id = uuidv4();
								// Add the ID to the list of IDs to add to this SID entry
								transitionSets.push(id);
								// Add the segment
								inserts.push(prisma.navDataSIDSTARRouteSegment.create({
									data: {
										id,
										identifier: set[0].TRANSITION_COMPUTER_CODE.split('.')[1],
										name: set[0].ROUTE_NAME,
										type: set[0].ROUTE_PORTION_TYPE,
										fixes: { connect: fixesConnect },
										fixesOrder: fixIndices.join(', ')
									}
								}));
							}
						}
					}

					// This DP is resolved. We can save it.
					// Resolve the runway and transition sets
					const runwayLeads: Types.Prisma.NavDataSIDSTARRouteSegmentWhereUniqueInput[] = [];
					const transitions: Types.Prisma.NavDataSIDSTARRouteSegmentWhereUniqueInput[] = [];
					for (const rSet of runwaySets) runwayLeads.push({ id: rSet });
					for (const tSet of transitionSets) transitions.push({ id: tSet });

					// Get the SID revision number
					const code = dpComputerCode.split('.')[0];
					const codeParsed = parseInt(code.charAt(code.length - 1));
					const revision = isNaN(codeParsed) ? 1 : codeParsed;

					if (code !== 'NOT ASSIGNED') {
						// Save the DP
						const id = code.substring(0, code.length - 1);
						if(!ids.includes(id)) {
							ids.push(id);
							inserts.push(prisma.navDataSIDSTAR.create({
								data: {
									id: code.substring(0, code.length - 1),
									revision,
									airportsServiced: airportsServiced.join(', '),
									type: 'DP',
									runwayLeads: { connect: runwayLeads },
									transitions: { connect: transitions },
								}
							}));
						} else {
							console.log('DUPLICATE SID/STAR. SKIPPING:', id);
						}
					}
					// If the row is undefined, we are at the end. Parsing is done
					if (row === undefined) parsing = false;
				}
			}

			// STAR -------------------------------------------------------
			{
				let parsing = true;

				let row: NavSTARRoute | undefined = undefined;
				let set: NavSTARRoute[] = [];
				let routeName: string;
				let starComputerCode: string;

				let index = 0;

				let runwaySets: string[] = [];
				let transitionSets: string[] = [];
				let airportsServiced: string[] = [];

				

				while (parsing) {
					// Get the current row
					row = nav.stars[index];
					// Get the STAR name
					starComputerCode = row.STAR_COMPUTER_CODE;
					// Clear the set ID arrays
					runwaySets = [];
					transitionSets = [];
					airportsServiced = [];
					// Loop until we get to another STAR
					while (row !== undefined && row.STAR_COMPUTER_CODE === starComputerCode) {
						// Clear the current set
						set = [];
						// Get the current row
						row = nav.stars[index];
						// Get the route name. We will use the route name to get a set of points
						routeName = row.ROUTE_NAME;
						// Loop until we get to another row
						while (row !== undefined && row.ROUTE_NAME === routeName) {
							// Add this row to the set
							set.push(row);
							// Get and assign the next row
							row = nav.stars[index++];
						}
						// Go back an index so we can get this row again for the next round
						index--;

						// We need to parse the set
						if (set.length > 0) {

							// Resolve the points for this segment
							const points: string[] = [];
							const fixIndices: number[] = [];
							// Add each point to an array
							for (const s of set) if (!points.includes(s.POINT)) points.unshift(s.POINT);
							// Get all fixes based on the list of point names
							const fixes = await prisma.navDataNav.findMany({ where: { id: { in: points } } });
							// Generate an array to assist in connecting fixes to this segment
							const fixesConnect: Types.Prisma.NavDataNavWhereUniqueInput[] = [];
							// Loop through the points (fixes) and connect them
							for (const point of points) {
								const pt = fixes.find((v) => v.id === point);
								if (pt !== undefined) {
									fixesConnect.push({ index: pt.index });
									fixIndices.push(pt.index);
								}
							}

							// Check if this is a runway segment (body) or a transition segment
							if (set[0].ROUTE_PORTION_TYPE === 'BODY') {
								// It is a runway segment. We need to duplicate this segment for each runway option

								// Get the airport-runway combos for this set
								const aptRunways = set[0].ARPT_RWY_ASSOC.split(', ');

								// Loop for each of those combos
								for (const aptRunway of aptRunways) {
									// Generate an ID for this segment
									const id = uuidv4();
									// Add the ID to the list of IDs to add to this SID entry
									runwaySets.push(id);
									// Generate the identifier
									const split = aptRunway.split('/');
									const airport = isNaN(parseInt(split[0].charAt(0))) ? 'K' + split[0] : split[0];
									if (!airportsServiced.includes(airport)) airportsServiced.push(airport);
									const runway = split.length > 1 ? split[1] : null
									// Add the segment
									inserts.push(prisma.navDataSIDSTARRouteSegment.create({
										data: {
											id,
											airport: airport,
											runway: runway,
											name: set[0].ROUTE_NAME,
											type: set[0].ROUTE_PORTION_TYPE,
											fixes: { connect: fixesConnect },
											fixesOrder: fixIndices.join(', ')
										}
									}));
								}
							} else {
								// It is a transition segment. Add it normally.
								// Generate an ID for this segment
								const id = uuidv4();
								// Add the ID to the list of IDs to add to this SID entry
								transitionSets.push(id);
								// Add the segment
								inserts.push(prisma.navDataSIDSTARRouteSegment.create({
									data: {
										id,
										identifier: set[0].TRANSITION_COMPUTER_CODE.split('.')[0],
										name: set[0].ROUTE_NAME,
										type: set[0].ROUTE_PORTION_TYPE,
										fixes: { connect: fixesConnect },
										fixesOrder: fixIndices.join(', ')
									}
								}));
							}
						}
					}

					// This STAR is resolved. We can save it.
					// Resolve the runway and transition sets
					const runwayLeads: Types.Prisma.NavDataSIDSTARRouteSegmentWhereUniqueInput[] = [];
					const transitions: Types.Prisma.NavDataSIDSTARRouteSegmentWhereUniqueInput[] = [];
					for (const rSet of runwaySets) runwayLeads.push({ id: rSet });
					for (const tSet of transitionSets) transitions.push({ id: tSet });

					// Get the STAR revision number
					const code = starComputerCode.split('.')[1];
					const codeParsed = parseInt(code.charAt(code.length - 1));
					const revision = isNaN(codeParsed) ? 1 : codeParsed;

					if (code !== 'NOT ASSIGNED') {

						const id = code.substring(0, code.length - 1);
						if(!ids.includes(id)){
							ids.push(id);
							// Save the STAR
							inserts.push(prisma.navDataSIDSTAR.create({
								data: {
									id: id,
									revision,
									airportsServiced: airportsServiced.join(', '),
									type: 'STAR',
									runwayLeads: { connect: runwayLeads },
									transitions: { connect: transitions },
								}
							}));
					  } else {
							console.log('DUPLICATE SID/STAR. SKIPPING:', id);
						}
					}
					// If the row is undefined, we are at the end. Parsing is done
					if (row === undefined) parsing = false;
				}
			}

			// Save airway and nav points
			await prisma.$transaction(inserts) as Types.Prisma.NavDataAirwayGetPayload<{}>[];

			await settings.set('data.navData.lastSync', Math.floor(new Date().getTime() / 1000));
			await settings.set('data.navData.source', `https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/${optionDate.getUTCFullYear()}-${pad(optionDate.getUTCMonth() + 1, 2)}-${pad(optionDate.getUTCDate(), 2)}`);
			await settings.set('data.navData.validDate', Math.floor(optionDate.getTime() / 1000));

		} catch (e) {
			const err = e as Error;
			console.log('ERROR: Source not found', source, e);
			return API.Form.formFailure('?/updateNavData', 'nav.option', 'Source error: ' + err.message);
		}

	}
};
