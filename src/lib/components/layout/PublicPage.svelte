<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import Logo from '../ui/Logo.svelte';

	// Frame of the public pages (privacy policy, account deletion): readable without
	// the app and without a session, with the links people look for.
	let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-dvh bg-canvas">
	<header class="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4">
		<a href={resolve('/')} aria-label="Orbita, ir al inicio"><Logo size="sm" /></a>
		<nav class="flex gap-5 text-sm font-bold text-primary" aria-label="Información legal">
			<a href={resolve('/privacy')} class="hover:underline">Privacidad</a>
			<a href={resolve('/delete-account')} class="hover:underline">Eliminar cuenta</a>
		</nav>
	</header>
	<main class="mx-auto max-w-3xl px-4 pt-4 pb-16">{@render children()}</main>
	<footer class="border-t border-outline py-6 text-center text-sm text-muted">
		© 2026 Atmosfera · Orbita
	</footer>
</div>
