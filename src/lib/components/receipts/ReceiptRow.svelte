<script lang="ts">
	import { resolve } from '$app/paths';
	import { ChevronRight, FileCode, PencilLine } from '@lucide/svelte';
	import { Badge, IconBadge } from '#lib/components/ui/index.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatDate } from '#lib/domain/dates.ts';
	import { receiptCode, type Receipt } from '#lib/domain/receipts.ts';

	let { receipt }: { receipt: Receipt } = $props();
</script>

<a
	href={resolve('/(app)/receipts/[id]', { id: receipt.id })}
	class="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-canvas sm:px-5"
>
	<IconBadge icon={receipt.source === 'xml' ? FileCode : PencilLine} tone="primary" size="sm" />
	<div class="min-w-0 flex-1">
		<p class="truncate text-[15px] font-bold">{receipt.client.name}</p>
		<p class="truncate text-[13px] text-muted">
			{receiptCode(receipt)} · {formatDate(receipt.issueDate)}
		</p>
	</div>
	<div class="hidden sm:block">
		{#if receipt.collectedOn}
			<Badge tone="income">Cobrado</Badge>
		{:else}
			<Badge tone="orange">Por cobrar</Badge>
		{/if}
	</div>
	<div class="text-right">
		<p class="tabular font-extrabold">{formatMoney(receipt.gross)}</p>
		<p class="tabular text-xs text-muted">
			{receipt.withholding
				? `neto ${formatMoney(receipt.gross - receipt.withholding)}`
				: 'sin retención'}
		</p>
	</div>
	<ChevronRight size={18} class="shrink-0 text-muted-light" aria-hidden="true" />
</a>
