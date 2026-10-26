<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { ShieldCheck } from '@lucide/svelte';
	import FloatingCards from '#lib/components/layout/FloatingCards.svelte';
	import Logo from '#lib/components/ui/Logo.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
	<!-- Brand panel (desktop) -->
	<aside class="hero-savings relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col">
		<div class="hero-veil pointer-events-none absolute inset-0 opacity-60"></div>
		<a href={resolve('/')} class="relative w-fit"><Logo onDark /></a>
		<div class="relative my-auto">
			<div class="mx-auto max-w-sm"><FloatingCards /></div>
			<h2 class="mt-14 max-w-md text-3xl leading-tight font-extrabold">
				Tus recibos, préstamos y servicios, bajo control.
			</h2>
			<p class="mt-3 max-w-md text-white/80">
				Lleva la cuenta de tu tope anual de honorarios, de quién te debe y de cada suscripción que
				pagas.
			</p>
		</div>
		<p class="relative flex items-center gap-2 text-sm text-white/70">
			<ShieldCheck size={16} aria-hidden="true" /> Cada persona ve solo sus datos.
		</p>
	</aside>

	<main class="flex flex-col items-center justify-center px-5 py-10 sm:px-8">
		<div class="w-full max-w-[400px]">
			<div class="lg:hidden">
				<FloatingCards />
				<div class="h-6"></div>
			</div>
			{@render children()}
			<p class="mt-8 flex justify-center gap-4 text-xs text-muted">
				<a href={resolve('/privacy')} class="hover:underline">Política de privacidad</a>
				<a href={resolve('/delete-account')} class="hover:underline">Eliminar mi cuenta</a>
			</p>
		</div>
	</main>
</div>
