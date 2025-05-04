import * as settings from '$lib/server/settings';
import * as crypto from 'node:crypto';
import sunCalc from 'suncalc';
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import prisma from '$lib/server/prisma';
import * as helpers from '$lib/helpers';
import type * as Types from '@prisma/client';
import { MEDIA_FOLDER } from '$lib/server/env';

const ENC_SALT = 'CONTOUR_SALT'



export const getPackageVersion = (pkg: string) => {
	const packageJsonPath = process.env.NODE_ENV === 'development' ? process.env.PWD + '/package.json' : '/app/package.json';
	try {
		const file = fs.readFileSync(packageJsonPath, 'utf8');
		const packageJson = JSON.parse(file);
		if (pkg in packageJson.devDependencies) {
			return packageJson.devDependencies[pkg].substring(1);
		} else if (pkg in packageJson.dependencies) {
			return packageJson.dependencies[pkg].substring(1);
		} else{
			console.error(`Error reading package.json: No package installed in package.json`);
			return null;
		}
	} catch (error) {
		console.error(`Error reading package.json: ${error}`);
		return null;
	}
}


export const isNightOperation = (now: Date, lat: number, lon: number): boolean => {
	const calc = sunCalc.getTimes(now, lat, lon);
	const sunsetPlus1Hr = new Date(calc.dusk.getTime() + 1 * 60 * 60 * 1000);
	const sunriseMinus1Hr = new Date(calc.dawn.getTime() - 1 * 60 * 60 * 1000);
	return now < sunriseMinus1Hr || now > sunsetPlus1Hr;
}

/**
 * Generate a list of airport objects from airport ICAO codes
 * @param airports the base airport list
 * @param args the variable ICAO airport codes
 * @returns the list of airport obkects
 */
export const generateAirportList = async (...args: (string | null)[]): Promise<Types.Airport[]> => {
	const icaoOptions: string[] = [];
	for (const a of args) if (a !== null) icaoOptions.push(a);
	const airports = await prisma.airport.findMany({ where: { id: { in: icaoOptions } } });
	const exportAirports: Types.Airport[] = [];

	let lastAirport: Types.Airport | null = null;

	for (const icao of icaoOptions) {
		let search: Types.Airport | null = null;
		for (const airport of airports) {
			if (icao === airport.id) {
				search = airport;
				break;
			}
		}
		if (search !== null) {
			if (search !== lastAirport) {
				lastAirport = search;
				exportAirports.push(search);
			}
		}
	}

	return exportAirports;
}


export type Images = {
	original: string;
	fullJpeg: string; 
	fullAvif: string;
	i2048Jpeg: string;
	i2048Avif: string;
	i1024Jpeg: string;
	i1024Avif: string;
	i768Jpeg: string;
	i768Avif: string;
	i512Jpeg: string;
	i512Avif: string;
	i256Jpeg: Buffer;
	i256Avif: Buffer;
	i128Jpeg: Buffer;
	i128Avif: Buffer;
};

export const cropImages = async (image: ArrayBuffer, id: string): Promise<Images | null> => {
	const imageBuffer = helpers.toBuffer(image);
	const initial = sharp(imageBuffer).rotate();

	const promiseList: Promise<void>[] = [];
	const ret: Images = { } as Images;
	
	promiseList.push(new Promise<void>(async (resolve, reject) => {
		try {
			const name = `${id}-original.jpeg`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, imageBuffer);
			ret.original = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			const name = `${id}-full.jpeg`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, await initial.clone().jpeg().toBuffer());
			ret.fullJpeg = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			const name = `${id}-full.avif`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, await initial.clone().avif().toBuffer());
			ret.fullAvif = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			const name = `${id}-2048.jpeg`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, await initial.clone().resize({ width: 2048, withoutEnlargement: true }).jpeg().toBuffer());
			ret.i2048Jpeg = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			const name = `${id}-2048.avif`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, await initial.clone().resize({ width: 2048, withoutEnlargement: true }).avif().toBuffer());
			ret.i2048Avif = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			const name = `${id}-1024.jpeg`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, await initial.clone().resize({ width: 1024, withoutEnlargement: true }).jpeg().toBuffer());
			ret.i1024Jpeg = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			const name = `${id}-1024.avif`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, await initial.clone().resize({ width: 1024, withoutEnlargement: true }).avif().toBuffer());
			ret.i1024Avif = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			const name = `${id}-768.jpeg`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, await initial.clone().resize({ width: 768, withoutEnlargement: true }).jpeg().toBuffer());
			ret.i768Jpeg = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			const name = `${id}-768.avif`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, await initial.clone().resize({ width: 768, withoutEnlargement: true }).avif().toBuffer());
			ret.i768Avif = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			const name = `${id}-512.jpeg`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, await initial.clone().resize({ width: 512, withoutEnlargement: true }).jpeg().toBuffer());
			ret.i512Jpeg = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			const name = `${id}-512.avif`;
			fs.writeFileSync(`${MEDIA_FOLDER}/${name}`, await initial.clone().resize({ width: 512, withoutEnlargement: true }).avif().toBuffer());
			ret.i512Avif = name;
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i256Jpeg = await initial.clone().resize({ width: 256, withoutEnlargement: true }).jpeg().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i256Avif = await initial.clone().resize({ width: 256, withoutEnlargement: true }).avif().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i128Jpeg = await initial.clone().resize({ width: 128, withoutEnlargement: true }).jpeg().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i128Avif = await initial.clone().resize({ width: 128, withoutEnlargement: true }).avif().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));

	try {
		const p = await Promise.allSettled(promiseList);
		for (const res of p) if (res.status === 'rejected') return null
	} catch(e) {
		console.log('Error cropping images', e);
		return null;
	}

	return ret;
};


