<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { PageHeader } from '#lib/components/ui/index.ts';
	import LoanForm from '#lib/components/loans/LoanForm.svelte';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
	const debtor = $derived(loans.get(page.params.id ?? ''));
</script>

<svelte:head><title>Editar deudor · Orbita</title></svelte:head>
<PageHeader
	title="Editar deudor"
	back={debtor ? resolve('/(app)/loans/[id]', { id: debtor.id }) : resolve('/(app)/loans')}
/>
{#if debtor}{#key debtor.id}<LoanForm
			initial={debtor.name}
			initialCurrency={debtor.currency}
			currencyLocked
			submitLabel="Guardar nombre"
			onsubmit={async (name) => {
				if (!debtor) return;
				const error = await loans.rename(debtor.id, name);
				if (error) return error;
				toasts.success('Nombre actualizado.');
				await goto(resolve('/(app)/loans/[id]', { id: debtor.id }));
			}}
		/>{/key}{:else}<p class="text-sm text-muted">No se encontró a la persona.</p>{/if}
