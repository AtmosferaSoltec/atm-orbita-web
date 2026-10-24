<script lang="ts">
	import { CalendarDays } from '@lucide/svelte';
	import { Button, Modal, MoneyField, TextAreaField, TextField } from '#lib/components/ui/index.ts';
	import { formatMoney, parseAmount, toInputValue } from '#lib/domain/money.ts';
	import { todayIso } from '#lib/domain/dates.ts';
	import { validatePayment, type Loan, type LoanSummary } from '#lib/domain/loans.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	interface Props {
		open: boolean;
		loan: Loan;
		summary: LoanSummary;
	}

	let { open = $bindable(), loan, summary }: Props = $props();

	let amount = $state('');
	let date = $state(todayIso());
	let note = $state('');
	let error = $state<string | null>(null);

	// Suggest what is due: the overdue amount, or the next installment.
	const suggested = $derived(
		summary.overdueAmount ||
			(summary.nextInstallment
				? summary.nextInstallment.amount - summary.nextInstallment.covered
				: 0)
	);

	$effect(() => {
		if (open) {
			amount = toInputValue(Math.min(suggested, summary.balance));
			date = todayIso();
			note = '';
			error = null;
		}
	});

	function save() {
		const payment = { amount: parseAmount(amount) ?? 0, date, note: note.trim() };
		error = validatePayment(payment, summary.balance);
		if (error) return;
		loans.addPayment(loan.id, payment);
		open = false;
		toasts.success(`Pago de ${formatMoney(payment.amount, loan.currency)} registrado.`);
	}
</script>

<Modal
	bind:open
	title="Registrar pago"
	description="{loan.borrower.name} · le falta pagar {formatMoney(summary.balance, loan.currency)}"
>
	<div class="flex flex-col gap-4">
		<MoneyField
			label="Monto"
			bind:value={amount}
			currency={loan.currency}
			{error}
			hint="Puede ser de cualquier monto: cubre las cuotas en orden."
		/>
		<TextField
			label="Fecha del pago"
			type="date"
			bind:value={date}
			icon={CalendarDays}
			max={todayIso()}
		/>
		<TextAreaField
			label="Nota (opcional)"
			bind:value={note}
			rows={2}
			placeholder="Por Yape, en efectivo…"
		/>
	</div>
	{#snippet footer()}
		<Button variant="secondary" block onclick={() => (open = false)}>Cancelar</Button>
		<Button block onclick={save}>Registrar pago</Button>
	{/snippet}
</Modal>
