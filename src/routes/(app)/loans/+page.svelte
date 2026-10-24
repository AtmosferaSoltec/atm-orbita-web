<script lang="ts">
	import { resolve } from '$app/paths';
	import { CircleAlert, HandCoins, Plus, Wallet } from '@lucide/svelte';
	import {
		Button,
		Card,
		EmptyState,
		PageHeader,
		SegmentedControl,
		StatCard
	} from '#lib/components/ui/index.ts';
	import LoanCard from '#lib/components/loans/LoanCard.svelte';
	import { formatMoney, type Currency } from '#lib/domain/money.ts';
	import { todayIso } from '#lib/domain/dates.ts';
	import { summarizeLoan } from '#lib/domain/loans.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';

	type Filter = 'active' | 'completed' | 'all';

	const today = todayIso();
	let filter = $state<Filter>('active');

	const items = $derived(
		loans.items
			.map((loan) => ({ loan, summary: summarizeLoan(loan, today) }))
			.sort((a, b) => {
				const rank = { overdue: 0, 'on-track': 1, 'not-started': 2, completed: 3 };
				return (
					rank[a.summary.status] - rank[b.summary.status] || b.summary.balance - a.summary.balance
				);
			})
	);
	const visible = $derived(
		items.filter(({ summary }) =>
			filter === 'all'
				? true
				: filter === 'completed'
					? summary.status === 'completed'
					: summary.status !== 'completed'
		)
	);

	function totals(currency: Currency) {
		const ofCurrency = items.filter((i) => i.loan.currency === currency);
		return {
			balance: ofCurrency.reduce((acc, i) => acc + i.summary.balance, 0),
			overdue: ofCurrency.reduce((acc, i) => acc + i.summary.overdueAmount, 0),
			count: ofCurrency.length
		};
	}

	const pen = $derived(totals('PEN'));
	const usd = $derived(totals('USD'));
	const overduePeople = $derived(items.filter((i) => i.summary.status === 'overdue').length);

	function joinAmounts(penValue: number, usdValue: number): string {
		const parts = [];
		if (penValue || !usdValue) parts.push(formatMoney(penValue, 'PEN'));
		if (usdValue) parts.push(formatMoney(usdValue, 'USD'));
		return parts.join(' + ');
	}
</script>

<svelte:head><title>Préstamos · Orbita</title></svelte:head>

<PageHeader title="Préstamos" subtitle="Lo que prestaste y cómo te lo van devolviendo.">
	{#snippet actions()}
		<Button href={resolve('/(app)/loans/new')} icon={Plus}>Nuevo préstamo</Button>
	{/snippet}
</PageHeader>

<div class="grid gap-4 sm:grid-cols-2">
	<StatCard
		icon={Wallet}
		tone="income"
		label="Por cobrar en total"
		value={joinAmounts(pen.balance, usd.balance)}
		hint="Suma de lo que falta pagar en todos tus préstamos."
	/>
	<StatCard
		icon={CircleAlert}
		tone="expense"
		label="Atrasado"
		value={joinAmounts(pen.overdue, usd.overdue)}
		colorValue={pen.overdue + usd.overdue > 0}
		hint={overduePeople
			? `${overduePeople} ${overduePeople === 1 ? 'persona tiene' : 'personas tienen'} cuotas vencidas.`
			: 'Nadie tiene cuotas vencidas.'}
	/>
</div>

<div class="mt-8">
	<SegmentedControl
		label="Filtrar préstamos"
		bind:value={filter}
		options={[
			{ value: 'active', label: 'En curso' },
			{ value: 'completed', label: 'Pagados' },
			{ value: 'all', label: 'Todos' }
		]}
	/>
</div>

{#if visible.length}
	<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each visible as { loan, summary } (loan.id)}
			<LoanCard {loan} {summary} />
		{/each}
	</div>
{:else}
	<Card class="mt-4">
		<EmptyState
			icon={HandCoins}
			tone="income"
			title={filter === 'completed'
				? 'Aún no hay préstamos pagados'
				: 'No tienes préstamos en curso'}
			text="Registra a quién le prestaste, cuánto y desde cuándo te paga."
		>
			{#snippet action()}
				<Button href={resolve('/(app)/loans/new')} icon={Plus}>Nuevo préstamo</Button>
			{/snippet}
		</EmptyState>
	</Card>
{/if}
