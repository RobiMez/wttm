/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	ssr: {
		noExternal: ['three', 'troika-three-text']
	}
});
