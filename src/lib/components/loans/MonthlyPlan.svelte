<script lang="ts">
	import { ChevronLeft, ChevronRight, CalendarRange } from '@lucide/svelte';
	import { Button, Card, IconButton, EmptyState, MonthField } from '#lib/components/ui/index.ts';
	import {
		monthlyLoanSummary,
		unassignedPayments,
		unplannedAmount,
		type Debtor,
		type LoanMovement
	} from '#lib/domain/loans.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import {
		addMonths,
		formatMonth,
		formatMonthShort,
		todayIso,
		toMonthKey
	} from '#lib/domain/dates.ts';
	let { debtor, onplan }: { debtor: Debtor; onplan?: (movement: LoanMovement) => void } = $props();
	const currentMonth = toMonthKey(todayIso());
	let selectedMonth = $state(currentMonth);
	let start = $state(addMonths(currentMonth, -2));
	$effect(() => {
		const from = addMonths(selectedMonth, -2);
		start = from < '2000-01' ? '2000-01' : from > '2100-07' ? '2100-07' : from;
	});
	function move(step: number) {
		const from = addMonths(start, step);
		start = from < '2000-01' ? '2000-01' : from > '2100-07' ? '2100-07' : from;
	}
	const months = $derived(Array.from({ length: 6 }, (_, i) => addMonths(start, i)));
	const entries = $derived(
		debtor.movements
			.filter((m) => m.kind === 'loan')
			.toSorted((a, b) => a.date.localeCompare(b.date))
	);
	const summary = $derived(monthlyLoanSummary(debtor));
	const current = $derived(summary.find((s) => s.month === selectedMonth));
	const unplanned = $derived(unplannedAmount(debtor));
	const unassigned = $derived(unassignedPayments(debtor));
	const money = (value: number) => formatMoney(value, debtor.currency);
</script>

