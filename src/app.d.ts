// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				_id: string;
				// Human identifiers
				first_name: string;
				last_name: string;
				// Action timestamp logging
				last_login_date: Date;
				last_action_time: Date;
				// State flags
				admin: boolean;
				reviewer: boolean;
				publisher: boolean;
				locked: boolean;
				// Uniques
				email: string;
				userAuthToken: string | null;
			};
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
