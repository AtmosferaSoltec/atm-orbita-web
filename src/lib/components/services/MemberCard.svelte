<script lang="ts">
	import { CircleCheck } from '@lucide/svelte';
	import { Avatar, Badge, Button, Card } from '#lib/components/ui/index.ts';
	import { MONTH_STATUS } from './labels';
	import { formatMoney, type Currency } from '#lib/domain/money.ts';
	import {
		formatDate,
		formatMonth,
		formatMonthShort,
		monthShortName,
		parts
	} from '#lib/domain/dates.ts';
	import { HISTORY_MONTHS, type MemberMonth, type MemberStatus } from '#lib/domain/services.ts';

	interface Props {
		status: MemberStatus;
		currency: Currency;
		onpay: () => void;
		ontoggle: (month: MemberMonth) => void;
	}

	let { status, currency, onpay, ontoggle }: Props = $props();

	const months = $derived(status.months.slice(-HISTORY_MONTHS));
	const owedList = $derived(
		status.owedMonths.map((m) => monthShortName(parts(m).month)).join(', ')
	);
</script>

<Card padding="lg">
	<div class="flex flex-wrap items-start gap-3.5">
		<Avatar name={status.member.name} />
		<div class="min-w-0 flex-1">
			<p class="text-[15px] font-extrabold">{status.member.name}</p>
			<p class="text-[13px] text-muted">
				Paga {formatMoney(status.member.amount, currency)} al mes · desde {formatMonthShort(
					status.member.since
				)}
			</p>
		</div>
		{#if status.owedAmount > 0}
			<Badge tone="expense">Debe {formatMoney(status.owedAmount, currency)}</Badge>
		{:else}
			<Badge tone="income" icon={CircleCheck}>Al día</Badge>
		{/if}
	</div>

	{#if status.owedMonths.length}
		<p class="mt-4 text-sm font-semibold text-expense-strong">
			No paga desde {formatMonth(status.owedMonths[0]).toLowerCase()}: le falta {owedList}.
		</p>
	{/if}

	<div class="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
		{#each months as month (month.month)}
			{@const style = MONTH_STATUS[month.status]}
			<button
				type="button"
				class="flex flex-col items-center rounded-xl border px-1 py-2 text-xs font-bold transition hover:brightness-95 disabled:cursor-default disabled:hover:brightness-100 {style.class}"
				disabled={month.status === 'upcoming'}
				onclick={() => ontoggle(month)}
				title="{formatMonth(month.month)}: {style.label}{month.payment
					? ` el ${formatDate(month.payment.paidOn)}`
					: ''}"
				aria-label="{formatMonth(month.month)}: {style.label}"
			>
				<span class="capitalize">{monthShortName(parts(month.month).month)}</span>
				<span class="text-[10px] font-semibold opacity-75">{parts(month.month).year}</span>
			</button>
		{/each}
	</div>

	<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
		<p class="text-[13px] text-muted">
			{#if status.lastPayment}
				Último pago: {formatMonth(status.lastPayment.month).toLowerCase()}, el {formatDate(
					status.lastPayment.paidOn
				)}
			{:else}
				Aún no registra pagos.
			{/if}
		</p>
		{#if status.owedMonths.length}
			<Button size="sm" icon={CircleCheck} onclick={onpay}>Registrar pago</Button>
		{/if}
	</div>
</Card>
