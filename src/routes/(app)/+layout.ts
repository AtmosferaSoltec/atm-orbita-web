import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { session } from '#lib/stores/session.svelte.ts';

export function load() {
	if (!session.isSignedIn) redirect(307, resolve('/(auth)/login'));
}
