<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { CircleCheck, Clock, FileQuestion, Pencil, Trash2, Undo2 } from '@lucide/svelte';
	import {
		Badge,
		Button,
		Card,
		ConfirmDialog,
		EmptyState,
		IconButton,
		PageHeader
	} from '#lib/components/ui/index.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatDate, todayIso } from '#lib/domain/dates.ts';
	import { netOf, receiptCode } from '#lib/domain/receipts.ts';
	import ReceiptDocuments from '#lib/components/receipts/ReceiptDocuments.svelte';
	import { receipts } from '#lib/stores/receipts.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	const receipt = $derived(receipts.get(page.params.id ?? ''));
	let confirmDelete = $state(false);

	const DOC_LABEL = { RUC: 'RUC', DNI: 'DNI', OTRO: 'Documento' };

	async function remove() {
		if (!receipt) return;
		receipts.remove(receipt.id);
		toasts.success('Recibo eliminado.');
		await goto(resolve('/(app)/receipts'), { replaceState: true });
	}
</script>

<svelte:head><title>Recibo · Orbita</title></svelte:head>

{#if receipt}
	<PageHeader
		title={receipt.client.name}
		subtitle="Recibo {receiptCode(receipt)} · {formatDate(receipt.issueDate)}"
		back={resolve('/(app)/receipts')}
	>
		{#snippet actions()}
			<IconButton
				icon={Trash2}
				label="Eliminar recibo"
				variant="danger"
				onclick={() => (confirmDelete = true)}
			/>
			<Button
				href={resolve('/(app)/receipts/[id]/edit', { id: receipt.id })}
				variant="secondary"
				icon={Pencil}>Editar</Button
			>
		{/snippet}
	</PageHeader>

	<div class="grid gap-5 lg:grid-cols-[1fr_340px]">
		<Card padding="lg">
			<div class="flex flex-wrap items-center gap-2">
				{#if receipt.collectedOn}
					<Badge tone="income" icon={CircleCheck}
						>Cobrado el {formatDate(receipt.collectedOn)}</Badge
					>
				{:else}
					<Badge tone="orange" icon={Clock}>Por cobrar</Badge>
				{/if}
				<Badge tone="neutral"
					>{receipt.source === 'xml' ? 'Registrado desde XML' : 'Registrado a mano'}</Badge
				>
			</div>

			<dl class="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
				<div>
					<dt class="text-[13px] font-bold text-muted">Serie y número</dt>
					<dd class="mt-1 font-bold">{receiptCode(receipt)}</dd>
				</div>
				<div>
					<dt class="text-[13px] font-bold text-muted">Fecha de emisión</dt>
					<dd class="mt-1 font-bold">{formatDate(receipt.issueDate)}</dd>
				</div>
				<div>
					<dt class="text-[13px] font-bold text-muted">Cliente</dt>
					<dd class="mt-1 font-bold">{receipt.client.name}</dd>
				</div>
				<div>
					<dt class="text-[13px] font-bold text-muted">{DOC_LABEL[receipt.client.docType]}</dt>
					<dd class="tabular mt-1 font-bold">{receipt.client.docNumber || '—'}</dd>
				</div>
				<div class="sm:col-span-2">
					<dt class="text-[13px] font-bold text-muted">Descripción</dt>
					<dd class="mt-1 font-medium">{receipt.description || 'Sin descripción'}</dd>
				</div>
			</dl>
		</Card>

		<div class="flex flex-col gap-5 lg:self-start">
			<Card padding="lg">
				<dl class="tabular flex flex-col gap-3 text-[15px]">
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Bruto</dt>
						<dd class="font-bold">{formatMoney(receipt.gross)}</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Retención (8 %)</dt>
						<dd class="font-bold text-expense-strong">{formatMoney(-receipt.withholding)}</dd>
					</div>
					<div class="flex justify-between gap-3 border-t border-divider pt-3">
						<dt class="font-bold">Neto</dt>
						<dd class="text-xl font-extrabold">{formatMoney(netOf(receipt))}</dd>
					</div>
				</dl>
				<div class="mt-6">
					{#if receipt.collectedOn}
						<Button
							variant="secondary"
							block
							icon={Undo2}
							onclick={() => receipts.setCollected(receipt.id, null)}
						>
							Marcar como por cobrar
						</Button>
					{:else}
						<Button
							block
							icon={CircleCheck}
							onclick={() => {
								receipts.setCollected(receipt.id, todayIso());
								toasts.success('Recibo marcado como cobrado.');
							}}
						>
							Marcar como cobrado hoy
						</Button>
					{/if}
				</div>
			</Card>
			<ReceiptDocuments {receipt} />
		</div>
	</div>

	<ConfirmDialog
		bind:open={confirmDelete}
		title="¿Eliminar este recibo?"
		text="Dejará de contar para tu tope anual y se borrarán su XML y su PDF. Esta acción no se puede deshacer."
		onconfirm={remove}
	/>
{:else}
	<Card>
		<EmptyState icon={FileQuestion} tone="neutral" title="Este registro ya no existe.">
			{#snippet action()}<Button href={resolve('/(app)/receipts')}>Volver a recibos</Button
				>{/snippet}
		</EmptyState>
	</Card>
{/if}
