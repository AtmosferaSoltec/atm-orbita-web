import { services } from '#lib/stores/services.svelte.ts';
export async function load({ parent }) {
	await parent();
	await services.load();
}
