<script lang="ts">
	import { ArrowDownLeft, Trash2 } from '@lucide/svelte';
	import { IconBadge, IconButton } from '#lib/components/ui/index.ts';
	import { formatMoney, type Currency } from '#lib/domain/money.ts';
	import { formatDate } from '#lib/domain/dates.ts';
	import type { LoanPayment } from '#lib/domain/loans.ts';

	interface Props {
		payments: LoanPayment[];
		currency: Currency;
		ondelete?: (payment: LoanPayment) => void;
	}

	let { payments, currency, ondelete }: Props = $props();
</script>

<ul class="divide-y divide-divider">
	{#each payments as payment (payment.id)}
		<li class="flex items-center gap-3.5 px-4 py-3.5 sm:px-5">
			<IconBadge icon={ArrowDownLeft} tone="income" size="sm" />
			<div class="min-w-0 flex-1">
				<p class="text-[15px] font-bold">Pago</p>
				<p class="truncate text-[13px] text-muted">
					{formatDate(payment.date)}{payment.note ? ` · ${payment.note}` : ''}
				</p>
			</div>
			<p class="tabular font-extrabold text-income-strong">
				{formatMoney(payment.amount, currency, { signed: true })}
			</p>
			{#if ondelete}
				<IconButton
					icon={Trash2}
					label="Eliminar pago"
					variant="danger"
					onclick={() => ondelete(payment)}
				/>
			{/if}
		</li>
	{/each}
</ul>
