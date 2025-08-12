import { sveltekit } from '@sveltejs/kit/vite';
import devtoolsJson from "vite-plugin-devtools-json";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), devtoolsJson(), tailwindcss()]
});
