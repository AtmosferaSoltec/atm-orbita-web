<script lang="ts">
	import ServicesStatus from '#lib/components/services/ServicesStatus.svelte';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		ArrowDownLeft,
		CalendarClock,
		ChevronRight,
		CircleAlert,
		Clock,
		HandCoins,
		PartyPopper,
		ReceiptText,
		Repeat,
		Users
	} from '@lucide/svelte';
	import { Card, IconBadge, StatCard } from '#lib/components/ui/index.ts';
	import type { IconComponent, Tone } from '#lib/components/ui/index.ts';
	import LimitCard from '#lib/components/receipts/LimitCard.svelte';
	import { formatMoney, type Cents, type Currency } from '#lib/domain/money.ts';
	import {
		daysBetween,
		formatDate,
		formatShortDate,
		relativeDays,
		todayIso
	} from '#lib/domain/dates.ts';
	import { summarizeYear } from '#lib/domain/receipts.ts';
	import { DUE_SOON_DAYS, summarizeLoan } from '#lib/domain/loans.ts';
	import { membersStatus, monthlyTotals, owedToMe, upcomingCharges } from '#lib/domain/services.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { receipts } from '#lib/stores/receipts.svelte.ts';
	import { services } from '#lib/stores/services.svelte.ts';
	import { session } from '#lib/stores/session.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
	import { messageFor } from '#lib/api/errors.ts';

	interface Alert {
		key: string;
		icon: IconComponent;
		tone: Tone;
		title: string;
		detail: string;
		amount?: string;
		href: string;
		priority: number;
	}

	interface Activity {
		key: string;
		date: string;
		icon: IconComponent;
		tone: Tone;
		title: string;
		detail: string;
		amount: string;
		href: string;
	}

	const today = todayIso();
	const serviceToday = $derived(services.today);
	// Receipts and services come from the API; loans are still demo data.
	const year = $derived(receipts.currentYear);
	const receiptItems = $derived(receipts.itemsOf(year) ?? []);
	const receiptsLoaded = $derived(receipts.itemsOf(year) !== undefined);

	onMount(() => {
		void services.load();
	});

	onMount(async () => {
		try {
			await receipts.loadYears();
			await receipts.loadYear(receipts.currentYear);
		} catch (failure) {
			toasts.error(messageFor(failure));
		}
	});

	const receiptSummary = $derived(summarizeYear(receiptItems, year, receipts.limitFor(year)));
	const loanSummaries = $derived(
		loans.items.map((loan) => ({ loan, summary: summarizeLoan(loan, today) }))
	);
	const serviceTotals = $derived(monthlyTotals(services.items));

	function byCurrency(values: { currency: Currency; amount: Cents }[]): string {
		const pen = values.filter((v) => v.currency === 'PEN').reduce((a, v) => a + v.amount, 0);
		const usd = values.filter((v) => v.currency === 'USD').reduce((a, v) => a + v.amount, 0);
		const out = [];
		if (pen || !usd) out.push(formatMoney(pen, 'PEN'));
		if (usd) out.push(formatMoney(usd, 'USD'));
		return out.join(' + ');
	}

	const loanBalance = $derived(
		byCurrency(
			loanSummaries.map(({ loan, summary }) => ({
				currency: loan.currency,
				amount: summary.balance
			}))
		)
	);
	const activeLoans = $derived(
		loanSummaries.filter(({ summary }) => summary.status !== 'completed').length
	);
	const owed = $derived(
		byCurrency(
			services.items.map((s) => ({ currency: s.currency, amount: owedToMe(s, serviceToday) }))
		)
	);

	const alerts = $derived.by(() => {
		const list: Alert[] = [];
		for (const { loan, summary } of loanSummaries) {
			const href = resolve('/(app)/loans/[id]', { id: loan.id });
			if (summary.status === 'overdue') {
				list.push({
					key: `loan-overdue-${loan.id}`,
					icon: CircleAlert,
					tone: 'expense',
					title: `${loan.borrower.name} tiene cuotas atrasadas`,
					detail: `${summary.overdueCount} ${summary.overdueCount === 1 ? 'cuota vencida' : 'cuotas vencidas'}`,
					amount: formatMoney(summary.overdueAmount, loan.currency),
					href,
					priority: 0
				});
			} else if (summary.nextInstallment?.status === 'due-soon') {
				const next = summary.nextInstallment;
				list.push({
					key: `loan-soon-${loan.id}`,
					icon: HandCoins,
					tone: 'orange',
					title: `Cuota de ${loan.borrower.name}`,
					detail: `Vence ${relativeDays(next.dueDate, today)} · ${formatShortDate(next.dueDate)}`,
					amount: formatMoney(next.amount - next.covered, loan.currency),
					href,
					priority: 2
				});
			}
		}
		for (const service of services.items) {
			for (const status of membersStatus(service, serviceToday)) {
				if (!status.owedMonths.length) continue;
				list.push({
					key: `member-${service.id}-${status.member.id}`,
					icon: Users,
					tone: 'expense',
					title: `${status.member.name} te debe ${service.name}`,
					detail: `${status.owedMonths.length} ${status.owedMonths.length === 1 ? 'mes' : 'meses'} sin pagar`,
					amount: formatMoney(status.owedAmount, service.currency),
					href: resolve('/(app)/services/[id]', { id: service.id }),
					priority: 1
				});
			}
		}
		for (const charge of upcomingCharges(services.items, serviceToday)) {
			list.push({
				key: `charge-${charge.service.id}`,
				icon: CalendarClock,
				tone: 'primary',
				title: `Se cobra ${charge.service.name}`,
				detail: `${relativeDays(charge.date, today)} · ${formatShortDate(charge.date)}`,
				amount: formatMoney(charge.service.amount, charge.service.currency),
				href: resolve('/(app)/services/[id]', { id: charge.service.id }),
				priority: 3
			});
		}
		if (receiptSummary.level !== 'ok') {
			list.push({
				key: 'receipt-limit',
				icon: ReceiptText,
				tone: receiptSummary.level === 'exceeded' ? 'expense' : 'orange',
				title:
					receiptSummary.level === 'exceeded'
						? 'Superaste tu tope anual'
						: 'Te acercas a tu tope anual',
				detail: `${receiptSummary.usedPercent}% usado en ${year}`,
				amount:
					receiptSummary.level === 'exceeded'
						? undefined
						: `quedan ${formatMoney(receiptSummary.remaining)}`,
				href: resolve('/(app)/receipts'),
				priority: 1
			});
		}
		const pending = receiptItems.filter((r) => !r.collectedOn);
		if (pending.length) {
			list.push({
				key: 'receipts-pending',
				icon: Clock,
				tone: 'orange',
				title: `${pending.length} ${pending.length === 1 ? 'recibo' : 'recibos'} por cobrar`,
				detail: `El más antiguo es del ${formatDate(pending.map((r) => r.issueDate).sort()[0])}`,
				amount: formatMoney(pending.reduce((a, r) => a + r.gross - r.withholding, 0)),
				href: resolve('/(app)/receipts'),
				priority: 2
			});
		}
		return list.sort((a, b) => a.priority - b.priority);
	});

	const activity = $derived.by(() => {
		const list: Activity[] = [];
		for (const r of receiptItems) {
			list.push({
				key: `r-${r.id}`,
				date: r.issueDate,
				icon: ReceiptText,
				tone: 'primary',
				title: `Recibo ${r.series}-${r.number}`,
				detail: `${r.client.name} · ${formatShortDate(r.issueDate)}`,
				amount: formatMoney(r.gross),
				href: resolve('/(app)/receipts/[id]', { id: r.id })
			});
		}
		for (const loan of loans.items) {
			for (const p of loan.payments) {
				list.push({
					key: `lp-${p.id}`,
					date: p.date,
					icon: ArrowDownLeft,
					tone: 'income',
					title: `${loan.borrower.name} pagó`,
					detail: `Préstamo · ${formatShortDate(p.date)}`,
					amount: formatMoney(p.amount, loan.currency, { signed: true }),
					href: resolve('/(app)/loans/[id]', { id: loan.id })
				});
			}
		}
		for (const service of services.items) {
			for (const p of service.memberPayments) {
				const member = service.members.find((m) => m.id === p.memberId);
				list.push({
					key: `mp-${p.id}`,
					date: p.paidOn,
					icon: Repeat,
					tone: 'income',
					title: `${member?.name ?? 'Alguien'} pagó ${service.name}`,
					detail: `Servicio · ${formatShortDate(p.paidOn)}`,
					amount: formatMoney(p.amount, service.currency, { signed: true }),
					href: resolve('/(app)/services/[id]', { id: service.id })
				});
			}
		}
		return list
			.filter((a) => a.date <= today && daysBetween(a.date, today) <= 60)
			.sort((a, b) => b.date.localeCompare(a.date))
			.slice(0, 6);
	});

	const greeting = $derived.by(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Buenos días';
		if (hour < 19) return 'Buenas tardes';
		return 'Buenas noches';
	});
