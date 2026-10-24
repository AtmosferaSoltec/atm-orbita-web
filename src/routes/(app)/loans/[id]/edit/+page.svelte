<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { FileQuestion } from '@lucide/svelte';
	import { Button, Card, EmptyState, PageHeader } from '#lib/components/ui/index.ts';
	import LoanForm from '#lib/components/loans/LoanForm.svelte';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	const loan = $derived(loans.get(page.params.id ?? ''));
</script>

<svelte:head><title>Editar préstamo · Orbita</title></svelte:head>

{#if loan}
	<PageHeader
		title="Editar préstamo"
		subtitle={loan.borrower.name}
		back={resolve('/(app)/loans/[id]', { id: loan.id })}
	/>
	{#if loan.payments.length}
		<p class="mb-5 rounded-2xl bg-orange-soft px-4 py-3 text-sm font-semibold text-orange-strong">
			Ya tiene pagos registrados. Si cambias la cuota o el mes de inicio, el cronograma se vuelve a
			calcular con esos pagos.
		</p>
	{/if}
	{#key loan.id}
		<LoanForm
			initial={loan}
			submitLabel="Guardar cambios"
			onsubmit={async (draft) => {
				loans.update(loan.id, draft);
				toasts.success('Cambios guardados.');
				await goto(resolve('/(app)/loans/[id]', { id: loan.id }), { replaceState: true });
			}}
		/>
	{/key}
{:else}
	<Card>
		<EmptyState icon={FileQuestion} tone="neutral" title="Este registro ya no existe.">
			{#snippet action()}<Button href={resolve('/(app)/loans')}>Volver a préstamos</Button
				>{/snippet}
		</EmptyState>
	</Card>
{/if}
