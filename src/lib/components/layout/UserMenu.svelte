<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { LogOut, RotateCcw } from '@lucide/svelte';
	import Avatar from '../ui/Avatar.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import { session } from '#lib/stores/session.svelte.ts';
	import { resetDemoData } from '#lib/stores/demo.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	interface Props {
		compact?: boolean;
	}

	let { compact = false }: Props = $props();

	let open = $state(false);
	let confirmReset = $state(false);
	let root: HTMLDivElement | undefined = $state();

	function onWindowClick(event: MouseEvent) {
		if (open && root && !root.contains(event.target as Node)) open = false;
	}

	async function signOut() {
		await session.signOut();
		await goto(resolve('/(auth)/login'));
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="relative" bind:this={root}>
	<button
		type="button"
		class="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-neutral-soft"
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<Avatar name={session.displayName || '?'} size={compact ? 'sm' : 'md'} />
		{#if !compact}
			<span class="min-w-0 flex-1">
				<span class="block truncate text-sm font-bold">{session.displayName}</span>
				<span class="block truncate text-xs text-muted">{session.user?.email}</span>
			</span>
		{/if}
	</button>

	{#if open}
		<div
			role="menu"
			class="absolute z-30 w-60 rounded-2xl border border-outline bg-surface p-1.5 shadow-pop {compact
				? 'top-full right-0 mt-2'
				: 'bottom-full left-0 mb-2'}"
		>
			<button
				role="menuitem"
				type="button"
				class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-neutral-soft"
				onclick={() => {
					open = false;
					confirmReset = true;
				}}
			>
				<RotateCcw size={17} class="text-muted" /> Restablecer datos de ejemplo
			</button>
			<button
				role="menuitem"
				type="button"
				class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-expense-strong hover:bg-expense-soft"
				onclick={signOut}
			>
				<LogOut size={17} /> Cerrar sesión
			</button>
		</div>
	{/if}
</div>

<ConfirmDialog
	bind:open={confirmReset}
	title="¿Restablecer los datos de ejemplo?"
	text="Se perderán los préstamos y servicios que agregaste o cambiaste en la maqueta. Tus recibos no se tocan: esos ya son reales."
	confirmLabel="Restablecer"
	onconfirm={() => {
		resetDemoData();
		toasts.success('Datos de ejemplo restablecidos.');
	}}
/>
