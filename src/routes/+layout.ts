import { session } from '#lib/stores/session.svelte.ts';

// The app runs fully in the browser (SPA): the static adapter serves index.html for every route.
export const ssr = false;
export const prerender = false;

// Every page knows whether there is a session before it renders (the guards
// and the landing's buttons depend on it).
export async function load() {
	await session.ensureReady();
}
