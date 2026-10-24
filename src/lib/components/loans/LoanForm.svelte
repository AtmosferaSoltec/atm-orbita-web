<script lang="ts">
	import { untrack } from 'svelte';
	import { CalendarDays, Phone, User } from '@lucide/svelte';
	import {
		Button,
		Card,
		MoneyField,
		MonthField,
		SegmentedControl,
		SelectField,
		TextAreaField,
		TextField
	} from '#lib/components/ui/index.ts';
	import { formatMoney, parseAmount, toInputValue, type Currency } from '#lib/domain/money.ts';
	import {
		addMonths,
		dateInMonth,
		formatDate,
		formatMonth,
		toMonthKey,
		todayIso
	} from '#lib/domain/dates.ts';
	import { installmentCount, validateLoan, type Loan, type LoanDraft } from '#lib/domain/loans.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	interface Props {
		initial?: Loan;
		submitLabel: string;
		onsubmit: (draft: LoanDraft) => void;
	}

	let { initial, submitLabel, onsubmit }: Props = $props();

	const start = untrack(() => initial);
	const today = todayIso();

	let name = $state(start?.borrower.name ?? '');
	let phone = $state(start?.borrower.phone ?? '');
	let currency = $state<Currency>(start?.currency ?? 'PEN');
	let principalText = $state(toInputValue(start?.principal));
	let lentOn = $state(start?.lentOn ?? today);
	let installmentText = $state(toInputValue(start?.installment));
	let firstDueMonth = $state(start?.firstDueMonth ?? addMonths(toMonthKey(today), 1));
	let dueDay = $state(String(start?.dueDay ?? 5));
	let note = $state(start?.note ?? '');

	const principal = $derived(parseAmount(principalText) ?? 0);
	const installment = $derived(parseAmount(installmentText) ?? 0);
	const count = $derived(
		installment > 0 && installment <= principal ? installmentCount(principal, installment) : 0
	);
	const lastAmount = $derived(count ? principal - installment * (count - 1) : 0);

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const draft: LoanDraft = {
			borrower: { name: name.trim(), phone: phone.trim() },
			currency,
			principal,
			lentOn,
			installment,
			firstDueMonth,
			dueDay: Number(dueDay),
			note: note.trim()
		};
		const error = validateLoan(draft);
		if (error) {
			toasts.error(error);
			return;
		}
		onsubmit(draft);
	}
</script>

<form class="grid gap-6 lg:grid-cols-[1fr_320px]" onsubmit={submit} novalidate>
	<Card padding="lg">
		<h2 class="text-base font-extrabold">Persona</h2>
		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<TextField
				label="Nombre"
				bind:value={name}
				icon={User}
				placeholder="Adriel Ramos"
				maxlength={60}
			/>
			<TextField
				label="Celular (opcional)"
				bind:value={phone}
				icon={Phone}
				inputmode="tel"
				placeholder="987 654 321"
			/>
		</div>

		<h2 class="mt-7 text-base font-extrabold">Préstamo</h2>
		<div class="mt-4 flex flex-col gap-4">
			<div>
				<p class="mb-1.5 text-[13px] font-bold text-neutral">Moneda</p>
				<SegmentedControl
					label="Moneda"
					bind:value={currency}
					options={[
						{ value: 'PEN', label: 'S/ Soles' },
						{ value: 'USD', label: 'US$ Dólares' }
					]}
				/>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<MoneyField label="Monto prestado" bind:value={principalText} {currency} />
				<TextField
					label="Fecha del préstamo"
					type="date"
					bind:value={lentOn}
					icon={CalendarDays}
					max={today}
				/>
			</div>
		</div>

		<h2 class="mt-7 text-base font-extrabold">Cómo te va a pagar</h2>
		<p class="mt-1 text-[13px] text-muted">Sin intereses: devuelve lo mismo que le prestaste.</p>
		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<MoneyField label="Cuota mensual" bind:value={installmentText} {currency} />
			<SelectField
				label="Día de pago"
				bind:value={dueDay}
				options={Array.from({ length: 31 }, (_, i) => ({
					value: String(i + 1),
					label: `Día ${i + 1}`
				}))}
				hint="En meses más cortos, el último día."
			/>
			<MonthField
				label="Primera cuota"
				bind:value={firstDueMonth}
				fromYear={Number(lentOn.slice(0, 4)) || new Date().getFullYear()}
				class="sm:col-span-2"
			/>
		</div>

		<div class="mt-7">
			<TextAreaField
				label="Nota (opcional)"
				bind:value={note}
				placeholder="Para qué fue, acuerdos…"
			/>
		</div>
	</Card>

	<aside class="lg:sticky lg:top-10 lg:self-start">
		<Card padding="lg">
			<h2 class="text-sm font-bold text-muted">Cronograma</h2>
			{#if count}
				<p class="tabular mt-3 text-2xl font-extrabold">
					{count}
					{count === 1 ? 'cuota' : 'cuotas'}
				</p>
				<p class="tabular mt-1 text-sm text-muted">
					{#if lastAmount !== installment}
						{count - 1} de {formatMoney(installment, currency)} y una última de {formatMoney(
							lastAmount,
							currency
						)}
					{:else}
						de {formatMoney(installment, currency)} cada mes
					{/if}
				</p>
				<dl class="mt-5 flex flex-col gap-3 border-t border-divider pt-4 text-sm">
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Primera</dt>
						<dd class="font-bold">{formatDate(dateInMonth(firstDueMonth, Number(dueDay)))}</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Última</dt>
						<dd class="font-bold">{formatMonth(addMonths(firstDueMonth, count - 1))}</dd>
					</div>
				</dl>
			{:else}
				<p class="mt-3 text-sm text-muted">Escribe el monto y la cuota para ver el cronograma.</p>
			{/if}
			<Button type="submit" size="lg" block class="mt-6">{submitLabel}</Button>
		</Card>
	</aside>
</form>
