<script lang="ts">
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { CircleAlert, FileQuestion, RefreshCw } from '@lucide/svelte';
	import { Button, Card, EmptyState } from '#lib/components/ui/index.ts';
	import { isApiError, messageFor } from '#lib/api/errors.ts';
	import type { Receipt } from '#lib/domain/receipts.ts';
	import { receipts } from '#lib/stores/receipts.svelte.ts';

	// Loads a receipt by id and shows it with `children`, or its loading,
	// not-found and error states. A receipt already in memory shows at once.

	interface Props {
		id: string;
		children: Snippet<[Receipt]>;
	}

	let { id, children }: Props = $props();

	let status = $state<'loading' | 'ready' | 'missing' | 'error'>('loading');
	let errorMessage = $state('');

	const receipt = $derived(receipts.find(id));

	async function load(target: string) {
		if (!receipts.find(target)) status = 'loading';
		try {
			await receipts.get(target);
			status = 'ready';
		} catch (failure) {
			status = isApiError(failure, 'NOT_FOUND') ? 'missing' : 'error';
			errorMessage = messageFor(failure);
		}
	}

	$effect(() => {
		const target = id;
		untrack(() => load(target));
	});
</script>

{#if receipt && status !== 'missing'}
	{@render children(receipt)}
{:else if status === 'loading'}
	<div aria-busy="true" aria-label="Cargando recibo">
		<div class="mb-6 h-12 w-2/3 animate-pulse rounded-2xl bg-neutral-soft"></div>
		<div class="grid gap-5 lg:grid-cols-[1fr_340px]">
			<div class="h-72 animate-pulse rounded-card bg-neutral-soft"></div>
			<div class="h-72 animate-pulse rounded-card bg-neutral-soft"></div>
		</div>
	</div>
{:else if status === 'error'}
	<Card>
		<EmptyState icon={CircleAlert} tone="expense" title="No se pudo cargar" text={errorMessage}>
			{#snippet action()}
				<Button icon={RefreshCw} onclick={() => load(id)}>Reintentar</Button>
			{/snippet}
		</EmptyState>
	</Card>
{:else}
	<Card>
		<EmptyState icon={FileQuestion} tone="neutral" title="Este registro ya no existe.">
			{#snippet action()}
				<Button href={resolve('/(app)/receipts')}>Volver a recibos</Button>
			{/snippet}
		</EmptyState>
	</Card>
{/if}
