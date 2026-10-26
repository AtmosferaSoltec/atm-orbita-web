<script lang="ts">
	import {
		Button,
		Modal,
		MoneyField,
		TextAreaField,
		TextField,
		MonthField
	} from '#lib/components/ui/index.ts';
	import DatePicker from '#lib/components/ui/DatePicker.svelte';
	import { formatMoney, parseAmount, toInputValue } from '#lib/domain/money.ts';
	import { newId } from '#lib/data/storage.ts';
	import { toMonthKey } from '#lib/domain/dates.ts';
	import {
		balancesOf,
		type Debtor,
		type LoanMovement,
		type MovementKind
	} from '#lib/domain/loans.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
	let {
		open = $bindable(),
		debtor,
		kind,
		editing = null
	}: {
		open: boolean;
		debtor: Debtor;
		kind: MovementKind;
		editing?: LoanMovement | null;
	} = $props();
	let amount = $state('');
	let requestId = $state(newId());
	let title = $state('');
	let appliedMonth = $state(toMonthKey(loans.today));
	const currency = $derived(debtor.currency);
	let date = $state(loans.today);
	let note = $state('');
	let error = $state<string | null>(null);
	let busy = $state(false);
	const isPayment = $derived(kind === 'payment');
	const balance = $derived(balancesOf(debtor).find((b) => b.currency === currency)?.balance ?? 0);
	$effect(() => {
		if (open) {
			amount = editing ? toInputValue(editing.amount) : '';
			requestId = newId();
			title = editing?.title ?? '';
			appliedMonth = editing?.appliedMonth ?? toMonthKey(editing?.date ?? loans.today);
			date = editing?.date ?? loans.today;
			note = editing?.note ?? '';
			error = null;
		}
	});
	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		busy = true;
		error = await loans.saveMovement(
			debtor.id,
			{
				kind,
				amount: parseAmount(amount) ?? 0,
				currency,
				date,
				note: note.trim(),
				title: isPayment ? undefined : title.trim(),
				appliedMonth: isPayment ? appliedMonth : undefined
			},
			editing?.id,
			requestId
		);
		busy = false;
		if (error) return;
		open = false;
		toasts.success(
			editing ? 'Movimiento actualizado.' : isPayment ? 'Abono registrado.' : 'Préstamo añadido.'
		);
	}
</script>

<Modal
	bind:open
	title={editing
		? isPayment
			? 'Editar abono'
			: 'Editar préstamo'
		: isPayment
			? 'Registrar abono'
			: 'Añadir préstamo'}
	description={`${debtor.name} · ${currency === 'PEN' ? 'Soles (S/)' : 'Dólares (US$)'}`}
>
	<form onsubmit={save} class="space-y-4">
		{#if !isPayment}<TextField
				label="Concepto (opcional)"
				bind:value={title}
				maxlength={100}
				placeholder="Celular, audífonos, viaje…"
			/>{/if}
		{#if isPayment}<p
				class="rounded-xl bg-income-soft p-3 text-sm font-semibold text-income-strong"
			>
				Saldo actual: {formatMoney(balance, currency)}
			</p>{/if}
		<MoneyField
			label={isPayment ? 'Monto del abono' : 'Monto prestado'}
			bind:value={amount}
			{currency}
			hint={isPayment
				? 'Registra lo que recibiste. Puede ser cualquier monto hasta el saldo disponible.'
				: 'Este monto se suma a lo que ya le prestaste en esta moneda.'}
		/>
		{#if isPayment}<MonthField
				label="Mes al que corresponde"
				bind:value={appliedMonth}
				fromYear={2000}
				toYear={2100}
				hint="El abono se aplica solo a este mes, aunque se haya recibido en otra fecha."
			/>{/if}
		<DatePicker
			label={isPayment ? 'Fecha del abono' : 'Fecha del préstamo'}
			bind:value={date}
			max={loans.today}
		/>
		<TextAreaField
			label="Nota (opcional)"
			bind:value={note}
			placeholder={isPayment
				? 'Por Yape, transferencia, efectivo…'
				: 'Celular, laptop, gastos personales…'}
			rows={2}
		/>
		{#if error}<p role="alert" class="text-sm font-semibold text-expense-strong">{error}</p>{/if}
		<div class="flex gap-3 pt-2">
			<Button variant="secondary" block onclick={() => (open = false)}>Cancelar</Button><Button
				type="submit"
				loading={busy}
				block
				>{editing ? 'Guardar cambios' : isPayment ? 'Guardar abono' : 'Guardar préstamo'}</Button
			>
		</div>
	</form>
</Modal>
