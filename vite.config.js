import { sveltekit } from '@sveltejs/kit/vite';
import devtoolsJson from "vite-plugin-devtools-json";
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), devtoolsJson()]
});
