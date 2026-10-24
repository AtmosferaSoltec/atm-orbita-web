<script lang="ts">
	import { HeroCard, ProgressBar } from '#lib/components/ui/index.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatDate, formatMonthShort } from '#lib/domain/dates.ts';
	import type { Loan, LoanSummary } from '#lib/domain/loans.ts';

	interface Props {
		loan: Loan;
		summary: LoanSummary;
		/** Wording for the person who owes (public link) instead of the lender. */
		borrowerView?: boolean;
	}

	let { loan, summary, borrowerView = false }: Props = $props();

	const paidCount = $derived(summary.schedule.filter((i) => i.status === 'paid').length);
</script>

<HeroCard>
	<p class="text-sm font-semibold text-white/85">
		{borrowerView ? 'Te falta pagar' : 'Te falta cobrar'}
	</p>
	<p class="tabular mt-2 text-4xl font-extrabold tracking-tight sm:text-[42px]">
		{formatMoney(summary.balance, loan.currency)}
	</p>
	<p class="mt-1 text-sm text-white/85">
		{borrowerView ? 'Pagaste' : 'Te pagó'}
		{formatMoney(summary.paid, loan.currency)} de {formatMoney(loan.principal, loan.currency)}
	</p>
	<div class="mt-5">
		<ProgressBar value={summary.progressPercent} label="Avance del pago" onDark />
	</div>

	<dl class="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-white/14 p-3 text-center text-sm">
		<div>
			<dt class="text-xs text-white/75">Cuotas</dt>
			<dd class="tabular mt-0.5 font-extrabold">{paidCount} de {summary.schedule.length}</dd>
		</div>
		<div>
			<dt class="text-xs text-white/75">Cuota</dt>
			<dd class="tabular mt-0.5 font-extrabold">{formatMoney(loan.installment, loan.currency)}</dd>
		</div>
		<div>
			<dt class="text-xs text-white/75">
				{summary.status === 'completed' ? 'Terminó' : 'Termina'}
			</dt>
			<dd class="mt-0.5 font-extrabold">
				{summary.status === 'completed' && summary.lastPayment
					? formatDate(summary.lastPayment.date)
					: formatMonthShort(summary.endMonth)}
			</dd>
		</div>
	</dl>
</HeroCard>
