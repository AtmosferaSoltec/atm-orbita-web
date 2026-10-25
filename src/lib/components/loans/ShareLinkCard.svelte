<script lang="ts">
	import { resolve } from '$app/paths';
	import { Eye, Copy, Link2, RefreshCw, Link2Off } from '@lucide/svelte';
	import { Button, Card, ConfirmDialog } from '#lib/components/ui/index.ts';
	import type { Debtor } from '#lib/domain/loans.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { messageFor } from '#lib/api/errors.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
	let { debtor }: { debtor: Debtor } = $props();
	let busy = $state(false);
	let error = $state<string | null>(null);
	let rotate = $state(false);
	let revoke = $state(false);
	const path = $derived(
		debtor.publicToken ? resolve('/share/loans/[token]', { token: debtor.publicToken }) : ''
	);
	const url = $derived(path ? `${location.origin}${path}` : '');
	async function share(enabled: boolean) {
		if (busy) return;
		busy = true;
		error = null;
		try {
			await loans.setShare(debtor.id, enabled);
			toasts.success(enabled ? 'Enlace compartido creado.' : 'Enlace desactivado.');
		} catch (failure) {
			error = messageFor(failure);
		} finally {
			busy = false;
		}
	}
	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			toasts.success('Enlace copiado.');
		} catch {
			toasts.error('No se pudo copiar el enlace. Puedes seleccionarlo y copiarlo manualmente.');
		}
	}
</script>

<Card>
	<h2 class="text-sm font-extrabold">Compartir con {debtor.name.split(' ')[0]}</h2>
	<p class="mt-2 text-xs leading-relaxed text-muted">
		Quien tenga el enlace podrá ver el nombre, saldo, plan mensual y movimientos con sus notas. Solo
		podrá consultar; puedes desactivar el acceso cuando quieras.
	</p>
	{#if debtor.publicToken}
		<label class="mt-4 block text-xs font-bold text-muted" for="loan-share-url"
			>Enlace compartido</label
		>
		<input
			id="loan-share-url"
			readonly
			value={url}
			onfocus={(event) => event.currentTarget.select()}
			class="mt-2 w-full min-w-0 rounded-xl border border-outline bg-canvas px-3 py-3 text-xs"
		/>
		<div class="mt-3 flex flex-wrap gap-2">
			<Button variant="soft" size="sm" icon={Copy} onclick={copy}>Copiar enlace</Button><Button
				variant="secondary"
				size="sm"
				icon={Eye}
				href={path}>Ver estado</Button
			>
		</div>
		<div class="mt-3 flex flex-wrap gap-1">
			<Button
				variant="ghost"
				size="sm"
				icon={RefreshCw}
				disabled={busy}
				onclick={() => (rotate = true)}>Renovar enlace</Button
			><Button
				variant="ghost"
				size="sm"
				icon={Link2Off}
				disabled={busy}
				onclick={() => (revoke = true)}>Desactivar enlace</Button
			>
		</div>
	{:else}<Button class="mt-4" size="sm" icon={Link2} loading={busy} onclick={() => share(true)}
			>Crear enlace compartido</Button
		>{/if}
	{#if error}<p role="alert" class="mt-3 text-xs font-semibold text-expense-strong">{error}</p>{/if}
</Card>
<ConfirmDialog
	bind:open={rotate}
	title="¿Renovar enlace?"
	text="El enlace anterior dejará de funcionar. Comparte el nuevo con la persona."
	confirmLabel="Renovar enlace"
	onconfirm={() => share(true)}
/>
<ConfirmDialog
	bind:open={revoke}
	title="¿Desactivar enlace?"
	text="Las personas que tengan el enlace ya no podrán consultar esta ficha."
	confirmLabel="Desactivar enlace"
	onconfirm={() => share(false)}
/>
