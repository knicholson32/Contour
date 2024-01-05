import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { json } from '@sveltejs/kit';
import sharp from 'sharp';

export const GET = async ({ setHeaders, params, }) => {
	const id = params.id;
	let size = params.size;
	let shape = params.shape;
	let format = params.format;

	// Check that the ID was actually submitted
	if (id === null || id === undefined) return API.response._400({ missingPaths: ['id'] });

	console.log(id, 'size', size, 'format', format, 'shape', shape);
	if (format === undefined) format = 'jpeg';

	// Get the profile from the database
	const image = await prisma.image.findUnique({ where: { id } });

	// Return if the profile was not found
	if (image === null || image === undefined) return API.response._404();

	let exp: Buffer | null = null;
	
	// Switch based on pre-stored image size. We will try to use a pre-stored image before generating a new image size.
	switch (size) {
		case 'full':
			if (shape === 'sq') {
				const meta = await sharp(image.fullJpeg).metadata();
				const size = (meta.width ?? 0) > (meta.height ?? 0) ? meta.height ?? 0: meta.width ?? 0;
				exp = (format === 'avif' ? 
					await sharp(image.fullAvif).resize({ width: size, height: size, withoutEnlargement: true, fit: sharp.fit.cover }).avif().toBuffer() :
					await sharp(image.fullJpeg).resize({ width: size, height: size, withoutEnlargement: true, fit: sharp.fit.cover }).jpeg().toBuffer() );
			} else {
				exp = (format === 'avif' ? image.fullAvif : image.fullJpeg);
			}
			break;
		case '2048':
			if (shape === 'sq') {
				exp = (format === 'avif' ?
					await sharp(image.fullAvif).resize({ width: 2048, height: 2048, withoutEnlargement: true, fit: sharp.fit.cover }).avif().toBuffer() :
					await sharp(image.fullJpeg).resize({ width: 2048, height: 2048, withoutEnlargement: true, fit: sharp.fit.cover }).jpeg().toBuffer());
			} else {
				exp = (format === 'avif' ? image.i2048Avif : image.i2048Jpeg);
			}
			break;
		case '1024':
			if (shape === 'sq') {
				exp = (format === 'avif' ? 
					await sharp(image.fullAvif).resize({ width: 1024, height: 1024, withoutEnlargement: true, fit: sharp.fit.cover }).avif().toBuffer() :
					await sharp(image.fullJpeg).resize({ width: 1024, height: 1024, withoutEnlargement: true, fit: sharp.fit.cover }).jpeg().toBuffer() );
			} else {
				exp = (format === 'avif' ? image.i1024Avif : image.i1024Jpeg);
			}
			break;
		case '768':
			if (shape === 'sq') {
				exp = (format === 'avif' ? 
					await sharp(image.fullAvif).resize({ width: 768, height: 768, withoutEnlargement: true, fit: sharp.fit.cover }).avif().toBuffer() :
					await sharp(image.fullJpeg).resize({ width: 768, height: 768, withoutEnlargement: true, fit: sharp.fit.cover }).jpeg().toBuffer() );
			} else {
				exp = (format === 'avif' ? image.i768Avif : image.i768Jpeg);
			}
			break;
		case '512':
			if (shape === 'sq') {
				exp = (format === 'avif' ? 
					await sharp(image.i1024Avif).resize({ width: 512, height: 512, withoutEnlargement: true, fit: sharp.fit.cover }).avif().toBuffer() :
					await sharp(image.i1024Jpeg).resize({ width: 512, height: 512, withoutEnlargement: true, fit: sharp.fit.cover }).jpeg().toBuffer() );
			} else {
				exp = (format === 'avif' ? image.i512Avif : image.i512Jpeg);
			}
			break;
		case '256':
			if (shape === 'sq') {
				exp = (format === 'avif' ? 
					await sharp(image.i512Avif).resize({ width: 256, height: 256, withoutEnlargement: true, fit: sharp.fit.cover }).avif().toBuffer() :
					await sharp(image.i512Jpeg).resize({ width: 256, height: 256, withoutEnlargement: true, fit: sharp.fit.cover }).jpeg().toBuffer() );
			} else {
				exp = (format === 'avif' ? image.i256Avif : image.i256Jpeg);
			}
			break;
		case '128':
			if (shape === 'sq') {
				exp = (format === 'avif' ? 
					await sharp(image.i256Avif).resize({ width: 128, height: 128, withoutEnlargement: true, fit: sharp.fit.cover }).avif().toBuffer() :
					await sharp(image.i256Jpeg).resize({ width: 128, height: 128, withoutEnlargement: true, fit: sharp.fit.cover }).jpeg().toBuffer() );
			} else {
				exp = (format === 'avif' ? image.i128Avif : image.i128Jpeg);
			}
			break;
	}

	// Check if we were able to resolve the image from pre-stored options
	if (exp === null) {
		// We were not, and therefore have a custom size. Parse it.
		const sizeInt = parseInt(size);
		// Make sure it is valid
		if (isNaN(sizeInt)) return API.response._400({ message: `Unknown size '${size}'` });
		if (sizeInt > 2048) return API.response._400({ message: 'Invalid input. \'size\' must be less than or equal to 2040' }); 

		// A valid size was provided
		// We need to use a larger source image size if we are turning the image square. Calculate that here.
		const modifiedSize = shape === 'sq' ? Math.round(sizeInt * 2) : sizeInt;

		// Get the proper source image
		let source: Buffer;
		if (modifiedSize > 1024) {
			source = (format === 'avif' ? image.fullAvif : image.fullJpeg);
		} else if (modifiedSize > 768) {
			source = (format === 'avif' ? image.i1024Avif : image.i1024Jpeg);
		} else if (modifiedSize > 512) {
			source = (format === 'avif' ? image.i768Avif : image.i768Jpeg);
		} else if (modifiedSize > 256) {
			source = (format === 'avif' ? image.i512Avif : image.i512Jpeg);
		} else if (modifiedSize > 128) {
			source = (format === 'avif' ? image.i256Avif : image.i256Jpeg);
		} else {
			source = (format === 'avif' ? image.i128Avif : image.i128Jpeg);
		}

		// Generate the image based on shape and format
		if (shape === 'sq') {
			exp = (format === 'avif' ? 
				await sharp(source).resize({ width: sizeInt, height: sizeInt, withoutEnlargement: true, fit: sharp.fit.cover }).avif().toBuffer() : 
				await sharp(source).resize({ width: sizeInt, height: sizeInt, withoutEnlargement: true, fit: sharp.fit.cover }).jpeg().toBuffer() );
		} else {
			exp = (format === 'avif' ?
				await sharp(source).resize({ width: sizeInt, withoutEnlargement: true }).avif().toBuffer() :
				await sharp(source).resize({ width: sizeInt, withoutEnlargement: true }).jpeg().toBuffer() );
		}
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
