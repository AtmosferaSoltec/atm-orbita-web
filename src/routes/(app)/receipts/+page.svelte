<script lang="ts">
	import { resolve } from '$app/paths';
	import { Plus, ReceiptText, Search, Wallet, Clock, Building2 } from '@lucide/svelte';
	import {
		Avatar,
		Button,
		Card,
		EmptyState,
		MonthlyBars,
		ProgressBar,
		PageHeader,
		SegmentedControl,
		SelectField,
		StatCard,
		TextField
	} from '#lib/components/ui/index.ts';
	import LimitCard from '#lib/components/receipts/LimitCard.svelte';
	import LimitModal from '#lib/components/receipts/LimitModal.svelte';
	import ReceiptRow from '#lib/components/receipts/ReceiptRow.svelte';
	import { formatMoney, percentOf } from '#lib/domain/money.ts';
	import { parts, todayIso, toMonthKey } from '#lib/domain/dates.ts';
	import { availableYears, receiptsOfYear, summarizeYear } from '#lib/domain/receipts.ts';
	import { receipts } from '#lib/stores/receipts.svelte.ts';

	type View = 'receipts' | 'clients';
	type Filter = 'all' | 'pending' | 'collected';

	const today = todayIso();
	const currentYear = parts(today).year;

	let year = $state(String(currentYear));
	let view = $state<View>('receipts');
	let filter = $state<Filter>('all');
	let query = $state('');
	let editLimit = $state(false);

	const yearNumber = $derived(Number(year));
	const summary = $derived(
		summarizeYear(receipts.items, yearNumber, receipts.limitFor(yearNumber))
	);
	const years = $derived(availableYears(receipts.items, currentYear));
	const list = $derived(
		receiptsOfYear(receipts.items, yearNumber).filter((r) => {
			if (filter === 'pending' && r.collectedOn) return false;
			if (filter === 'collected' && !r.collectedOn) return false;
			const q = query.trim().toLowerCase();
			return (
				!q ||
				r.client.name.toLowerCase().includes(q) ||
				`${r.series}-${r.number}`.toLowerCase().includes(q) ||
				r.description.toLowerCase().includes(q)
			);
		})
	);
	const monthsWithReceipts = $derived(summary.byMonth.filter((m) => m.count > 0).length);
</script>

<svelte:head><title>Recibos por honorarios · Orbita</title></svelte:head>

<PageHeader title="Recibos por honorarios" subtitle="Controla lo emitido frente a tu tope anual.">
	{#snippet actions()}
		<div class="w-32">
			<SelectField
				label="Año"
				bind:value={year}
				options={years.map((y) => ({ value: String(y), label: String(y) }))}
			/>
		</div>
		<Button href={resolve('/(app)/receipts/new')} icon={Plus} class="mt-auto h-[52px]"
			>Nuevo recibo</Button
		>
	{/snippet}
</PageHeader>

<div class="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
	<LimitCard {summary} onedit={() => (editLimit = true)} />
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
		<StatCard
			icon={Wallet}
			tone="income"
			label="Neto recibido o por recibir"
			value={formatMoney(summary.net)}
			hint="Retenciones del año: {formatMoney(summary.withholding)}"
		/>
		<StatCard
			icon={Clock}
			tone="orange"
			label="Por cobrar"
			value={formatMoney(summary.pendingToCollect)}
			hint="Recibos emitidos que el cliente aún no te paga."
		/>
	</div>
</div>

<Card padding="lg" class="mt-5">
	<div class="flex flex-wrap items-baseline justify-between gap-2">
		<h2 class="text-base font-extrabold">Emitido por mes · {year}</h2>
		<p class="text-[13px] text-muted">
			{summary.count}
			{summary.count === 1 ? 'recibo' : 'recibos'} en {monthsWithReceipts}
			{monthsWithReceipts === 1 ? 'mes' : 'meses'}
		</p>
	</div>
	<div class="mt-6">
		<MonthlyBars
			data={summary.byMonth}
			currentMonth={toMonthKey(today)}
			label="Monto bruto emitido por mes en {year}"
		/>
	</div>
</Card>

<div class="mt-8 flex flex-wrap items-center justify-between gap-3">
	<SegmentedControl
		label="Vista"
		bind:value={view}
		options={[
			{ value: 'receipts', label: 'Recibos' },
			{ value: 'clients', label: 'Por cliente' }
		]}
	/>
	{#if view === 'receipts'}
		<SegmentedControl
			label="Filtrar por cobro"
			size="sm"
			bind:value={filter}
			options={[
				{ value: 'all', label: 'Todos' },
				{ value: 'pending', label: 'Por cobrar' },
				{ value: 'collected', label: 'Cobrados' }
			]}
		/>
	{/if}
</div>

{#if view === 'receipts'}
	<div class="mt-4">
		<TextField
			label="Buscar"
			bind:value={query}
			icon={Search}
			placeholder="Cliente, serie o descripción"
			type="search"
		/>
	</div>
	<Card padding="none" class="mt-4 overflow-hidden">
		{#if list.length}
			<ul class="divide-y divide-divider">
				{#each list as receipt (receipt.id)}
					<li><ReceiptRow {receipt} /></li>
				{/each}
			</ul>
		{:else if summary.count === 0}
			<EmptyState
				icon={ReceiptText}
				title="Aún no tienes recibos en {year}"
				text="Sube el XML de tu primer recibo y llenamos los datos por ti."
			>
				{#snippet action()}
					<Button href={resolve('/(app)/receipts/new')} icon={Plus}>Registrar recibo</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<EmptyState
				icon={Search}
				tone="neutral"
				title="Sin resultados"
				text="Prueba con otra búsqueda o filtro."
			/>
		{/if}
	</Card>
{:else}
	<Card padding="none" class="mt-4 overflow-hidden">
		{#if summary.byClient.length}
			<ul class="divide-y divide-divider">
				{#each summary.byClient as client (client.key)}
					{@const share = percentOf(client.gross, summary.gross)}
					<li class="flex items-center gap-3.5 px-4 py-4 sm:px-5">
						<Avatar name={client.name} />
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-3">
								<p class="truncate text-[15px] font-bold">{client.name}</p>
								<p class="tabular shrink-0 font-extrabold">{formatMoney(client.gross)}</p>
							</div>
							<div class="mt-2 flex items-center gap-3">
								<div class="flex-1">
									<ProgressBar value={share} size="sm" label="Parte del total" />
								</div>
								<p class="tabular w-28 shrink-0 text-right text-xs text-muted">
									{share}% · {client.count}
									{client.count === 1 ? 'recibo' : 'recibos'}
								</p>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<EmptyState
				icon={Building2}
				title="Sin clientes en {year}"
				text="Aparecerán cuando registres recibos."
			/>
		{/if}
	</Card>
{/if}

<LimitModal bind:open={editLimit} year={yearNumber} />
