<script lang="ts">
	import { resolve } from '$app/paths';
	import { HandCoins, Plus, Search, Users } from '@lucide/svelte';
	import {
		Button,
		Card,
		EmptyState,
		PageHeader,
		SegmentedControl,
		TextField
	} from '#lib/components/ui/index.ts';
	import LoanCard from '#lib/components/loans/LoanCard.svelte';
	import { LOAN_CURRENCIES, balancesOf, hasDebt } from '#lib/domain/loans.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	let query = $state('');
	let filter = $state<'all' | 'active' | 'settled'>('all');
	const totals = $derived(
		LOAN_CURRENCIES.map((currency) => ({
			currency,
			balance: loans.items
				.flatMap(balancesOf)
				.filter((b) => b.currency === currency)
				.reduce((s, b) => s + b.balance, 0)
		}))
	);
	const filtered = $derived(
		loans.items
			.filter(
				(d) =>
					d.name.toLocaleLowerCase('es-PE').includes(query.trim().toLocaleLowerCase('es-PE')) &&
					(filter === 'all' ||
						(filter === 'active' ? hasDebt(d) : d.movements.length > 0 && !hasDebt(d)))
			)
			.toSorted(
				(a, b) => Number(hasDebt(b)) - Number(hasDebt(a)) || a.name.localeCompare(b.name, 'es')
			)
	);
</script>

<svelte:head><title>Préstamos · Orbita</title></svelte:head>
<PageHeader title="Préstamos" subtitle="Todo lo que prestas y recibes, organizado por persona.">
	{#snippet actions()}<Button icon={Plus} href={resolve('/(app)/loans/new')}>Nuevo deudor</Button
		>{/snippet}
</PageHeader>
<div class="mb-6 grid gap-4 sm:grid-cols-2">
	{#each totals as total (total.currency)}<Card
			><div class="flex items-center justify-between">
				<p class="text-sm font-bold text-muted">
					Por cobrar en {total.currency === 'PEN' ? 'soles' : 'dólares'}
				</p>
				<HandCoins size={20} class="text-primary" aria-hidden="true" />
			</div>
			<p class="tabular mt-2 text-3xl font-extrabold">
				{formatMoney(total.balance, total.currency)}
			</p></Card
		>{/each}
</div>
<div class="mb-5 flex flex-wrap items-center justify-between gap-4">
	<div class="w-full sm:w-72">
		<TextField
			label="Buscar persona"
			bind:value={query}
			icon={Search}
			placeholder="Nombre del deudor"
		/>
	</div>
	<SegmentedControl
		bind:value={filter}
		label="Filtrar deudores"
		options={[
			{ value: 'all', label: 'Todos' },
			{ value: 'active', label: 'Por cobrar' },
			{ value: 'settled', label: 'Saldados' }
		]}
		size="sm"
	/>
</div>
{#if filtered.length}<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each filtered as debtor (debtor.id)}<LoanCard {debtor} />{/each}
	</div>{:else}<Card
		><EmptyState
			icon={Users}
			title={loans.items.length ? 'Sin resultados' : '¿A quién le vas a prestar?'}
			text={loans.items.length
				? 'Prueba con otro nombre o cambia el filtro.'
				: 'Crea la persona con su nombre y añade los préstamos desde su ficha.'}
		/></Card
	>{/if}
