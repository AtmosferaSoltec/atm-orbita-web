<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from '@lucide/svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg';
		footer?: Snippet;
		children?: Snippet;
	}

	let { open = $bindable(), title, description, size = 'md', footer, children }: Props = $props();

	const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-4xl' };

	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});
</script>

<!-- Native <dialog>: focus trap, Esc to close and an inert background come for free. -->
<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	onclick={(e) => e.target === dialog && (open = false)}
	class="m-auto w-[calc(100%-2rem)] rounded-hero bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] {SIZES[
		size
	]}"
	aria-labelledby="modal-title"
>
	{#if open}
		<div class="p-6">
			<div class="flex items-start gap-3">
				<div class="min-w-0 flex-1">
					<h2 id="modal-title" class="text-lg font-extrabold">{title}</h2>
					{#if description}<p class="mt-1 text-sm text-muted">{description}</p>{/if}
				</div>
				<button
					type="button"
					class="-mt-1 -mr-2 inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-neutral-soft"
					onclick={() => (open = false)}
					aria-label="Cerrar"
				>
					<X size={19} />
				</button>
			</div>
			{#if children}<div class="mt-5">{@render children()}</div>{/if}
			{#if footer}<div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
					{@render footer()}
				</div>{/if}
		</div>
	{/if}
</dialog>
