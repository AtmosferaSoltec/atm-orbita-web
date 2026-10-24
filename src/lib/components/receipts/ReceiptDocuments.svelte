<script lang="ts">
	import { Card, ConfirmDialog } from '#lib/components/ui/index.ts';
	import DocumentSlot from '#lib/components/documents/DocumentSlot.svelte';
	import DocumentViewer from '#lib/components/documents/DocumentViewer.svelte';
	import { messageFor } from '#lib/api/errors.ts';
	import type { DocumentKind, StoredDocument } from '#lib/domain/documents.ts';
	import type { Receipt } from '#lib/domain/receipts.ts';
	import { receipts } from '#lib/stores/receipts.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	let { receipt }: { receipt: Receipt } = $props();

	const SLOTS: { kind: DocumentKind; label: string; emptyText: string }[] = [
		{ kind: 'xml', label: 'XML', emptyText: 'Sin XML guardado. Súbelo para tenerlo a la mano.' },
		{ kind: 'pdf', label: 'PDF', emptyText: 'Opcional. Arrástralo o elígelo.' }
	];

	let busy = $state<DocumentKind | null>(null);
	let viewing = $state<StoredDocument | null>(null);
	let viewerOpen = $state(false);
	let toRemove = $state<StoredDocument | null>(null);
	let confirmRemove = $state(false);

	const byKind = $derived(Object.fromEntries(receipt.documents.map((d) => [d.kind, d])));

	async function upload(kind: DocumentKind, file: File) {
		busy = kind;
		const replacing = Boolean(byKind[kind]);
		const error = await receipts.attach(receipt.id, kind, file);
		busy = null;
		if (error) toasts.error(error);
		else toasts.success(`${kind.toUpperCase()} ${replacing ? 'reemplazado' : 'guardado'}.`);
	}

	// The file comes straight from R2 through a short-lived signed URL; R2 sends it
	// as an attachment, so the browser saves it without leaving the page.
	async function download(kind: DocumentKind) {
		try {
			const link = window.document.createElement('a');
			link.href = await receipts.downloadUrl(receipt.id, kind);
			link.rel = 'noopener';
			link.click();
		} catch (failure) {
			toasts.error(messageFor(failure));
		}
	}
</script>

<Card padding="lg">
	<h2 class="text-base font-extrabold">Documentos</h2>
	<p class="mt-1 text-[13px] text-muted">El XML y el PDF del recibo, guardados con él.</p>
	<div class="mt-4 flex flex-col gap-2.5">
		{#each SLOTS as slot (slot.kind)}
			{@const document = byKind[slot.kind]}
			<DocumentSlot
				kind={slot.kind}
				label={slot.label}
				emptyText={slot.emptyText}
				file={document ?? null}
				busy={busy === slot.kind}
				onpick={(file) => upload(slot.kind, file)}
				onview={document
					? () => {
							viewing = document;
							viewerOpen = true;
						}
					: undefined}
				ondownload={document ? () => download(slot.kind) : undefined}
				onremove={document
					? () => {
							toRemove = document;
							confirmRemove = true;
						}
					: undefined}
			/>
		{/each}
	</div>
</Card>

<DocumentViewer
	bind:open={viewerOpen}
	document={viewing}
	load={(d) => receipts.read(receipt.id, d.kind)}
/>

<ConfirmDialog
	bind:open={confirmRemove}
	title="¿Quitar el {toRemove?.kind.toUpperCase()}?"
	text="Se borra el archivo {toRemove?.fileName ?? ''}. Los datos del recibo no cambian."
	confirmLabel="Quitar"
	onconfirm={async () => {
		if (!toRemove) return;
		try {
			await receipts.detach(receipt.id, toRemove.kind);
			toasts.success('Archivo quitado.');
		} catch (failure) {
			toasts.error(messageFor(failure));
		}
	}}
/>
