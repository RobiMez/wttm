import adapter from '@sveltejs/adapter-vercel';
import seqPreprocessor from 'svelte-sequential-preprocessor';

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: seqPreprocessor([vitePreprocess()]),

	kit: {
		adapter: adapter(),
		csrf: {
			checkOrigin: false
		}

	},

	vite: {
		optimizeDeps: {
			include: ['lodash.get', 'lodash.isequal', 'lodash.clonedeep']
		}
	},

};

export default config;
