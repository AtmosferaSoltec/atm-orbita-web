<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Logo from '../ui/Logo.svelte';
	import UserMenu from './UserMenu.svelte';
	import { NAV_ITEMS, isActive } from './nav';

	let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
	<!-- Sidebar (desktop) -->
	<aside
		class="sticky top-0 hidden h-dvh flex-col border-r border-outline bg-surface px-4 py-6 lg:flex"
	>
		<a href={resolve('/(app)/dashboard')} class="px-2" aria-label="Orbita, ir al inicio">
			<Logo />
		</a>
		<nav class="mt-8 flex flex-col gap-1" aria-label="Principal">
			{#each NAV_ITEMS as item (item.route)}
				{@const active = isActive(page.url.pathname, item.path)}
				<a
					href={resolve(item.route)}
					aria-current={active ? 'page' : undefined}
					class="flex h-11 items-center gap-3 rounded-[14px] px-3 text-[15px] font-bold transition-colors {active
						? 'bg-primary-soft text-primary'
						: 'text-muted hover:bg-neutral-soft hover:text-ink'}"
				>
					<item.icon size={20} strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="mt-auto">
			<p
				class="mb-3 rounded-2xl bg-orange-soft px-3 py-2.5 text-xs font-semibold text-orange-strong"
			>
				Préstamos y servicios aún son maqueta con datos de ejemplo.
			</p>
			<UserMenu />
		</div>
	</aside>

	<div class="flex min-w-0 flex-col">
		<!-- Top bar (mobile) -->
		<header
			class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline/70 bg-canvas/85 px-4 backdrop-blur lg:hidden"
		>
			<a href={resolve('/(app)/dashboard')} aria-label="Orbita, ir al inicio"><Logo size="sm" /></a>
			<UserMenu compact />
		</header>

		<main
			class="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12"
		>
			{@render children()}
		</main>
	</div>

	<!-- Bottom navigation (mobile) -->
	<nav
		class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-outline bg-surface/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
		aria-label="Principal"
	>
		{#each NAV_ITEMS as item (item.route)}
			{@const active = isActive(page.url.pathname, item.path)}
			<a
				href={resolve(item.route)}
				aria-current={active ? 'page' : undefined}
				class="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-bold {active
					? 'text-primary'
					: 'text-muted'}"
			>
				<span
					class="inline-flex h-8 w-14 items-center justify-center rounded-full transition-colors {active
						? 'bg-primary-soft'
						: ''}"
				>
					<item.icon size={21} strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />
				</span>
				{item.label}
			</a>
		{/each}
	</nav>
</div>
