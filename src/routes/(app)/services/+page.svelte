<script lang="ts">
	import ServicesStatus from '#lib/components/services/ServicesStatus.svelte';
	import { resolve } from '$app/paths';
	import { CalendarClock, Plus, Repeat, Users } from '@lucide/svelte';
	import {
		Button,
		Card,
		EmptyState,
		PageHeader,
		SegmentedControl,
		StatCard
	} from '#lib/components/ui/index.ts';
	import ServiceRow from '#lib/components/services/ServiceRow.svelte';
	import { formatMoney } from '#lib/domain/money.ts';
	import { relativeDays } from '#lib/domain/dates.ts';
	import { monthlyTotals, owedToMe, upcomingCharges } from '#lib/domain/services.ts';
	import { services } from '#lib/stores/services.svelte.ts';

	type Filter = 'active' | 'shared' | 'inactive';

	const today = $derived(services.today);
	let filter = $state<Filter>('active');

	const totals = $derived(monthlyTotals(services.items));
	const upcoming = $derived(upcomingCharges(services.items, today));
	const owed = $derived({
		PEN: services.items
			.filter((s) => s.currency === 'PEN')
			.reduce((acc, s) => acc + owedToMe(s, today), 0),
		USD: services.items
			.filter((s) => s.currency === 'USD')
			.reduce((acc, s) => acc + owedToMe(s, today), 0)
	});
	const visible = $derived(
		services.items
			.filter((s) =>
				filter === 'active'
					? s.status === 'active'
					: filter === 'shared'
						? s.shared
						: s.status !== 'active'
			)
			.sort((a, b) => a.name.localeCompare(b.name))
	);

	function amounts(pen: number, usd: number): string {
		const parts = [];
		if (pen || !usd) parts.push(formatMoney(pen, 'PEN'));
		if (usd) parts.push(formatMoney(usd, 'USD'));
		return parts.join(' + ');
	}
</script>

<svelte:head><title>Servicios · Orbita</title></svelte:head>

<PageHeader
	title="Servicios"
	subtitle="Tus suscripciones, cuándo se cobran y quién te debe su parte."
>
	{#snippet actions()}
		<Button href={resolve('/(app)/services/new')} icon={Plus}>Nuevo servicio</Button>
	{/snippet}
</PageHeader>

<ServicesStatus />
<div class="grid gap-4 md:grid-cols-3">
	<StatCard
		icon={Repeat}
		tone="primary"
		label="Pagas al mes"
		value={services.loaded ? amounts(totals.PEN.total, totals.USD.total) : '—'}
		hint="Tu parte: {amounts(totals.PEN.mine, totals.USD.mine)}"
	/>
	<StatCard
		icon={Users}
		tone="expense"
		label="Te deben"
		value={services.loaded ? amounts(owed.PEN, owed.USD) : '—'}
		colorValue={owed.PEN + owed.USD > 0}
		hint="De tus servicios compartidos."
	/>
	<StatCard
		icon={CalendarClock}
		tone="orange"
		label="Cobros en 7 días"
		value={services.loaded ? String(upcoming.length) : '—'}
		hint={upcoming.length
			? upcoming.map((c) => `${c.service.name} ${relativeDays(c.date, today)}`).join(' · ')
			: 'Nada por cobrarse esta semana.'}
	/>
</div>

<div class="mt-8">
	<SegmentedControl
		label="Filtrar servicios"
		bind:value={filter}
		options={[
			{ value: 'active', label: 'Activos' },
			{ value: 'shared', label: 'Compartidos' },
			{ value: 'inactive', label: 'Pausados y cancelados' }
		]}
	/>
</div>

<Card padding="none" class="mt-4 overflow-hidden">
	{#if visible.length}
		<ul class="divide-y divide-divider">
			{#each visible as service (service.id)}
				<li><ServiceRow {service} /></li>
			{/each}
		</ul>
	{:else if services.loaded && !services.error}
		<EmptyState
			icon={Repeat}
			tone="orange"
			title={filter === 'inactive' ? 'Nada pausado ni cancelado' : 'Aún no tienes servicios aquí'}
			text="Agrega GitHub, Netflix o lo que pagues cada mes para no olvidar cuándo se cobra."
		>
			{#snippet action()}
				<Button href={resolve('/(app)/services/new')} icon={Plus}>Nuevo servicio</Button>
			{/snippet}
		</EmptyState>
	{/if}
</Card>