</script>

<svelte:head><title>Inicio · Orbita</title></svelte:head>

<header class="mb-6">
	<h1 class="text-2xl font-extrabold tracking-tight sm:text-[26px]">
		{greeting}, {session.firstName}
	</h1>
	<p class="mt-1 text-sm text-muted">
		Esto es lo que necesita tu atención hoy, {formatDate(today)}.
	</p>
</header>

<ServicesStatus />
<div class="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
	<a
		href={resolve('/(app)/receipts')}
		class="block rounded-hero transition hover:-translate-y-px"
		aria-label="Ver recibos por honorarios"
	>
		{#if receiptsLoaded}
			<LimitCard summary={receiptSummary} />
		{:else}
			<div
				class="h-full min-h-60 animate-pulse rounded-hero bg-neutral-soft"
				aria-busy="true"
				aria-label="Cargando recibos"
			></div>
		{/if}
	</a>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
		<StatCard
			icon={HandCoins}
			tone="income"
			label="Préstamos por cobrar"
			value={loanBalance}
			hint="{activeLoans} {activeLoans === 1 ? 'préstamo en curso' : 'préstamos en curso'}"
			href={resolve('/(app)/loans')}
		/>
		<StatCard
			icon={Repeat}
			tone="orange"
			label="Servicios al mes"
			value={services.loaded
				? byCurrency([
						{ currency: 'PEN', amount: serviceTotals.PEN.mine },
						{ currency: 'USD', amount: serviceTotals.USD.mine }
					])
				: '—'}
			hint={services.loaded
				? `Tu parte. Te deben ${owed} de servicios compartidos.`
				: services.error
					? 'No se pudieron cargar tus servicios.'
					: 'Cargando tus servicios…'}
			href={resolve('/(app)/services')}
		/>
	</div>
</div>

<!-- Alert and activity links are built with resolve() in the script. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="mt-8 grid gap-5 lg:grid-cols-2">
	<section>
		<h2 class="text-base font-extrabold">Pendientes</h2>
		<p class="mt-0.5 text-[13px] text-muted">
			Atrasos, deudas y cobros de los próximos {DUE_SOON_DAYS} días.
		</p>
		<Card padding="none" class="mt-3 overflow-hidden">
			{#if alerts.length}
				<ul class="divide-y divide-divider">
					{#each alerts as alert (alert.key)}
						<li>
							<a
								href={alert.href}
								class="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-canvas sm:px-5"
							>
								<IconBadge icon={alert.icon} tone={alert.tone} size="sm" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-[15px] font-bold">{alert.title}</p>
									<p class="truncate text-[13px] text-muted">{alert.detail}</p>
								</div>
								{#if alert.amount}<p class="tabular shrink-0 text-right text-sm font-extrabold">
										{alert.amount}
									</p>{/if}
								<ChevronRight size={18} class="shrink-0 text-muted-light" aria-hidden="true" />
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="flex flex-col items-center px-6 py-10 text-center">
					<IconBadge icon={PartyPopper} tone="income" size="lg" />
					<p class="mt-3 font-extrabold">Todo al día</p>
					<p class="mt-1 text-sm text-muted">Nadie te debe y no hay cobros esta semana.</p>
				</div>
			{/if}
		</Card>
	</section>

	<section>
		<h2 class="text-base font-extrabold">Actividad reciente</h2>
		<p class="mt-0.5 text-[13px] text-muted">Recibos emitidos y pagos que te hicieron.</p>
		<Card padding="none" class="mt-3 overflow-hidden">
			{#if activity.length}
				<ul class="divide-y divide-divider">
					{#each activity as item (item.key)}
						<li>
							<a
								href={item.href}
								class="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-canvas sm:px-5"
							>
								<IconBadge icon={item.icon} tone={item.tone} size="sm" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-[15px] font-bold">{item.title}</p>
									<p class="truncate text-[13px] text-muted">{item.detail}</p>
								</div>
								<p
									class="tabular shrink-0 text-sm font-extrabold {item.tone === 'income'
										? 'text-income-strong'
										: ''}"
								>
									{item.amount}
								</p>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="px-5 py-10 text-center text-sm text-muted">
					Sin movimientos en los últimos 60 días.
				</p>
			{/if}
		</Card>
	</section>
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
