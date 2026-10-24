<script lang="ts">
	import { resolve } from '$app/paths';
	import { Avatar, Badge, Card, ProgressBar } from '#lib/components/ui/index.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatDate, formatMonth } from '#lib/domain/dates.ts';
	import type { Loan, LoanSummary } from '#lib/domain/loans.ts';
	import { LOAN_STATUS } from './labels';

	interface Props {
		loan: Loan;
		summary: LoanSummary;
	}

	let { loan, summary }: Props = $props();
	const status = $derived(LOAN_STATUS[summary.status]);
</script>

<Card href={resolve('/(app)/loans/[id]', { id: loan.id })} class="h-full">
	<div class="flex items-start gap-3.5">
		<Avatar name={loan.borrower.name} />
		<div class="min-w-0 flex-1">
			<p class="truncate text-[15px] font-extrabold">{loan.borrower.name}</p>
			<p class="text-[13px] text-muted">Prestado el {formatDate(loan.lentOn)}</p>
		</div>
		<Badge tone={status.tone}>{status.label}</Badge>
	</div>

	<div class="mt-5 flex items-end justify-between gap-3">
		<div>
			<p class="text-[13px] font-bold text-muted">Te falta cobrar</p>
			<p class="tabular text-2xl font-extrabold">{formatMoney(summary.balance, loan.currency)}</p>
		</div>
		<p class="tabular pb-1 text-right text-[13px] text-muted">
			de {formatMoney(loan.principal, loan.currency)}
		</p>
	</div>
	<div class="mt-3">
		<ProgressBar
			value={summary.progressPercent}
			tone={summary.status === 'overdue' ? 'expense' : 'income'}
			label="Avance del pago"
		/>
	</div>

	<p
		class="mt-4 text-[13px] font-semibold {summary.status === 'overdue'
			? 'text-expense-strong'
			: 'text-muted'}"
	>
		{#if summary.status === 'completed'}
			Terminó de pagar · último pago {summary.lastPayment
				? formatDate(summary.lastPayment.date)
				: ''}
		{:else if summary.status === 'overdue'}
			{summary.overdueCount}
			{summary.overdueCount === 1 ? 'cuota atrasada' : 'cuotas atrasadas'} · {formatMoney(
				summary.overdueAmount,
				loan.currency
			)}
		{:else if summary.status === 'not-started'}
			Empieza a pagar en {formatMonth(loan.firstDueMonth).toLowerCase()}
		{:else if summary.nextInstallment}
			Próxima cuota: {formatMoney(
				summary.nextInstallment.amount - summary.nextInstallment.covered,
				loan.currency
			)} el {formatDate(summary.nextInstallment.dueDate)}
		{/if}
	</p>
</Card>
