import type { Handle } from '@sveltejs/kit';
import { config } from 'dotenv';

config();

export const handle: Handle = async ({ event, resolve }) => {
	try {
		// load page as normal
		return await resolve(event);
	} catch (error) {
		console.error('Error occurred in handle function Hook :', error);
		throw error;
	}
};
