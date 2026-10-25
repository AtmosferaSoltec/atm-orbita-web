<script lang="ts">
	import { Card, HeroCard, ProgressBar } from '#lib/components/ui/index.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import type { CurrencyBalance } from '#lib/domain/loans.ts';
	let { balance, borrowerView = false }: { balance: CurrencyBalance; borrowerView?: boolean } =
		$props();
</script>

<div class="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
	<HeroCard>
		<p class="text-sm font-semibold text-white/85">
			{borrowerView ? 'Te falta pagar' : 'Te falta cobrar'}
		</p>
		<p class="tabular mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
			{formatMoney(balance.balance, balance.currency)}
		</p>
		<div class="mt-4">
			<ProgressBar value={balance.progressPercent} label="Porcentaje devuelto" onDark />
		</div>
		<p class="mt-2 text-xs text-white/80">{balance.progressPercent}% devuelto</p>
	</HeroCard>
	<Card class="flex flex-col justify-center">
		<p class="text-sm font-semibold text-muted">Total prestado</p>
		<p class="tabular mt-2 text-2xl font-extrabold">
			{formatMoney(balance.lent, balance.currency)}
		</p>
		<p class="mt-2 text-xs text-muted">
			{balance.loanCount}
			{balance.loanCount === 1 ? 'préstamo' : 'préstamos'}
		</p>
	</Card>
	<Card class="flex flex-col justify-center">
		<p class="text-sm font-semibold text-muted">Total devuelto</p>
		<p class="tabular mt-2 text-2xl font-extrabold text-income-strong">
			{formatMoney(balance.paid, balance.currency)}
		</p>
		<p class="mt-2 text-xs text-muted">
			{balance.paymentCount}
			{balance.paymentCount === 1 ? 'abono' : 'abonos'}
		</p>
	</Card>
</div>
