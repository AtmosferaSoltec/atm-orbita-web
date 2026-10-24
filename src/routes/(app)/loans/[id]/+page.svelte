<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { FileQuestion, Pencil, Phone, Plus, StickyNote, Trash2, Wallet } from '@lucide/svelte';
	import {
		Badge,
		Button,
		Card,
		ConfirmDialog,
		EmptyState,
		IconButton,
		PageHeader,
		SegmentedControl
	} from '#lib/components/ui/index.ts';
	import LoanOverview from '#lib/components/loans/LoanOverview.svelte';
	import PaymentList from '#lib/components/loans/PaymentList.svelte';
	import PaymentModal from '#lib/components/loans/PaymentModal.svelte';
	import ScheduleList from '#lib/components/loans/ScheduleList.svelte';
	import ShareLinkCard from '#lib/components/loans/ShareLinkCard.svelte';
	import { LOAN_STATUS } from '#lib/components/loans/labels.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatDate, todayIso } from '#lib/domain/dates.ts';
	import { sortedPayments, summarizeLoan, type LoanPayment } from '#lib/domain/loans.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	const loan = $derived(loans.get(page.params.id ?? ''));
	const summary = $derived(loan ? summarizeLoan(loan, todayIso()) : null);

	let tab = $state<'schedule' | 'payments'>('schedule');
	let paying = $state(false);
	let confirmDelete = $state(false);
	let paymentToDelete = $state<LoanPayment | null>(null);
	let confirmPaymentDelete = $state(false);

	async function remove() {
		if (!loan) return;
		loans.remove(loan.id);
		toasts.success('Préstamo eliminado.');
		await goto(resolve('/(app)/loans'), { replaceState: true });
	}
</script>

<svelte:head><title>Préstamo · Orbita</title></svelte:head>

{#if loan && summary}
	<PageHeader
		title={loan.borrower.name}
		subtitle="Préstamo del {formatDate(loan.lentOn)}"
		back={resolve('/(app)/loans')}
	>
		{#snippet actions()}
			<IconButton
				icon={Trash2}
				label="Eliminar préstamo"
				variant="danger"
				onclick={() => (confirmDelete = true)}
			/>
			<Button
				href={resolve('/(app)/loans/[id]/edit', { id: loan.id })}
				variant="secondary"
				icon={Pencil}>Editar</Button
			>
			{#if summary.balance > 0}
				<Button icon={Plus} onclick={() => (paying = true)}>Registrar pago</Button>
			{/if}
		{/snippet}
	</PageHeader>

	<div class="grid gap-5 lg:grid-cols-[1fr_340px]">
		<div class="flex min-w-0 flex-col gap-5">
			<LoanOverview {loan} {summary} />

			{#if summary.status === 'overdue'}
				<p
					class="rounded-2xl bg-expense-soft px-4 py-3 text-sm font-semibold text-expense-strong"
					role="status"
				>
					Tiene {summary.overdueCount}
					{summary.overdueCount === 1 ? 'cuota atrasada' : 'cuotas atrasadas'}: le falta pagar
					{formatMoney(summary.overdueAmount, loan.currency)} de lo que ya venció.
				</p>
			{/if}

			<div>
				<SegmentedControl
					label="Ver"
					bind:value={tab}
					options={[
						{ value: 'schedule', label: `Cronograma · ${summary.schedule.length}` },
						{ value: 'payments', label: `Pagos · ${loan.payments.length}` }
					]}
				/>
				<Card padding="none" class="mt-4 overflow-hidden">
					{#if tab === 'schedule'}
						<ScheduleList schedule={summary.schedule} currency={loan.currency} />
					{:else if loan.payments.length}
						<PaymentList
							payments={sortedPayments(loan)}
							currency={loan.currency}
							ondelete={(payment) => {
								paymentToDelete = payment;
								confirmPaymentDelete = true;
							}}
						/>
					{:else}
						<EmptyState
							icon={Wallet}
							tone="income"
							title="Aún no hay pagos"
							text="Cuando te pague, regístralo aquí."
						>
							{#snippet action()}
								<Button icon={Plus} onclick={() => (paying = true)}>Registrar pago</Button>
							{/snippet}
						</EmptyState>
					{/if}
				</Card>
			</div>
		</div>

		<aside class="flex flex-col gap-5">
			<Card padding="lg">
				<div class="flex items-center justify-between gap-2">
					<h2 class="text-base font-extrabold">Detalle</h2>
					<Badge tone={LOAN_STATUS[summary.status].tone}>{LOAN_STATUS[summary.status].label}</Badge>
				</div>
				<dl class="mt-4 flex flex-col gap-3 text-sm">
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Prestado</dt>
						<dd class="tabular font-bold">{formatMoney(loan.principal, loan.currency)}</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Día de pago</dt>
						<dd class="font-bold">Día {loan.dueDay} de cada mes</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Último pago</dt>
						<dd class="font-bold">
							{summary.lastPayment ? formatDate(summary.lastPayment.date) : 'Ninguno'}
						</dd>
					</div>
				</dl>
				{#if loan.borrower.phone || loan.note}
					<div class="mt-4 flex flex-col gap-2.5 border-t border-divider pt-4 text-sm">
						{#if loan.borrower.phone}
							<p class="flex items-center gap-2 text-muted">
								<Phone size={16} aria-hidden="true" />
								{loan.borrower.phone}
							</p>
						{/if}
						{#if loan.note}
							<p class="flex items-start gap-2 text-muted">
								<StickyNote size={16} class="mt-0.5 shrink-0" aria-hidden="true" />
								{loan.note}
							</p>
						{/if}
					</div>
				{/if}
			</Card>
			<ShareLinkCard {loan} />
		</aside>
	</div>

	<PaymentModal bind:open={paying} {loan} {summary} />
	<ConfirmDialog
		bind:open={confirmDelete}
		title="¿Eliminar este préstamo?"
		text="Se borrarán también sus pagos y el enlace público dejará de funcionar."
		onconfirm={remove}
	/>
	<ConfirmDialog
		bind:open={confirmPaymentDelete}
		title="¿Eliminar este pago?"
		text={paymentToDelete
			? `${formatMoney(paymentToDelete.amount, loan.currency)} del ${formatDate(paymentToDelete.date)}. Las cuotas se vuelven a calcular.`
			: ''}
		onconfirm={() => {
			if (paymentToDelete) loans.removePayment(loan.id, paymentToDelete.id);
			toasts.success('Pago eliminado.');
		}}
	/>
{:else}
	<Card>
		<EmptyState icon={FileQuestion} tone="neutral" title="Este registro ya no existe.">
			{#snippet action()}<Button href={resolve('/(app)/loans')}>Volver a préstamos</Button
				>{/snippet}
		</EmptyState>
	</Card>
{/if}
