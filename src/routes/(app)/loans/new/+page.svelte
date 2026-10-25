<script lang="ts">
	import { newId } from '#lib/data/storage.ts';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { PageHeader } from '#lib/components/ui/index.ts';
	import LoanForm from '#lib/components/loans/LoanForm.svelte';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
	const requestId = newId();
</script>

<svelte:head><title>Nuevo deudor · Orbita</title></svelte:head>
<PageHeader
	title="Nuevo deudor"
	subtitle="Elige el nombre y la moneda. Los préstamos se añaden después."
	back={resolve('/(app)/loans')}
/>
<LoanForm
	onsubmit={async (name, currency) => {
		const debtor = await loans.add(name, currency, requestId);
		toasts.success('Deudor creado.');
		await goto(resolve('/(app)/loans/[id]', { id: debtor.id }), { replaceState: true });
	}}
/>
