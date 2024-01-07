import * as settings from '$lib/server/settings';
import * as crypto from 'node:crypto';
import zlib from 'node:zlib';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import prisma from '$lib/server/prisma';
import * as helpers from '$lib/helpers';

const ENC_SALT = 'CONTOUR_SALT'


export type Images = {
	original: Buffer;
	fullJpeg: Buffer; 
	fullAvif: Buffer;
	i2048Jpeg: Buffer;
	i2048Avif: Buffer;
	i1024Jpeg: Buffer;
	i1024Avif: Buffer;
	i768Jpeg: Buffer;
	i768Avif: Buffer;
	i512Jpeg: Buffer;
	i512Avif: Buffer;
	i256Jpeg: Buffer;
	i256Avif: Buffer;
	i128Jpeg: Buffer;
	i128Avif: Buffer;
};

export const cropImages = async (image: ArrayBuffer): Promise<Images | null> => {
	const imageBuffer = helpers.toBuffer(image);
	const initial = sharp(imageBuffer).rotate();

	const promiseList: Promise<void>[] = [];
	const ret: Images = {
		original: imageBuffer
	} as Images;
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.fullJpeg = await initial.clone().jpeg().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.fullAvif = await initial.clone().avif().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i2048Jpeg = await initial.clone().resize({ width: 2048, withoutEnlargement: true }).jpeg().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i2048Avif = await initial.clone().resize({ width: 2048, withoutEnlargement: true }).avif().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i1024Jpeg = await initial.clone().resize({ width: 1024, withoutEnlargement: true }).jpeg().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i1024Avif = await initial.clone().resize({ width: 1024, withoutEnlargement: true }).avif().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i768Jpeg = await initial.clone().resize({ width: 768, withoutEnlargement: true }).jpeg().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i768Avif = await initial.clone().resize({ width: 768, withoutEnlargement: true }).avif().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i512Jpeg = await initial.clone().resize({ width: 512, withoutEnlargement: true }).jpeg().toBuffer();
		} catch (e) { reject(e) }
		resolve()
	}));
	promiseList.push(new Promise<void>(async (resolve, reject) => { 
		try {
			ret.i512Avif = await initial.clone().resize({ width: 512, withoutEnlargement: true }).avif().toBuffer();
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
		const images = await cropImages(arrayBuf);
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
 * Clear hanging images from the DB (IE. Images with no aircraft, type or log entry)
 */
export const clearHangingImages = async (): Promise<boolean> => {
	try {
		await prisma.image.deleteMany({ where: {
			AND: {
				aircraft: { is: null },
				aircraftType: { is: null }
			}
		}});
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
