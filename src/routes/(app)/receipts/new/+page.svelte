<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { PageHeader } from '#lib/components/ui/index.ts';
	import ReceiptForm from '#lib/components/receipts/ReceiptForm.svelte';
	import { receipts } from '#lib/stores/receipts.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
</script>

<svelte:head><title>Nuevo recibo · Orbita</title></svelte:head>

<PageHeader
	title="Nuevo recibo"
	subtitle="Sube el XML que te da SUNAT o escribe los datos."
	back={resolve('/(app)/receipts')}
/>

<ReceiptForm
	submitLabel="Guardar recibo"
	onsubmit={async (draft) => {
		const receipt = receipts.add(draft);
		toasts.success('Recibo guardado.');
		await goto(resolve('/(app)/receipts/[id]', { id: receipt.id }), { replaceState: true });
	}}
/>
