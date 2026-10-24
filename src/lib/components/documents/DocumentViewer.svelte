<script lang="ts">
	import { Download, ExternalLink, LoaderCircle } from '@lucide/svelte';
	import { Button, Modal } from '#lib/components/ui/index.ts';
	import { formatFileSize, type StoredDocument } from '#lib/domain/documents.ts';
	import { downloadBlob, formatXml } from './files';

	interface Props {
		open: boolean;
		document: StoredDocument | null;
		/** Reads the file's bytes from storage. */
		load: (document: StoredDocument) => Promise<Blob | null>;
	}

	let { open = $bindable(), document, load }: Props = $props();

	let blob = $state<Blob | null>(null);
	let url = $state<string | null>(null);
	let xmlText = $state('');
	let status = $state<'loading' | 'ready' | 'missing'>('loading');

	$effect(() => {
		if (!open || !document) return;
		const current = document;
		let objectUrl: string | null = null;
		let cancelled = false;
		status = 'loading';

		load(current)
			.catch(() => null)
			.then(async (result) => {
				if (cancelled) return;
				if (!result) {
					status = 'missing';
					return;
				}
				blob = result;
				if (current.kind === 'pdf') {
					objectUrl = URL.createObjectURL(new Blob([result], { type: 'application/pdf' }));
					url = objectUrl;
				} else {
					xmlText = formatXml(await result.text());
				}
				status = 'ready';
			});

		return () => {
			cancelled = true;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
			url = null;
			blob = null;
			xmlText = '';
		};
	});
</script>

<Modal
	bind:open
	size="lg"
	title={document?.fileName ?? ''}
	description={document
		? `${document.kind.toUpperCase()} · ${formatFileSize(document.size)}`
		: undefined}
>
	{#if status === 'loading'}
		<div class="flex h-[60vh] items-center justify-center text-muted">
			<LoaderCircle size={28} class="animate-spin" aria-label="Cargando" />
		</div>
	{:else if status === 'missing'}
		<p class="rounded-2xl bg-expense-soft px-4 py-3 text-sm font-semibold text-expense-strong">
			No se pudo abrir el archivo. Revisa tu conexión e inténtalo de nuevo.
		</p>
	{:else if document?.kind === 'pdf' && url}
		<!-- Browsers without a built-in PDF viewer (some phones) show the fallback instead. -->
		<object
			data={url}
			type="application/pdf"
			title="Vista previa de {document.fileName}"
			class="h-[70vh] w-full rounded-2xl border border-outline bg-canvas"
		>
			<div class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
				<p class="font-bold">Tu navegador no puede mostrar el PDF aquí.</p>
				<p class="text-sm text-muted">Ábrelo en otra pestaña o descárgalo.</p>
			</div>
		</object>
	{:else}
		<pre
			class="h-[70vh] overflow-auto rounded-2xl border border-outline bg-canvas p-4 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-neutral">{xmlText}</pre>
	{/if}
	{#snippet footer()}
		<Button variant="secondary" block onclick={() => (open = false)}>Cerrar</Button>
		{#if document?.kind === 'pdf' && url}
			<Button
				variant="secondary"
				block
				icon={ExternalLink}
				onclick={() => window.open(url ?? '', '_blank')}
			>
				Abrir en otra pestaña
			</Button>
		{/if}
		<Button
			block
			icon={Download}
			disabled={!blob}
			onclick={() => blob && document && downloadBlob(blob, document.fileName)}
		>
			Descargar
		</Button>
	{/snippet}
</Modal>
