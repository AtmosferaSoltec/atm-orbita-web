<script lang="ts">
	import { resolve } from '$app/paths';
	import { Check, Copy, ExternalLink, RefreshCw } from '@lucide/svelte';
	import { Button, Card, ConfirmDialog } from '#lib/components/ui/index.ts';
	import type { Loan } from '#lib/domain/loans.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	let { loan }: { loan: Loan } = $props();

	let copied = $state(false);
	let confirmRegenerate = $state(false);

	const path = $derived(resolve('/share/loans/[token]', { token: loan.publicToken }));
	const url = $derived(`${location.origin}${path}`);

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			toasts.error('No se pudo copiar. Selecciona el enlace y cópialo a mano.');
		}
	}
</script>

<Card padding="lg">
	<h2 class="text-base font-extrabold">Enlace para {loan.borrower.name.split(' ')[0]}</h2>
	<p class="mt-1 text-[13px] text-muted">
		Ve su cronograma y sus pagos, sin poder cambiar nada. No necesita cuenta.
	</p>
	<div
		class="mt-4 flex items-center gap-2 rounded-field border border-outline bg-canvas px-3 py-2.5"
	>
		<input
			readonly
			value={url}
			class="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-neutral outline-none"
			aria-label="Enlace público"
			onfocus={(e) => e.currentTarget.select()}
		/>
	</div>
	<div class="mt-3 grid grid-cols-2 gap-2">
		<Button variant="soft" size="sm" icon={copied ? Check : Copy} onclick={copy}>
			{copied ? 'Copiado' : 'Copiar'}
		</Button>
		<Button variant="secondary" size="sm" icon={ExternalLink} href={path}>Vista pública</Button>
	</div>
	<button
		type="button"
		class="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-muted hover:text-ink"
		onclick={() => (confirmRegenerate = true)}
	>
		<RefreshCw size={14} aria-hidden="true" /> Crear un enlace nuevo
	</button>
</Card>

<ConfirmDialog
	bind:open={confirmRegenerate}
	title="¿Crear un enlace nuevo?"
	text="El enlace actual dejará de funcionar. Tendrás que compartir el nuevo."
	confirmLabel="Crear enlace nuevo"
	onconfirm={() => {
		loans.regenerateLink(loan.id);
		toasts.success('Enlace nuevo creado.');
	}}
/>