type UploadImageResult = uploadSuccess | uploadFail;

interface uploadSuccess {
	success: true,
	id: string
}

interface uploadFail {
	success: false,
	message: string
}

/**
 * Process images as the result of an image upload
 * @param image the image object, a string or file
 * @param maxMB the max number of MB allowed
 * @returns the results if the image upload process
 */
export const uploadImage = async (image: string | File, maxMB = 10): Promise<UploadImageResult> => {
	let arrayBuf: ArrayBuffer | null = null;
	let type = '';

	if (typeof image === 'string') {
		const res = await fetch(image);
		if (res.ok !== true) return { success: false, message: 'Could not load image from provided URL'};
		const contentLength = parseInt(res.headers.get('content-length') ?? '*');
		if (isNaN(contentLength)) {
			console.log('ERROR: Image did not provided a \'content-length\' header, so we don\'t know how big it is. Can\'t download.');
			return { success: false, message: 'Unknown image size. See logs.'};
		}
		const t = res.headers.get('content-type');
		if (t === null) {
			console.log('ERROR: Image did not provided a \'content-type\' header, so we don\'t know what kind of file it is. Can\'t download.');
			return { success: false, message: 'Unknown file type. See logs.'};
		}
		type = t;
		if (contentLength / 1000000 > maxMB) return { success: false, message: 'Image too large'};
		arrayBuf = await res.arrayBuffer();
		if (arrayBuf.byteLength / 1000000 > maxMB) return { success: false, message: 'Image too large'};
	} else if (image instanceof File) {
		// Check image size
		if (image.size / 1000000 > maxMB) return { success: false, message: 'Image too large'};
		arrayBuf = await image.arrayBuffer();
		type = image.type;
	} else {
		return { success: false, message: 'Unsupported file type'};
	}

	const id = uuidv4();

	try {
		const images = await cropImages(arrayBuf, id);
		if (images === null) return { success: false, message: 'Unsupported image' };
		// Store the image
		await prisma.image.create({
			data: {
				id: id,
				...images
			}
		});

	} catch (e) {
		console.log('Error during image upload', e);
		return { success: false, message: 'Upload failed. See logs.' };
	}
	return { success: true, id };
}

/**
 * Filter outliers from an array of numbers
 * @see https://gist.github.com/rmeissn/f5b42fb3e1386a46f60304a57b6d215a
 * @param someArray the array to filter
 * @returns the filtered number array
 */
export const filterOutliers = (someArray: number[]): number[] => {

	if (someArray.length < 4) return someArray;

	let values, q1, q3, iqr, maxValue: number, minValue: number;

	values = someArray.slice().sort((a, b) => a - b); //copy array fast and sort

	if ((values.length / 4) % 1 === 0) { //find quartiles
		q1 = 1 / 2 * (values[(values.length / 4)] + values[(values.length / 4) + 1]);
		q3 = 1 / 2 * (values[(values.length * (3 / 4))] + values[(values.length * (3 / 4)) + 1]);
	} else {
		q1 = values[Math.floor(values.length / 4 + 1)];
		q3 = values[Math.ceil(values.length * (3 / 4) + 1)];
	}

	iqr = q3 - q1;
	maxValue = q3 + iqr * 1.5;
	minValue = q1 - iqr * 1.5;

	return values.filter((x) => (x >= minValue) && (x <= maxValue));
}

