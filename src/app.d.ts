import type cron from 'node-cron';
import EventEmitter from 'node:events';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
	declare namespace globalThis {
		interface BigInt {
			toJSON(): string | number;
		}
	}
}

export {};
