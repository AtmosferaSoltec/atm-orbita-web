<script lang="ts">
	import { resolve } from '$app/paths';
	import { ChevronRight } from '@lucide/svelte';
	import { Avatar, Badge, Card, ProgressBar } from '#lib/components/ui/index.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatMonth, todayIso, toMonthKey } from '#lib/domain/dates.ts';
	import { balancesOf, monthlyLoanSummary, hasDebt, type Debtor } from '#lib/domain/loans.ts';
	let { debtor }: { debtor: Debtor } = $props();
	const balances = $derived(balancesOf(debtor));
	const active = $derived(hasDebt(debtor));
	const current = $derived(
		monthlyLoanSummary(debtor).find((m) => m.month === toMonthKey(todayIso()))
	);
</script>

<Card href={resolve('/(app)/loans/[id]', { id: debtor.id })} class="h-full">
	<div class="flex items-center gap-3">
		<Avatar name={debtor.name} />
		<div class="min-w-0 flex-1">
			<h2 class="truncate font-extrabold">{debtor.name}</h2>
			<p class="mt-0.5 text-xs text-muted">
				{debtor.currency === 'PEN' ? 'Soles' : 'Dólares'} · {debtor.movements.filter(
					(m) => m.kind === 'loan'
				).length}
				{debtor.movements.filter((m) => m.kind === 'loan').length === 1
					? 'préstamo registrado'
					: 'préstamos registrados'}
			</p>
		</div>
		<Badge tone={active ? 'orange' : balances.length ? 'income' : 'neutral'}
			>{active ? 'Por cobrar' : balances.length ? 'Saldado' : 'Sin préstamos'}</Badge
		>
	</div>
	<div class="mt-5 space-y-4">
		{#each balances as balance (balance.currency)}
			<div>
				<div class="flex items-end justify-between gap-2">
					<div>
						<p class="text-xs font-semibold text-muted">
							Saldo en {balance.currency === 'PEN' ? 'soles' : 'dólares'}
						</p>
						<p class="tabular mt-1 text-2xl font-extrabold">
							{formatMoney(balance.balance, balance.currency)}
						</p>
					</div>
					<p class="tabular text-xs text-muted">de {formatMoney(balance.lent, balance.currency)}</p>
				</div>
				<div class="mt-2">
					<ProgressBar value={balance.progressPercent} label="Porcentaje devuelto" />
				</div>
			</div>
		{:else}
			<p class="rounded-2xl bg-canvas p-4 text-sm text-muted">
				Su ficha está lista. Añade el primer préstamo.
			</p>
		{/each}
	</div>
	<div
		class="mt-5 flex items-center justify-between gap-2 border-t border-divider pt-3 text-xs font-semibold text-muted"
	>
		<span
			>{#if current?.expected}{formatMonth(current.month)} · falta {formatMoney(
					current.remaining,
					debtor.currency
				)}{:else}Reparto por meses · abonos flexibles{/if}</span
		>
		<ChevronRight size={16} aria-hidden="true" />
	</div>
</Card>
