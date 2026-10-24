<script lang="ts">
	import { formatMoney, type Cents } from '#lib/domain/money.ts';
	import { formatMonth, MONTH_INITIALS, monthShortName, parts } from '#lib/domain/dates.ts';

	interface Props {
		/** 12 months, January first. */
		data: { month: string; gross: Cents; count: number }[];
		/** Months after this one are drawn as not yet happened. */
		currentMonth: string;
		label: string;
	}

	let { data, currentMonth, label }: Props = $props();

	let hovered = $state<number | null>(null);
	const max = $derived(Math.max(...data.map((d) => d.gross), 1));
</script>

<!-- Single series: one color, no legend; the title names it. A table carries the same data. -->
<figure class="relative">
	<div class="flex h-44 items-end gap-1.5 border-b border-outline sm:gap-2.5" aria-hidden="true">
		{#each data as item, i (item.month)}
			{@const future = item.month > currentMonth}
			<div
				role="presentation"
				class="group relative flex h-full flex-1 items-end justify-center"
				onmouseenter={() => (hovered = i)}
				onmouseleave={() => (hovered = null)}
			>
				<div
					class="w-full max-w-7 rounded-t-[4px] transition-colors {future
						? 'bg-neutral-soft'
						: hovered === i
							? 'bg-primary-dark'
							: 'bg-primary'}"
					style="height:{item.gross ? Math.max((item.gross / max) * 100, 3) : 0}%"
				></div>
				{#if hovered === i}
					<div
						class="pointer-events-none absolute bottom-full z-10 mb-2 rounded-xl bg-ink px-3 py-2 text-xs whitespace-nowrap text-white shadow-pop"
					>
						<p class="font-bold">{formatMonth(item.month)}</p>
						<p class="tabular text-white/80">
							{formatMoney(item.gross)} · {item.count}
							{item.count === 1 ? 'recibo' : 'recibos'}
						</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
	<div class="mt-2 flex gap-1.5 sm:gap-2.5" aria-hidden="true">
		{#each data as item, i (item.month)}
			<span
				class="flex-1 text-center text-[11px] font-bold {item.month === currentMonth
					? 'text-ink'
					: 'text-muted-light'}"
			>
				<span class="sm:hidden">{MONTH_INITIALS[i]}</span>
				<span class="hidden sm:inline">{monthShortName(parts(item.month).month)}</span>
			</span>
		{/each}
	</div>
	<table class="sr-only">
		<caption>{label}</caption>
		<thead><tr><th>Mes</th><th>Monto bruto</th><th>Recibos</th></tr></thead>
		<tbody>
			{#each data as item (item.month)}
				<tr
					><td>{formatMonth(item.month)}</td><td>{formatMoney(item.gross)}</td><td>{item.count}</td
					></tr
				>
			{/each}
		</tbody>
	</table>
</figure>
