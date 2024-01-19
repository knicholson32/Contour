import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import sharp from 'sharp';
import * as fs from 'node:fs';
import { MEDIA_FOLDER } from '$lib/server/env';

// ------------------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------------------

const loadImageToBuffer = (fileName: string): Buffer | null => {
	try {
		const filePath = MEDIA_FOLDER + '/' + fileName;
		return fs.readFileSync(filePath);
	} catch(e) {
		return null
	}
}

const streamImage = async (setHeaders: (headers: Record<string, string>) => void, fileName: string, format: string): Promise<Response> => {
	if (typeof fileName !== 'string') return API.response._400({message: 'File does not exist on disk. Invalid request.'});
	try {
		const filePath = MEDIA_FOLDER + '/' + fileName;
		const stat = fs.statSync(filePath);
		const readStream = fs.createReadStream(filePath);

		setHeaders({
			'Content-Type': (format === 'avif' ? 'image/avif' : 'image/jpeg'),
			'Cache-Control': 'max-age=60',
			'Content-Length': stat.size.toString()
		});

		// NOTE: This is NOT a correct typecast. This works, but typescript doesn't agree.
		// https://kit.svelte.dev/docs/routing#server
		return new Response(readStream as unknown as string);

	} catch(e) {
		return API.response._404();
	}
}

// ------------------------------------------------------------------------------------------
// Endpoints
// ------------------------------------------------------------------------------------------

export const GET = async ({ setHeaders, params, }) => {
	const id = params.id;
	let size = params.size;
	let format = params.format;

	// Check that the ID was actually submitted
	if (id === null || id === undefined) return API.response._400({ missingPaths: ['id'] });

	console.log(id, 'size', size, 'format', format);
	if (format === undefined) format = 'jpeg';

	let exp: Buffer | null = null;
	
	// Switch based on pre-stored image size. We will try to use a pre-stored image before generating a new image size.
	if (size === 'full') {
		const image = await prisma.image.findUnique({ where: { id }, select: { fullJpeg: true, fullAvif: true } });
		if (image === null || image === undefined) return API.response._404();
		return await streamImage(setHeaders, (format === 'avif' ? image.fullAvif : image.fullJpeg), format);
	} else if (size === '2048') {
		const image = await prisma.image.findUnique({ where: { id }, select: { i2048Jpeg: true, i2048Avif: true } });
		if (image === null || image === undefined) return API.response._404();
		return await streamImage(setHeaders, (format === 'avif' ? image.i2048Avif : image.i2048Jpeg), format);
	} else if (size === '1024') {
		const image = await prisma.image.findUnique({ where: { id }, select: { i1024Jpeg: true, i1024Avif: true } });
		if (image === null || image === undefined) return API.response._404();
		return await streamImage(setHeaders, (format === 'avif' ? image.i1024Avif : image.i1024Jpeg), format);
	} else if (size === '768') {
		const image = await prisma.image.findUnique({ where: { id }, select: { i768Jpeg: true, i768Avif: true } });
		if (image === null || image === undefined) return API.response._404();
		return await streamImage(setHeaders, (format === 'avif' ? image.i768Avif : image.i768Jpeg), format);
	} else if (size === '512') {
		const image = await prisma.image.findUnique({ where: { id }, select: { i512Jpeg: true, i512Avif: true } });
		if (image === null || image === undefined) return API.response._404();
		return await streamImage(setHeaders, (format === 'avif' ? image.i512Avif : image.i512Jpeg), format);
	} else if (size === '256') {
		const image = await prisma.image.findUnique({ where: { id }, select: { i256Jpeg: true, i256Avif: true } });
		if (image === null || image === undefined) return API.response._404();
		exp = (format === 'avif' ? image.i256Avif : image.i256Jpeg);
	} else if (size === '128') {
		const image = await prisma.image.findUnique({ where: { id }, select: { i128Avif: true, i128Jpeg: true } });
		if (image === null || image === undefined) return API.response._404();
		exp = (format === 'avif' ? image.i128Avif : image.i128Jpeg);
	} else {
		// We were not, and therefore have a custom size. Parse it.
		const sizeInt = parseInt(size);
		// Make sure it is valid
		if (isNaN(sizeInt)) return API.response._400({ message: `Unknown size '${size}'` });
		if (sizeInt > 2048) return API.response._400({ message: 'Invalid input. \'size\' must be less than or equal to 2040' }); 

		// A valid size was provided
		// We need to use a larger source image size if we are turning the image square. Calculate that here.
		const modifiedSize = sizeInt;

		// Get the proper source image
		let source: Buffer | null;
		if (modifiedSize > 1024) {
			// Get the profile from the database
			const image = await prisma.image.findUnique({ where: { id }, select: { fullAvif: true, fullJpeg: true } });
			// Return if the profile was not found
			if (image === null || image === undefined) return API.response._404();
			source = loadImageToBuffer((format === 'avif' ? image.fullAvif : image.fullJpeg));
		} else if (modifiedSize > 768) {
			// Get the profile from the database
			const image = await prisma.image.findUnique({ where: { id }, select: { i1024Avif: true, i1024Jpeg: true } });
			// Return if the profile was not found
			if (image === null || image === undefined) return API.response._404();
			source = loadImageToBuffer((format === 'avif' ? image.i1024Avif : image.i1024Jpeg));
		} else if (modifiedSize > 512) {
			// Get the profile from the database
			const image = await prisma.image.findUnique({ where: { id }, select: { i768Avif: true, i768Jpeg: true } });
			// Return if the profile was not found
			if (image === null || image === undefined) return API.response._404();
			source = loadImageToBuffer((format === 'avif' ? image.i768Avif : image.i768Jpeg));
		} else if (modifiedSize > 256) {
			// Get the profile from the database
			const image = await prisma.image.findUnique({ where: { id }, select: { i512Avif: true, i512Jpeg: true } });
			// Return if the profile was not found
			if (image === null || image === undefined) return API.response._404();
			source = loadImageToBuffer((format === 'avif' ? image.i512Avif : image.i512Jpeg));
		} else if (modifiedSize > 128) {
			// Get the profile from the database
			const image = await prisma.image.findUnique({ where: { id }, select: { i256Avif: true, i256Jpeg: true } });
			// Return if the profile was not found
			if (image === null || image === undefined) return API.response._404();
			source = (format === 'avif' ? image.i256Avif : image.i256Jpeg);
		} else {
			// Get the profile from the database
			const image = await prisma.image.findUnique({ where: { id }, select: { i128Avif: true, i128Jpeg: true } });
			// Return if the profile was not found
			if (image === null || image === undefined) return API.response._404();
			source = (format === 'avif' ? image.i128Avif : image.i128Jpeg);
		}

		// If the source image does not exist, return not found
		if (source === null) return API.response._404();

		// Generate the image based on shape and format
		exp = (format === 'avif' ?
			await sharp(source).resize({ width: sizeInt, withoutEnlargement: true }).avif().toBuffer() :
			await sharp(source).resize({ width: sizeInt, withoutEnlargement: true }).jpeg().toBuffer() );
	}

	// Return the image
	try {
		setHeaders({
			'Content-Type': (format === 'avif' ? 'image/avif' : 'image/jpeg'),
			'Content-Length': exp.length.toString(),
			'Cache-Control': 'max-age=60'
		});
		return new Response(exp);
	} catch (e) {
		return API.response.serverError(e);
	}
};
