import prisma from '$lib/server/prisma';
import { API } from '$lib/types';
import { json } from '@sveltejs/kit';
import sharp from 'sharp';

export const GET = async ({ setHeaders, params }) => {
  const id = params.id;

  // Check that the ID was actually submitted
  if (id === null || id === undefined) return API.response._400({ missingPaths: ['id'] });

  // Get the profile from the database
  const image = await prisma.image.findUnique({ where: { id } });

  // Return if the profile was not found
  if (image === null || image === undefined) return API.response._404();

  let exp: Buffer = await sharp(image.original).keepMetadata().toBuffer();

  // // exp = await sharp(image.full).resize({ width: 512, height: 512, fit: sharp.fit.cover, position: sharp.strategy.entropy }).toBuffer();
  // // .avif({ quality: 50 })
  // console.time('avif')
  // exp = await sharp(image.full).rotate().resize({ width: 1024, height: 1024 }).avif({ quality: 50 }).toBuffer(); // 12.7KB
  // console.timeEnd('avif');
  // console.time('webp');
  // exp = await sharp(exp).webp({ quality: 80 }).toBuffer(); // 4.5KB
  // console.timeEnd('webp');
  // // exp = await sharp(exp).resize({ width: 512, height: 512, fit: sharp.fit.cover }).rotate().toBuffer();



  console.log(await sharp(image.original).metadata());
  console.log((await sharp(image.original).metadata()).xmp?.toString());
  console.log(await sharp(exp).metadata());
  console.log((await sharp(exp).metadata()).xmp?.toString());

  try {
    setHeaders({
      'Content-Type': 'image/jpeg',
      'Content-Length': exp.length.toString(),
      'Cache-Control': 'max-age=60'
    });
    return new Response(exp);
  } catch (e) {
    return API.response.serverError(e);
  }
};