/**
 * Clear hanging images from the DB (IE. Images with no aircraft, type or log entry)
 */
export const clearHangingImages = async (): Promise<boolean> => {
	try {
		const toDelete = await prisma.image.findMany({
			where: { AND: {
				aircraft: { is: null },
				aircraftType: { is: null }
			}},
		});


		// Create some arrays to hold the inserts and hashes created in the loop
		const deletes: Types.Prisma.PrismaPromise<any>[] = [];

		// Loop through each position
		for (const entry of toDelete) deletes.push(prisma.image.delete({ where: { id: entry.id } }));

		// Execute the prisma transaction that will add all the points
		await prisma.$transaction(deletes)

		// Delete the files from the folder
		for (const entry of toDelete) {
			try {
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.original}`);
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.fullJpeg}`);
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.fullAvif}`);
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.i2048Jpeg}`);
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.i2048Avif}`);
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.i1024Jpeg}`);
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.i1024Avif}`);
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.i768Jpeg}`);
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.i768Avif}`);
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.i512Jpeg}`);
				fs.unlinkSync(`${MEDIA_FOLDER}/${entry.i512Avif}`);
			} catch (e) {}
		}

	} catch (e) {
		console.log('Error during clearHangingImages', e);
		return false;
	}
	return true;
}

/**
 * Remove up to one trailing slash from a URL
 * @param url the URL to sanitize
 * @returns the URL without the last slash
 */
export const removeTrailingSlashes = (url: string) => {
	return url.replace(/\/$/, '');
};

/**
 * Convert a url to a websocket url
 * @param url the url to convert
 * @returns the websocket url
 */
export const convertToWebsocketURL = (url: string) => {
	if (url.endsWith('/')) url = url.substring(0, url.length - 1);
	if (url.startsWith('https')) return 'wss' + url.substring(5);
	else if (url.startsWith('http')) return 'ws' + url.substring(4);
	else return url;
};

// export const dirsSanitizeNested = (dirs: string[]): string => {
//   return '\'"' + dirs.map((d) => sanitize(d)).join('/').replaceAll('\"', '\'').replaceAll('\'', '\'"\'"\'') + '"\'';
// }

// If this is changed, the length of the key must also be changed
const ENC_ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // Bytes

/**
 * Encrypt data using the encryption key stored in the DB
 * @param input the data to encrypt
 * @returns the encrypted data
 */
export const encrypt = async (input: string) => {
	// generate 16 bytes of random data
	const initVector = crypto.randomBytes(16);

	// Get the encryption key, hash it, and make it 32 bytes long
	const key = crypto
		.createHash('sha256')
		.update(String((await settings.get('general.encKey')) + ENC_SALT))
		.digest('base64')
		.substring(0, KEY_LENGTH);

	// Create the cipher
	const cipher = crypto.createCipheriv(ENC_ALGORITHM, key, initVector);

	// encrypt the message
	let encryptedData = cipher.update(input, 'utf-8', 'hex');
	encryptedData += cipher.final('hex');

	// Create and add the header (to store the IV)
	const header = 'CONTOUR/' + initVector.toString('hex') + '/';

	// Done
	return header + encryptedData;
};

/**
 * Decrypt the data using the encryption key stored in the DB
 * @param input the data to decrypt
 * @returns the decrypted data
 */
export const decrypt = async (input: string) => {
	// Get the encryption key, hash it, and make it 32 bytes long
	const key = crypto
		.createHash('sha256')
		.update(String((await settings.get('general.encKey')) + ENC_SALT))
		.digest('base64')
		.substring(0, KEY_LENGTH);

	// Split the input into the three parts (UNABRIDGED, IV, Message)
	const inputDecoded = input.split('/');

	// If it isn't the right format, return nothing
	if (inputDecoded.length !== 3) return '';

	// Create the de-cipher
	const decipher = crypto.createDecipheriv(ENC_ALGORITHM, key, Buffer.from(inputDecoded[1], 'hex'));

	// Decode the data
	let decryptedData = decipher.update(inputDecoded[2], 'hex', 'utf-8');
	decryptedData += decipher.final('utf8');

	// Done
	return decryptedData;
};

