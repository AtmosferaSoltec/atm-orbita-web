<script lang="ts">
	import { CalendarRange, CheckCircle2, Clock, Pencil, Plus, Trash2 } from '@lucide/svelte';
	import {
		Badge,
		Button,
		Card,
		EmptyState,
		IconButton,
		ProgressBar
	} from '#lib/components/ui/index.ts';
	import {
		monthlyLoanSummary,
		totalPlanned,
		unassignedPayments,
		type Debtor
	} from '#lib/domain/loans.ts';
	import { formatMoney, percentOf } from '#lib/domain/money.ts';
	import { formatMonth, todayIso, toMonthKey } from '#lib/domain/dates.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	let {
		debtor,
		oneditplan,
		readonly = false
	}: {
		debtor: Debtor;
		oneditplan?: (initialMonth?: string) => void;
		readonly?: boolean;
	} = $props();

	const currentMonth = toMonthKey(todayIso());
	const summary = $derived(monthlyLoanSummary(debtor));
	const plannedTotal = $derived(totalPlanned(debtor));
	const unassigned = $derived(unassignedPayments(debtor));
	const money = (value: number) => formatMoney(value, debtor.currency);

	async function removeMonth(monthToRemove: string) {
		const newPlans = (debtor.plans ?? []).filter((p) => p.month !== monthToRemove);
		const error = await loans.setPlan(debtor.id, newPlans);
		if (error) toasts.error(error);
		else toasts.success('Cuota del mes eliminada.');
	}
</script>

<section class="mt-6 min-w-0" aria-label="Plan mensual de pagos">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="text-lg font-extrabold">Plan mensual</h2>
			<p class="mt-0.5 text-xs text-muted">
				Cuotas acordadas por mes y seguimiento de cumplimiento de abonos.
			</p>
		</div>
		{#if !readonly}
			<div class="flex items-center gap-2">
				<Button variant="secondary" size="sm" icon={Plus} onclick={() => oneditplan?.()}>
					{debtor.plans?.length ? 'Gestionar cuotas' : 'Definir cuotas por mes'}
				</Button>
			</div>
		{/if}
	</div>

	{#if summary.length}
		<!-- Resumen superior del plan si hay cuotas definidas -->
		{#if plannedTotal > 0}
			{@const totalPaid = summary.reduce((sum, s) => sum + s.paid, 0)}
			<div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
				<div class="rounded-2xl border border-outline bg-surface p-3 sm:p-4">
					<p class="text-[11px] font-semibold text-muted">Total en cuotas</p>
					<p class="tabular mt-1 text-sm font-extrabold sm:text-lg">{money(plannedTotal)}</p>
				</div>
				<div class="rounded-2xl border border-outline bg-surface p-3 sm:p-4">
					<p class="text-[11px] font-semibold text-muted">Abonado acumulado</p>
					<p class="tabular mt-1 text-sm font-extrabold text-income-strong sm:text-lg">
						{money(totalPaid)}
					</p>
				</div>
				<div
					class="col-span-2 rounded-2xl border border-outline bg-surface p-3 sm:col-span-1 sm:p-4"
				>
					<p class="text-[11px] font-semibold text-muted">Progreso del plan</p>
					<p class="tabular mt-1 text-sm font-extrabold text-primary sm:text-lg">
						{percentOf(totalPaid, plannedTotal)}% cubierto
					</p>
				</div>
			</div>
		{/if}

		<!-- Tarjetas por mes -->
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each summary as item (item.month)}
				{@const isCurrent = item.month === currentMonth}
				{@const progress =
					item.expected > 0 ? Math.min(100, Math.round((item.paid / item.expected) * 100)) : 100}
				<Card
					padding="none"
					class="flex flex-col justify-between overflow-hidden border border-outline transition-shadow hover:shadow-sm"
				>
					<div class="border-b border-divider bg-canvas/40 px-4 py-3">
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<h3 class="text-sm font-extrabold capitalize">
									{formatMonth(item.month)}
								</h3>
								{#if isCurrent}
									<span
										class="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary"
									>
										Este mes
									</span>
								{/if}
							</div>

							{#if item.status === 'completed'}
								<Badge tone="income" icon={CheckCircle2}>
									{item.surplus > 0 ? `+${money(item.surplus)}` : 'Cumplido'}
								</Badge>
							{:else if item.status === 'partial'}
								<Badge tone="orange" icon={Clock}>
									Falta {money(item.remaining)}
								</Badge>
							{:else if item.status === 'pending'}
								<Badge tone="neutral">Pendiente</Badge>
							{:else}
								<Badge tone="primary">Abono extra</Badge>
							{/if}
						</div>
					</div>

					<div class="space-y-3 p-4">
						<div class="grid grid-cols-2 gap-2 text-xs">
							<div>
								<span class="block text-muted">Acordado</span>
								<span class="tabular text-foreground font-extrabold">
									{item.expected > 0 ? money(item.expected) : '—'}
								</span>
							</div>
							<div class="text-right">
								<span class="block text-muted">Abonado</span>
								<span class="tabular font-extrabold text-income-strong">
									{item.paid > 0 ? money(item.paid) : 'S/ 0.00'}
								</span>
							</div>
						</div>

						{#if item.expected > 0}
							<div>
								<div class="mb-1 flex justify-between text-[11px] text-muted">
									<span>Cumplimiento</span>
									<span class="tabular font-bold">{progress}%</span>
								</div>
								<ProgressBar
									value={progress}
									tone={item.status === 'completed' ? 'income' : 'primary'}
									label="Cumplimiento de {formatMonth(item.month)}"
								/>
							</div>
						{/if}
					</div>

					{#if !readonly}
						<div
							class="flex items-center justify-between border-t border-divider bg-canvas/20 px-3 py-2 text-xs"
						>
							<button
								type="button"
								class="inline-flex items-center gap-1 font-bold text-primary hover:underline"
								onclick={() => oneditplan?.(item.month)}
							>
								<Pencil size={12} aria-hidden="true" />
								<span>{item.expected > 0 ? 'Editar cuota' : 'Fijar cuota'}</span>
							</button>

							{#if item.expected > 0}
								<IconButton
									icon={Trash2}
									variant="ghost"
									size="sm"
									label={`Eliminar cuota de ${formatMonth(item.month)}`}
									onclick={() => removeMonth(item.month)}
								/>
							{/if}
						</div>
					{/if}
				</Card>
			{/each}
		</div>
	{:else}
		<Card padding="none">
			<EmptyState
				icon={CalendarRange}
				title="Aún no hay cuotas por mes"
				text="Define cuánto acordaron pagar cada mes (por ejemplo, en octubre, noviembre...). Los abonos se registrarán directamente a ese mes sin complicaciones."
			>
				{#snippet action()}
					{#if !readonly}
						<Button icon={Plus} onclick={() => oneditplan?.()}>Definir cuotas por mes</Button>
					{/if}
				{/snippet}
			</EmptyState>
		</Card>
	{/if}

	{#if unassigned > 0}
		<div class="mt-3 rounded-xl bg-orange-soft p-3 text-xs text-orange-strong">
			Hay {money(unassigned)} en abonos antiguos sin mes especificado. Puedes editarlos para asignarlos
			al mes correspondiente.
		</div>
	{/if}
</section>
