<script lang="ts">
	import {
		Download,
		Eye,
		FileCode,
		FileText,
		LoaderCircle,
		RefreshCw,
		Trash2,
		Upload
	} from '@lucide/svelte';
	import { IconButton } from '#lib/components/ui/index.ts';
	import { DOCUMENT_ACCEPT, formatFileSize, type DocumentKind } from '#lib/domain/documents.ts';
	import { formatDate } from '#lib/domain/dates.ts';

	// One file slot (XML or PDF): empty with a pick button, or the file with its actions.

	interface Props {
		kind: DocumentKind;
		label: string;
		file: { fileName: string; size: number; uploadedAt?: string } | null;
		/** Shown when the slot is empty. */
		emptyText: string;
		busy?: boolean;
		onpick?: (file: File) => void;
		onview?: () => void;
		ondownload?: () => void;
		onremove?: () => void;
	}

	let {
		kind,
		label,
		file,
		emptyText,
		busy = false,
		onpick,
		onview,
		ondownload,
		onremove
	}: Props = $props();

	let input: HTMLInputElement | undefined = $state();
	let dragging = $state(false);

	const Icon = $derived(kind === 'xml' ? FileCode : FileText);

	function pick(files: FileList | null | undefined) {
		const chosen = files?.[0];
		if (chosen) onpick?.(chosen);
		if (input) input.value = '';
	}
</script>

<input
	bind:this={input}
	type="file"
	accept={DOCUMENT_ACCEPT[kind]}
	class="sr-only"
	tabindex="-1"
	aria-hidden="true"
	onchange={(e) => pick(e.currentTarget.files)}
/>

{#if file}
	<div class="rounded-field border border-outline bg-surface">
		<div class="flex items-center gap-3 p-3">
			<span
				class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl {kind === 'xml'
					? 'bg-primary-soft text-primary'
					: 'bg-expense-soft text-expense-strong'}"
				aria-hidden="true"
			>
				{#if busy}<LoaderCircle size={19} class="animate-spin" />{:else}<Icon size={19} />{/if}
			</span>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-bold" title={file.fileName}>{file.fileName}</p>
				<p class="text-xs text-muted">
					{label} · {formatFileSize(file.size)}{file.uploadedAt
						? ` · ${formatDate(file.uploadedAt.slice(0, 10))}`
						: ''}
				</p>
			</div>
			{#if onremove && !onview && !ondownload}
				<IconButton icon={Trash2} label="Quitar {label}" variant="danger" onclick={onremove} />
			{/if}
		</div>
		{#if onview || ondownload}
			<div class="flex items-center justify-end gap-0.5 border-t border-divider px-2 py-1">
				{#if onview}<IconButton
						icon={Eye}
						label="Ver {label}"
						variant="ghost"
						onclick={onview}
					/>{/if}
				{#if ondownload}
					<IconButton
						icon={Download}
						label="Descargar {label}"
						variant="ghost"
						onclick={ondownload}
					/>
				{/if}
				{#if onpick}
					<IconButton
						icon={RefreshCw}
						label="Reemplazar {label}"
						variant="ghost"
						disabled={busy}
						onclick={() => input?.click()}
					/>
				{/if}
				{#if onremove}
					<IconButton icon={Trash2} label="Quitar {label}" variant="danger" onclick={onremove} />
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<button
		type="button"
		disabled={busy || !onpick}
		onclick={() => input?.click()}
		ondragover={(e) => {
			e.preventDefault();
			dragging = true;
		}}
		ondragleave={() => (dragging = false)}
		ondrop={(e) => {
			e.preventDefault();
			dragging = false;
			pick(e.dataTransfer?.files);
		}}
		class="flex w-full items-center gap-3 rounded-field border-2 border-dashed p-3 text-left transition-colors disabled:cursor-default {dragging
			? 'border-primary bg-primary-soft'
			: 'border-chip-border hover:border-primary hover:bg-primary-soft/40 disabled:hover:border-chip-border disabled:hover:bg-transparent'}"
	>
		<span
			class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-soft text-muted"
			aria-hidden="true"
		>
			{#if busy}<LoaderCircle size={19} class="animate-spin" />{:else}<Upload size={19} />{/if}
		</span>
		<span class="min-w-0 flex-1">
			<span class="block text-sm font-bold">{label}</span>
			<span class="block text-xs text-muted">{emptyText}</span>
		</span>
	</button>
{/if}
