import puppeteer from 'puppeteer';
import type { RequestHandler } from './$types';
import ExportDocument from '$lib/components/routeSpecific/pdf/ExportDocument.svelte';
import { render } from 'svelte/server';
import * as settings from '$lib/server/settings';
import {
  describeAircraft,
  fetchExportLegs,
  fetchFilterMetadata,
  formatAirport,
  parseFiltersFromUrl
} from '$lib/components/routeSpecific/pdf/utils.server.js';
import css from '$lib/components/routeSpecific/pdf/ExportDocument.css?raw';

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

export const GET: RequestHandler = async ({ url }) => {
  const filters = parseFiltersFromUrl(url);

  const [legs, metadata] = await Promise.all([fetchExportLegs(filters), fetchFilterMetadata(filters)]);

  const userInfo = await settings.getMany('general.name', 'general.gravatar.hash');

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
      userInfo
    }
  });

  const filename = `contour-logbook-${generatedAt.replace(/[:]/g, '-')}.pdf`;


  const markup = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    ${head ?? ''}
    <title>${userInfo['general.name']} Contour Logbook Export - ${generatedAt}</title>
    <style>${css}</style>
  </head>
  <body>
    ${body}
  </body>
</html>`;

  const browser = await getBrowser();
  const page = await browser.newPage();

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

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } finally {
    await page.close();
  }
};
