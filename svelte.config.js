// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-node';
// import { vitePreprocess } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			precompress: true
		})
	},
	preprocess: vitePreprocess()
};

export default config;
