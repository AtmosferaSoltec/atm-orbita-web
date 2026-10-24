<script lang="ts">
	import { Badge } from '#lib/components/ui/index.ts';
	import { formatMoney, type Currency } from '#lib/domain/money.ts';
	import { formatDate, formatMonth } from '#lib/domain/dates.ts';
	import type { Installment } from '#lib/domain/loans.ts';
	import { INSTALLMENT_STATUS } from './labels';

	interface Props {
		schedule: Installment[];
		currency: Currency;
	}

	let { schedule, currency }: Props = $props();
</script>

<ol class="divide-y divide-divider">
	{#each schedule as item (item.index)}
		{@const status = INSTALLMENT_STATUS[item.status]}
		<li class="flex items-center gap-3.5 px-4 py-3.5 sm:px-5">
			<span
				class="tabular inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold {item.status ===
				'paid'
					? 'bg-income-soft text-income-strong'
					: item.status === 'overdue'
						? 'bg-expense-soft text-expense-strong'
						: 'bg-neutral-soft text-neutral'}"
			>
				{item.index}
			</span>
			<div class="min-w-0 flex-1">
				<p class="text-[15px] font-bold">{formatMonth(item.month)}</p>
				<p class="text-[13px] text-muted">Vence el {formatDate(item.dueDate)}</p>
			</div>
			<div class="hidden sm:block"><Badge tone={status.tone}>{status.label}</Badge></div>
			<div class="text-right">
				<p class="tabular font-extrabold">{formatMoney(item.amount, currency)}</p>
				{#if item.covered > 0 && item.covered < item.amount}
					<p class="tabular text-xs text-muted">pagó {formatMoney(item.covered, currency)}</p>
				{:else}
					<p
						class="text-xs sm:hidden {item.status === 'overdue'
							? 'text-expense-strong'
							: 'text-muted'}"
					>
						{status.label}
					</p>
				{/if}
			</div>
		</li>
	{/each}
</ol>
