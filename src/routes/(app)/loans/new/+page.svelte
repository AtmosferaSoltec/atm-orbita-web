<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { PageHeader } from '#lib/components/ui/index.ts';
	import LoanForm from '#lib/components/loans/LoanForm.svelte';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
</script>

<svelte:head><title>Nuevo préstamo · Orbita</title></svelte:head>

<PageHeader
	title="Nuevo préstamo"
	subtitle="Define la cuota y desde qué mes empieza a pagarte."
	back={resolve('/(app)/loans')}
/>

<LoanForm
	submitLabel="Guardar préstamo"
	onsubmit={async (draft) => {
		const loan = loans.add(draft);
		toasts.success('Préstamo guardado.');
		await goto(resolve('/(app)/loans/[id]', { id: loan.id }), { replaceState: true });
	}}
/>
