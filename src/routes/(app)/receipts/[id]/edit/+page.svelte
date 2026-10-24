<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { FileQuestion } from '@lucide/svelte';
	import { Button, Card, EmptyState, PageHeader } from '#lib/components/ui/index.ts';
	import ReceiptForm from '#lib/components/receipts/ReceiptForm.svelte';
	import { receiptCode } from '#lib/domain/receipts.ts';
	import { receipts } from '#lib/stores/receipts.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	const receipt = $derived(receipts.get(page.params.id ?? ''));
</script>

<svelte:head><title>Editar recibo · Orbita</title></svelte:head>

{#if receipt}
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
				receipts.update(receipt.id, draft);
				toasts.success('Cambios guardados.');
				await goto(resolve('/(app)/receipts/[id]', { id: receipt.id }), { replaceState: true });
			}}
		/>
	{/key}
{:else}
	<Card>
		<EmptyState icon={FileQuestion} tone="neutral" title="Este registro ya no existe.">
			{#snippet action()}<Button href={resolve('/(app)/receipts')}>Volver a recibos</Button
				>{/snippet}
		</EmptyState>
	</Card>
{/if}