/**
 * Delay for a number of ms
 * @param ms the number of ms to delay for
 * @returns the promise
 */
export const delay = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Compress a JSON response based on what compression options the client can accept
 * @param request the client request
 * @param data the data to turn into a JSON file
 * @returns an object with the headers and response data buffer
 */
export const compressJSON = (
	request: Request,
	data: any,
	inputHeaders: { [key: string]: string } = {}
): { headers: { [key: string]: string }; data: Buffer } => {
	// See what encoding we can use
	const encoding = request.headers.get('accept-encoding')?.includes('br')
		? 'br'
		: request.headers.get('accept-encoding')?.includes('gzip')
		? 'gzip'
		: request.headers.get('accept-encoding')?.includes('deflate')
		? 'deflate'
		: 'none';

	// Assign the basic header
	const headers: { [key: string]: string } = {
		'Content-Type': 'application/json'
	};

	// Assign input headers. Content-Type can be overwritten, but length and encoding can't.
	for (const key of Object.keys(inputHeaders)) headers[key] = inputHeaders[key];

	// Add encoding if we are using it
	if (encoding !== 'none') headers['Content-Encoding'] = encoding;

	// Initialize a buffer to hold the resulting data
	let exp: Buffer;

	// Make sure BigInt can be converted to JSON
	BigInt.prototype.toJSON = function () {
		const int = Number.parseInt(this.toString());
		return int ?? this.toString();
	};

	// Convert the data to JSON
	const dataStr = JSON.stringify(data);

	// Encode the data based on what encoding algorithm we are using
	switch (encoding) {
		case 'br':
			exp = zlib.brotliCompressSync(dataStr);
			break;
		case 'gzip':
			exp = zlib.gzipSync(dataStr);
			break;
		case 'deflate':
			exp = zlib.deflateSync(dataStr);
			break;
		default:
			exp = Buffer.from(dataStr, 'utf8');
			break;
	}

	// Assign the content length based on the data result
	headers['Content-Length'] = exp.length.toString();

	// Done!
	return {
		headers,
		data: exp
	};
};

/**
 * Compress a JSON and return a response object
 * @param request the request so we can see what compression to use
 * @param data the data to stringify
 * @returns the response
 */
export const compressJSONResponse = (request: Request, data: any): Response => {
	const d = compressJSON(request, data);
	return new Response(d.data, {
		headers: d.headers
	});
};



export const lookupSIDOrSTAR = async (type: 'DP' | 'STAR', procedureIdentifier: string, transition: string, options: { airport?: string, runway?: string }) => {
	// let runwayLeads: Types.Prisma.NavDataSIDSTAR$runwayLeadsArgs;
	// if (options.airport !== undefined || options.runway !== undefined) {
	// 	if (options.runway === undefined) {
	// 		runwayLeads = { where: { airport: options.airport }, include: { fixes: true } }
	// 	} else {
	// 		runwayLeads = { where: { airport: options.airport, runway: options.runway }, include: { fixes: true } }
	// 	}
	// } else {
	// 	runwayLeads = { include: { fixes: true } };
	// }
	// const t = { include: {
	// 	transitions: { where: { identifier: transition }, include: { fixes: true } },
	// 	runwayLeads: { where: { identifier: transition }, include: { fixes: true } },
	// }};
	const val = await prisma.navDataSIDSTAR.findUnique({ where: { id: procedureIdentifier, type }, 
		include: {
			transitions: { where: { identifier: transition }, include: { fixes: true }},
			runwayLeads: { where: { airport: options.airport, runway: options.runway }, include: { fixes: true } },
		}
	});

	if (val !== null) {
		if (val.transitions.length === 0) return null;
		for (const transition of val.transitions) {
			const transitionOrder = transition.fixesOrder.split(', ').flatMap((v) => parseInt(v));
			transition.fixes.sort((a, b) => transitionOrder.findIndex((v) => v === a.index) - transitionOrder.findIndex((v) => v === b.index));
		}

		if (val.runwayLeads.length !== 0) {
			for (const lead of val.runwayLeads) {
				const runwayOrder = lead.fixesOrder.split(', ').flatMap((v) => parseInt(v));
				lead.fixes.sort((a, b) => runwayOrder.findIndex((v) => v === a.index) - runwayOrder.findIndex((v) => v === b.index));
			}
		}

		return val;
	}
	return null;
}