<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { PageHeader } from '#lib/components/ui/index.ts';
	import ReceiptForm from '#lib/components/receipts/ReceiptForm.svelte';
	import ReceiptLoader from '#lib/components/receipts/ReceiptLoader.svelte';
	import { receiptCode } from '#lib/domain/receipts.ts';
	import { receipts } from '#lib/stores/receipts.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
</script>

<svelte:head><title>Editar recibo · Orbita</title></svelte:head>

<ReceiptLoader id={page.params.id ?? ''}>
	{#snippet children(receipt)}
		<PageHeader
			title="Editar recibo"
			subtitle={receiptCode(receipt)}
			back={resolve('/(app)/receipts/[id]', { id: receipt.id })}
		/>
		{#key receipt.id}
			<ReceiptForm
				initial={receipt}
				submitLabel="Guardar cambios"
				onsubmit={async (draft) => {
					await receipts.update(receipt.id, draft);
					toasts.success('Cambios guardados.');
					await goto(resolve('/(app)/receipts/[id]', { id: receipt.id }), { replaceState: true });
				}}
			/>
		{/key}
	{/snippet}
</ReceiptLoader>
