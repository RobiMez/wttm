/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

import { sveltekit } from '@sveltejs/kit/vite';

export default {
	plugins: [sveltekit()],
	ssr: {
		noExternal: ['three', 'troika-three-text']
	}
};
