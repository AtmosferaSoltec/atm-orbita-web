<script lang="ts">
	import { page } from '$app/state';
	import { Eye, LinkIcon } from '@lucide/svelte';
	import { Card, EmptyState, Logo } from '#lib/components/ui/index.ts';
	import LoanOverview from '#lib/components/loans/LoanOverview.svelte';
	import PaymentList from '#lib/components/loans/PaymentList.svelte';
	import ScheduleList from '#lib/components/loans/ScheduleList.svelte';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatDate, todayIso } from '#lib/domain/dates.ts';
	import { sortedPayments, summarizeLoan } from '#lib/domain/loans.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';

	// Read-only page for the person who owes. In this mockup it reads the demo data of this browser;
	// with the API it will be a public endpoint that only answers with this loan, by token.
	const loan = $derived(loans.byToken(page.params.token ?? ''));
	const summary = $derived(loan ? summarizeLoan(loan, todayIso()) : null);
</script>

<svelte:head>
	<title>Tu préstamo · Orbita</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-dvh bg-canvas">
	<header class="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
		<Logo size="sm" />
		<span
			class="inline-flex items-center gap-1.5 rounded-full bg-neutral-soft px-3 py-1 text-xs font-bold text-neutral"
		>
			<Eye size={14} aria-hidden="true" /> Solo lectura
		</span>
	</header>

	<main class="mx-auto max-w-3xl px-4 pt-4 pb-16">
		{#if loan && summary}
			<h1 class="text-2xl font-extrabold tracking-tight sm:text-[26px]">
				Hola, {loan.borrower.name.split(' ')[0]}
			</h1>
			<p class="mt-1 text-sm text-muted">
				Este es el detalle de tu préstamo del {formatDate(loan.lentOn)}. Se actualiza cada vez que
				se registra un pago.
			</p>

			<div class="mt-6"><LoanOverview {loan} {summary} borrowerView /></div>

			{#if summary.status === 'overdue'}
				<p
					class="mt-5 rounded-2xl bg-expense-soft px-4 py-3 text-sm font-semibold text-expense-strong"
				>
					Tienes {formatMoney(summary.overdueAmount, loan.currency)} vencidos.
				</p>
			{:else if summary.nextInstallment}
				<p class="mt-5 rounded-2xl bg-primary-soft px-4 py-3 text-sm font-semibold text-primary">
					Tu próxima cuota es de
					{formatMoney(
						summary.nextInstallment.amount - summary.nextInstallment.covered,
						loan.currency
					)}
					y vence el {formatDate(summary.nextInstallment.dueDate)}.
				</p>
			{/if}

			<h2 class="mt-8 text-base font-extrabold">Cronograma</h2>
			<Card padding="none" class="mt-3 overflow-hidden">
				<ScheduleList schedule={summary.schedule} currency={loan.currency} />
			</Card>

			<h2 class="mt-8 text-base font-extrabold">Tus pagos</h2>
			<Card padding="none" class="mt-3 overflow-hidden">
				{#if loan.payments.length}
					<PaymentList payments={sortedPayments(loan)} currency={loan.currency} />
				{:else}
					<p class="px-5 py-6 text-center text-sm text-muted">Aún no hay pagos registrados.</p>
				{/if}
			</Card>
		{:else}
			<Card class="mt-10">
				<EmptyState
					icon={LinkIcon}
					tone="neutral"
					title="Este enlace no es válido"
					text="Puede que lo hayan cambiado por uno nuevo. Pide el enlace actualizado a quien te lo compartió."
				/>
			</Card>
		{/if}
	</main>
</div>
