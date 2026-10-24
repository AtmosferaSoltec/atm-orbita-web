<script lang="ts">
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatMonth, MONTH_INITIALS, monthShortName, parts } from '#lib/domain/dates.ts';
	import type { MonthTotal } from '#lib/domain/receipts.ts';

	interface Props {
		/** 12 months, January first. */
		data: MonthTotal[];
		/** Months after this one have not happened yet. */
		currentMonth: string;
		label: string;
	}

	let { data, currentMonth, label }: Props = $props();

	// Two series, validated together (light surface, CVD-safe): blue = withheld, amber = not withheld.
	const SERIES = [
		{ key: 'grossWithheld', label: 'Con retención del 8 %', color: 'bg-chart-withheld' },
		{ key: 'grossNotWithheld', label: 'Sin retención', color: 'bg-chart-not-withheld' }
	] as const;

	let hovered = $state<number | null>(null);
	const max = $derived(Math.max(...data.map((d) => d.gross), 1));

	function height(value: number): string {
		return `${value ? Math.max((value / max) * 100, 2) : 0}%`;
	}
</script>

<figure class="relative">
	<ul class="mb-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="Leyenda">
		{#each SERIES as series (series.key)}
			<li class="flex items-center gap-2 text-[13px] font-semibold text-neutral">
				<span class="size-3 rounded-[3px] {series.color}" aria-hidden="true"></span>
				{series.label}
			</li>
		{/each}
	</ul>

	<div class="flex h-44 items-end gap-1.5 border-b border-outline sm:gap-2.5" aria-hidden="true">
		{#each data as item, i (item.month)}
			{@const top = item.grossNotWithheld ? 'grossNotWithheld' : 'grossWithheld'}
			<div
				role="presentation"
				class="relative flex h-full flex-1 items-end justify-center"
				onmouseenter={() => (hovered = i)}
				onmouseleave={() => (hovered = null)}
			>
				<!-- Stacked from the baseline; 2px surface gap between segments, rounded top only. -->
				<div
					class="flex h-full w-full max-w-7 flex-col-reverse gap-[2px] transition-opacity {hovered !==
						null && hovered !== i
						? 'opacity-50'
						: ''}"
				>
					{#each SERIES as series (series.key)}
						{#if item[series.key] > 0}
							<div
								class="w-full {series.color} {series.key === top ? 'rounded-t-[4px]' : ''}"
								style="height:{height(item[series.key])}"
							></div>
						{/if}
					{/each}
				</div>
				{#if hovered === i && item.count > 0}
					<div
						class="pointer-events-none absolute bottom-full z-10 mb-2 rounded-xl bg-ink px-3 py-2.5 text-xs whitespace-nowrap text-white shadow-pop {i >
						8
							? 'right-0'
							: i < 3
								? 'left-0'
								: ''}"
					>
						<p class="font-bold">{formatMonth(item.month)}</p>
						<p class="tabular mt-0.5 text-white/80">
							{formatMoney(item.gross)} · {item.count}
							{item.count === 1 ? 'recibo' : 'recibos'}
						</p>
						<dl class="tabular mt-2 flex flex-col gap-1 border-t border-white/15 pt-2">
							{#each SERIES as series (series.key)}
								<div class="flex items-center gap-2">
									<span class="size-2.5 rounded-[2px] {series.color}" aria-hidden="true"></span>
									<dt class="flex-1 text-white/80">{series.label}</dt>
									<dd class="pl-3 font-bold">{formatMoney(item[series.key])}</dd>
								</div>
							{/each}
						</dl>
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
		<thead>
			<tr>
				<th>Mes</th>
				<th>Monto bruto</th>
				{#each SERIES as series (series.key)}<th>{series.label}</th>{/each}
				<th>Recibos</th>
			</tr>
		</thead>
		<tbody>
			{#each data as item (item.month)}
				<tr>
					<td>{formatMonth(item.month)}</td>
					<td>{formatMoney(item.gross)}</td>
					{#each SERIES as series (series.key)}<td>{formatMoney(item[series.key])}</td>{/each}
					<td>{item.count}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</figure>
