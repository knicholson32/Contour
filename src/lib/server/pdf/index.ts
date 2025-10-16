import puppeteer from 'puppeteer';
import ExportDocument from '$lib/components/routeSpecific/pdf/ExportDocument.svelte';
import { render } from 'svelte/server';
import { v4 as uuidv4 } from 'uuid';
import * as settings from '$lib/server/settings';
import {
  describeAircraft,
  fetchExportLegs,
  fetchFilterMetadata,
  formatAirport,
  parseFiltersFromUrl,
  type ExportFilters
} from '$lib/components/routeSpecific/pdf/utils.server.js';
import fs from 'node:fs';
import css from '$lib/components/routeSpecific/pdf/ExportDocument.css?raw';
import { MEDIA_FOLDER } from '../env';
import prisma from '$lib/server/prisma';

let browserPromise: Promise<puppeteer.Browser> | null = null;

const getBrowser = () => {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000,
    });
  }
  return browserPromise;
};

const summarize = (
  entries: { id: string; label: string }[],
  fallback: string,
  formatter: (entry: { label: string }) => string = (entry) => entry.label
) => {
  if (entries.length === 0) return fallback;
  return entries.map(formatter).join(', ');
};


export const generate = async (filters: ExportFilters) => {

  const set = await settings.getMany('general.name', 'general.gravatar.hash', 'entry.dataVersion');
  
  const [legs, metadata] = await Promise.all([fetchExportLegs(filters), fetchFilterMetadata(filters)]);


  const generatedAt = new Date().toISOString();

  const filterSummary = {
    start: filters.start ?? null,
    end: filters.end ?? null,
    aircraft: filters.aircraftIds.length
      ? summarize(
          metadata.aircraftMeta.map((entry) => ({
            id: entry.id,
            label: describeAircraft(entry)
          })),
          'No matching aircraft for provided IDs'
        )
      : 'All aircraft',
    airports: filters.airportIds.length
      ? summarize(
          metadata.airportMeta.map((entry) => ({
            id: entry.id,
            label: formatAirport(entry)
          })),
          'No matching airports for provided IDs'
        )
      : 'All airports'
  };

  const { body, head } = render(ExportDocument, {
    props: {
      legs,
      generatedAt,
      filterSummary,
      userInfo: set
    }
  });

  const filename = `contour-logbook-${generatedAt.replace(/[:]/g, '-')}.pdf`;


  const markup = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    ${head ?? ''}
    <title>${set['general.name']} Contour Logbook Export - ${generatedAt}</title>
    <style>${css}</style>
  </head>
  <body>
    ${body}
  </body>
</html>`;

  const browser = await getBrowser();
  const page = await browser.newPage();

  let response: { ok: true, name: string, buffer: Buffer} | { ok: false, error: string } = { ok: false, error: 'Could not create PDF'};

  try {
    await page.setContent(markup, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      // format: 'letter',
      // printBackground: true,
      // landscape: true,
      margin: {
        top: '0in',
        bottom: '0in',
        left: '0in',
        right: '0in'
      }
    });

    const id = uuidv4();

    
    try {
      fs.writeFileSync(`${MEDIA_FOLDER}/${filename}`, pdfBuffer);

      // await prisma.
      await prisma.export.create({
        data: {
          id: id,
          dataSourceVersion: set['entry.dataVersion'],
          file: filename,
          generated_utc: Math.floor(Date.now() / 1000),
          params: JSON.stringify(filters)
        }
      });

      response = {
        ok: true,
        name: filename,
        buffer: pdfBuffer,
      };

    } catch (e) {
      response = { ok: false, error: '' + e };
      fs.unlinkSync(`${MEDIA_FOLDER}/${filename}`);
      await prisma.export.delete({ where: { id: id }});
    }

  } finally {
    await page.close();
  }

  return response;
}


export const requestOrCreateExport = async (filters: ExportFilters, options: { dataVersion?: number, forceGenerate?: boolean } = {}) => {

  if (options.dataVersion === undefined) options.dataVersion = await settings.get('entry.dataVersion');
  if (options.forceGenerate === undefined) options.forceGenerate = false;


  if (options.forceGenerate) {
    // We need to delete the current file, if it exists.
    const files = await prisma.export.findMany({ where: { dataSourceVersion: options.dataVersion, params: JSON.stringify(filters) } });
    for (const file of files) {
      try {
        fs.unlinkSync(`${MEDIA_FOLDER}/${file.file}`);
      } finally {
        await prisma.export.delete({ where: { id: file.id } });
      }  
    }
    return await generate(filters);
  } else {
    const results = await prisma.export.findMany({ where: { dataSourceVersion: options.dataVersion, params: JSON.stringify(filters) } });

    if (results.length > 0) {
      const file = results[0];
      return {
        ok: true,
        buffer: fs.readFileSync(`${MEDIA_FOLDER}/${file.file}`),
        name: file.file
      }
    } else {
      return await generate(filters);
    }
  }

}

export const cleanExports = async () => {
  const dataVersion = await settings.get('entry.dataVersion');

  const toDelete = await prisma.export.findMany({ where: { dataSourceVersion: { lt: dataVersion } } });

  for (const file of toDelete) {
    try {
      fs.unlinkSync(`${MEDIA_FOLDER}/${file.file}`);
    } finally {
      await prisma.export.delete({ where: { id: file.id } });
    }
  }
}

export const incrementDataVersion = async () => {
  try {
    const dataVersion = await settings.get('entry.dataVersion');
    await settings.set('entry.dataVersion', dataVersion + 1);
    await cleanExports();
    await generate(parseFiltersFromUrl(new URLSearchParams()));
  } catch (e) {
    console.error(e);
  }
}