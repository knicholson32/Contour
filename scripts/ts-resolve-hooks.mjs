// Lets plain `node --experimental-strip-types` follow SvelteKit-style
// extensionless relative imports (e.g. `./seamTables`) without changing source.
export async function resolve(specifier, context, next) {
	try {
		return await next(specifier, context);
	} catch (err) {
		if (!/\.[a-zA-Z]+$/.test(specifier)) {
			try {
				return await next(specifier + '.ts', context);
			} catch {
				return await next(specifier + '/index.ts', context);
			}
		}
		throw err;
	}
}
