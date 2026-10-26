<script lang="ts">
	import { page } from '$app/state';
	import { Eye, HandCoins } from '@lucide/svelte';
	import { Card, EmptyState, Logo } from '#lib/components/ui/index.ts';
	import LoanOverview from '#lib/components/loans/LoanOverview.svelte';
	import MovementList from '#lib/components/loans/MovementList.svelte';
	import { balancesOf, sortedMovements } from '#lib/domain/loans.ts';
	import MonthlyPlan from '#lib/components/loans/MonthlyPlan.svelte';

	import { sharedDebtor } from '#lib/api/loans.ts';
	import { ApiError, messageFor } from '#lib/api/errors.ts';
	import type { Debtor } from '#lib/domain/loans.ts';
	import { Button } from '#lib/components/ui/index.ts';
	let debtor = $state<Debtor | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let retry = $state(0);
	$effect(() => {
		const token = page.params.token ?? '';
		void retry;
		let active = true;
		debtor = null;
		loading = true;
		error = null;
		sharedDebtor(token)
			.then((result) => {
				if (active) debtor = result;
			})
			.catch((failure) => {
				if (active)
					error =
						failure instanceof ApiError && failure.status === 404
							? 'El enlace no existe o fue desactivado por quien lo compartió.'
							: messageFor(failure);
			})
			.finally(() => {
				if (active) loading = false;
			});
		return () => {
			active = false;
		};
	});
</script>

<svelte:head
	><meta name="referrer" content="no-referrer" /><meta
		name="robots"
		content="noindex, nofollow"
	/><title>{debtor?.name ?? 'Estado de préstamos'} · Orbita</title></svelte:head
>
<main class="mx-auto max-w-4xl px-4 py-8 sm:py-12">
	<Logo />
	<div
		class="mt-6 mb-6 flex items-start gap-2 rounded-2xl bg-primary-soft p-4 text-sm text-primary"
	>
		<Eye size={18} class="shrink-0" aria-hidden="true" />
		<p>
			Estado compartido de solo lectura. Aquí puedes consultar el plan mensual y los abonos
			registrados.
		</p>
	</div>
	{#if loading}<p role="status" class="py-8 text-center text-sm text-muted">
			Cargando estado de préstamos…
		</p>{:else if debtor}
		<h1 class="text-2xl font-extrabold">Estado de préstamos de {debtor.name}</h1>
		<p class="mt-1 mb-6 text-sm text-muted">
			El detalle de lo prestado, lo devuelto y lo que falta pagar.
		</p>
		{#each balancesOf(debtor) as balance (balance.currency)}<section class="mb-6">
				<h2 class="mb-3 text-sm font-bold text-muted">
					{balance.currency === 'PEN' ? 'Soles' : 'Dólares'}
				</h2>
				<LoanOverview {balance} borrowerView />
			</section>{/each}
		<MonthlyPlan {debtor} readonly={true} />

		<Card padding="none"
			><h2 class="border-b border-divider p-5 font-extrabold">Movimientos</h2>
			<MovementList movements={sortedMovements(debtor)} /></Card
		>
	{:else}<Card
			><EmptyState
				icon={HandCoins}
				title="Estado no disponible"
				text={error ?? 'Este enlace no está disponible.'}
			/>
			<div class="flex justify-center pb-6">
				<Button variant="secondary" onclick={() => retry++}>Reintentar</Button>
			</div></Card
		>{/if}
</main>
