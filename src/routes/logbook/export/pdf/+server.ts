import type { RequestHandler } from './$types';
import { parseFiltersFromUrl } from '$lib/components/routeSpecific/pdf/utils.server.js';
import { requestOrCreateExport } from '$lib/server/pdf';
import { API } from '$lib/types';


export const GET: RequestHandler = async ({ url }) => {
  const filters = parseFiltersFromUrl(url.searchParams);

  const forceGenerate = url.searchParams.get('generate') === 'true';

  const file = await requestOrCreateExport(filters, { forceGenerate });

  if (file.ok === false) {
    return API.response.serverError(file);
  } else {

  return new Response(file.buffer as unknown as ReadableStream<any>, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file.name}"`
    }
  });
}
  
};