<section class="mt-6 min-w-0" aria-label="Plan mensual">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="text-lg font-extrabold">Plan mensual</h2>
			<p class="mt-1 text-sm text-muted">
				Lo acordado por compra o préstamo, sin días de vencimiento.
			</p>
		</div>
		<div class="w-full sm:w-72">
			<MonthField
				label="Mes a consultar"
				bind:value={selectedMonth}
				fromYear={2000}
				toYear={2100}
			/>
		</div>
	</div>
	<div class="mb-4 hidden gap-4 sm:grid sm:grid-cols-3">
		{#each [{ label: 'Previsto del mes', amount: current?.expected ?? 0 }, { label: 'Pagado para el mes', amount: current?.paid ?? 0 }, { label: 'Faltante del mes', amount: current?.remaining ?? 0 }] as stat (stat.label)}<div
				class="flex items-center justify-between gap-3 rounded-2xl border border-outline bg-surface p-3 sm:block sm:p-4"
			>
				<p class="text-[11px] font-semibold text-muted sm:text-xs">{stat.label}</p>
				<p class="tabular text-sm font-extrabold sm:mt-2 sm:text-xl">{money(stat.amount)}</p>
			</div>{/each}
	</div>
	<Card padding="none" class="min-w-0 overflow-hidden">
		<div
			class="hidden flex-wrap items-center justify-between gap-3 border-b border-divider p-4 sm:flex"
		>
			<p class="text-sm font-bold capitalize">
				{formatMonthShort(start)} — {formatMonthShort(months[5])}
			</p>
			<div class="flex items-center gap-1">
				<IconButton
					icon={ChevronLeft}
					label="Seis meses anteriores"
					variant="ghost"
					disabled={start <= '2000-01'}
					onclick={() => move(-6)}
				/><Button
					variant="ghost"
					size="sm"
					onclick={() => {
						selectedMonth = currentMonth;
						start = addMonths(currentMonth, -2);
					}}>Este mes</Button
				><IconButton
					icon={ChevronRight}
					label="Seis meses siguientes"
					variant="ghost"
					disabled={months[5] >= '2100-12'}
					onclick={() => move(6)}
				/>
			</div>
		</div>
		{#if entries.length}
			<div class="sm:hidden" role="region" aria-label="Detalle mensual">
				<h3 class="border-b border-divider bg-canvas px-4 py-3 text-sm font-extrabold">
					{formatMonth(selectedMonth)}
				</h3>
				<ul class="divide-y divide-divider">
					{#each entries as entry, i (entry.id)}
						{@const amount = entry.plan?.find((p) => p.month === selectedMonth)?.amount ?? 0}
						<li class="px-4 py-4">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="text-sm font-bold break-words">
										{entry.title || entry.note || `Préstamo ${i + 1}`}
									</p>
									<p class="mt-1 text-xs text-muted">Total: {money(entry.amount)}</p>
								</div>
								<p class="tabular shrink-0 text-sm font-extrabold">
									{amount ? money(amount) : '—'}
								</p>
							</div>
							{#if onplan}<button
									type="button"
									class="mt-2 py-1 text-xs font-bold text-primary"
									aria-label={`Repartir ${entry.title || entry.note || `préstamo ${i + 1}`} por meses`}
									onclick={() => onplan?.(entry)}
									>{entry.plan?.length ? 'Editar reparto' : 'Repartir por meses'}</button
								>{/if}
						</li>
					{/each}
				</ul>
				<dl class="space-y-3 border-t border-divider bg-primary-soft p-4 text-sm">
					<div class="flex justify-between gap-3">
						<dt>Previsto</dt>
						<dd class="tabular font-extrabold">{money(current?.expected ?? 0)}</dd>
					</div>
					<div class="flex justify-between gap-3 text-income-strong">
						<dt>Pagado</dt>
						<dd class="tabular font-extrabold">{money(current?.paid ?? 0)}</dd>
					</div>
					<div class="flex justify-between gap-3 text-primary">
						<dt>Faltante</dt>
						<dd class="tabular font-extrabold" data-mobile-total="remaining">
							{money(current?.remaining ?? 0)}
						</dd>
					</div>
					{#if current?.surplus}<div class="flex justify-between gap-3">
							<dt>Excedente</dt>
							<dd class="tabular font-extrabold">{money(current.surplus)}</dd>
						</div>{/if}
				</dl>
			</div>

			<!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access to the horizontally scrollable table) -->
			<div
				class="hidden overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-primary sm:block"
				role="region"
				aria-label="Tabla de pagos por mes"
				tabindex="0"
			>
				<table class="w-full border-collapse text-sm">
					<caption class="sr-only"
						>Préstamos, importes previstos y abonos por mes de {debtor.name}</caption
					>
					<thead
						><tr class="bg-canvas text-xs text-muted"
							><th scope="col" class="sticky left-0 z-10 min-w-44 bg-canvas px-4 py-4 text-left"
								>Compra / préstamo</th
							><th scope="col" class="min-w-32 px-4 py-4 text-right">Total</th
							>{#each months as month (month)}<th
									scope="col"
									class="min-w-32 px-4 py-4 text-right capitalize {month === selectedMonth
										? 'bg-primary-soft text-primary'
										: ''}">{formatMonthShort(month)}</th
								>{/each}</tr
						></thead
					>
					<tbody>
						{#each entries as entry, i (entry.id)}
							{@const rest =
								entry.amount - (entry.plan ?? []).reduce((sum, p) => sum + p.amount, 0)}
							<tr class="border-t border-divider"
								><th
									scope="row"
									class="sticky left-0 z-10 max-w-56 bg-surface px-4 py-3 text-left align-top"
									><span class="block text-sm font-bold break-words"
										>{entry.title || entry.note || `Préstamo ${i + 1}`}</span
									>{#if rest > 0}<span class="mt-1 block text-[11px] font-medium text-muted"
											>Sin repartir: {money(rest)}</span
										>{/if}{#if onplan}<button
											type="button"
											class="mt-2 rounded-lg py-1 text-xs font-bold text-primary hover:underline"
											aria-label={`Repartir ${entry.title || entry.note || `préstamo ${i + 1}`} por meses`}
											onclick={() => onplan?.(entry)}
											>{entry.plan?.length ? 'Editar reparto' : 'Repartir por meses'}</button
										>{/if}</th
								><td class="tabular px-4 py-3 text-right align-top font-bold"
									>{money(entry.amount)}</td
								>{#each months as month (month)}{@const amount = entry.plan?.find(
										(p) => p.month === month
									)?.amount}<td
										class="tabular px-4 py-3 text-right align-top {month === selectedMonth
											? 'bg-primary-soft/30'
											: ''}">{amount ? money(amount) : '—'}</td
									>{/each}</tr
							>
						{/each}
					</tbody>
					<tfoot>
						{#each ['expected', 'paid', 'remaining', 'surplus'] as key (key)}
							{#if key !== 'surplus' || summary.some((s) => s.surplus > 0)}
								<tr
									class="border-t border-divider font-bold {key === 'paid'
										? 'bg-income-soft text-income-strong'
										: key === 'remaining'
											? 'bg-primary-soft text-primary'
											: 'bg-canvas'}"
									><th
										scope="row"
										class="sticky left-0 z-10 px-4 py-3 text-left {key === 'paid'
											? 'bg-income-soft'
											: key === 'remaining'
												? 'bg-primary-soft'
												: 'bg-canvas'}"
										>{key === 'expected'
											? 'Previsto'
											: key === 'paid'
												? 'Pagado'
												: key === 'remaining'
													? 'Faltante'
													: 'Excedente'}</th
									><td class="px-4 py-3 text-right">—</td
									>{#each months as month (month)}{@const item = summary.find(
											(s) => s.month === month
										)}<td class="tabular px-4 py-3 text-right" data-month={month} data-total={key}
											>{money(
												item?.[key as 'expected' | 'paid' | 'remaining' | 'surplus'] ?? 0
											)}</td
										>{/each}</tr
								>
							{/if}
						{/each}
					</tfoot>
				</table>
			</div>
		{:else}<EmptyState
				icon={CalendarRange}
				title="Todavía no hay préstamos para repartir"
				text="Añade un préstamo y define cuánto corresponde pagar en cada mes."
			/>{/if}
	</Card>
	<div class="mt-3 space-y-2 text-xs leading-relaxed text-muted">
		<p>
			Los abonos se descuentan del mes que eliges. Un excedente queda en ese mes y no se aplica a
			otros automáticamente.
		</p>
		{#if unplanned > 0}<p>
				<strong>{money(unplanned)}</strong> del total prestado aún no tiene un mes asignado.
			</p>{/if}{#if unassigned > 0}<p class="rounded-xl bg-orange-soft p-3 text-orange-strong">
				Hay {money(unassigned)} en abonos anteriores sin mes asignado. Ya reducen el saldo total; edítalos
				en Movimientos para ubicarlos en esta tabla.
			</p>{/if}{#if debtor.reference}<p>
				Referencia anterior: {debtor.reference.date
					? formatMonth(debtor.reference.date.slice(0, 7))
					: 'sin mes'}{debtor.reference.amount !== null
					? ` · ${money(debtor.reference.amount)}`
					: ''}. Puedes usarla como guía al repartir los préstamos.
			</p>{/if}
	</div>
</section>
