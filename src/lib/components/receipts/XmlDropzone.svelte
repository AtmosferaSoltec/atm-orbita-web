<script lang="ts">
	import { CloudUpload, FileCode, LoaderCircle } from '@lucide/svelte';
	import { parseRheXml, RheXmlError, type ParsedReceipt } from '#lib/domain/rhe-xml.ts';

	interface Props {
		onparsed: (receipt: ParsedReceipt, fileName: string) => void;
		onerror: (message: string) => void;
	}

	let { onparsed, onerror }: Props = $props();

	const MAX_BYTES = 1_000_000;

	let dragging = $state(false);
	let reading = $state(false);
	let fileName = $state<string | null>(null);
	let input: HTMLInputElement | undefined = $state();

	async function handle(file: File | undefined) {
		if (!file) return;
		if (!file.name.toLowerCase().endsWith('.xml') && file.type !== 'text/xml') {
			onerror('Elige el archivo .xml del recibo (no el PDF).');
			return;
		}
		if (file.size > MAX_BYTES) {
			onerror('El archivo es demasiado grande para ser un recibo.');
			return;
		}
		reading = true;
		try {
			const parsed = parseRheXml(await file.text());
			fileName = file.name;
			onparsed(parsed, file.name);
		} catch (error) {
			onerror(error instanceof RheXmlError ? error.message : 'No se pudo leer el archivo.');
		} finally {
			reading = false;
			if (input) input.value = '';
		}
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		handle(event.dataTransfer?.files[0]);
	}
</script>

<label
	class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed px-6 py-8 text-center transition-colors {dragging
		? 'border-primary bg-primary-soft'
		: 'border-chip-border bg-surface hover:border-primary hover:bg-primary-soft/40'}"
	ondragover={(e) => {
		e.preventDefault();
		dragging = true;
	}}
	ondragleave={() => (dragging = false)}
	ondrop={onDrop}
>
	<input
		bind:this={input}
		type="file"
		accept=".xml,text/xml,application/xml"
		class="sr-only"
		onchange={(e) => handle(e.currentTarget.files?.[0])}
	/>
	<span
		class="inline-flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"
	>
		{#if reading}
			<LoaderCircle size={24} class="animate-spin" aria-hidden="true" />
		{:else if fileName}
			<FileCode size={24} aria-hidden="true" />
		{:else}
			<CloudUpload size={24} aria-hidden="true" />
		{/if}
	</span>
	{#if fileName}
		<span class="text-sm font-bold">{fileName}</span>
		<span class="text-[13px] text-muted"
			>Revisa los datos abajo. Suelta otro XML para reemplazarlo.</span
		>
	{:else}
		<span class="text-[15px] font-bold"
			>Arrastra el XML del recibo o <span class="text-primary">elígelo</span></span
		>
		<span class="text-[13px] text-muted">
			Llenamos serie, fecha, cliente y montos por ti. El PDF no sirve: usa el XML.
		</span>
	{/if}
</label>
