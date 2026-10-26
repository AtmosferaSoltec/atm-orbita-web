<script lang="ts">
	import { Plus, Trash2 } from '@lucide/svelte';
	import { Button, Modal, MoneyField, MonthField, IconButton } from '#lib/components/ui/index.ts';
	import { formatMoney, parseAmount, toInputValue } from '#lib/domain/money.ts';
	import { addMonths, toMonthKey, todayIso } from '#lib/domain/dates.ts';
	import { balancesOf, type Debtor } from '#lib/domain/loans.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	let {
		open = $bindable(),
		debtor,
		initialMonth = null
	}: {
		open: boolean;
		debtor: Debtor;
		initialMonth?: string | null;
	} = $props();

	interface Row {
		id: string;
		month: string;
		amount: string;
	}

	let rows = $state<Row[]>([]);
	let error = $state<string | null>(null);
	let busy = $state(false);

	const balances = $derived(balancesOf(debtor));
	const currentBalance = $derived(balances.find((b) => b.currency === debtor.currency));
	const totalLent = $derived(currentBalance?.lent ?? 0);
	const totalRemainingDebt = $derived(currentBalance?.balance ?? 0);

	const totalPlannedAmount = $derived(
		rows.reduce((sum, r) => sum + (parseAmount(r.amount) ?? 0), 0)
	);
	const unallocatedDebt = $derived(Math.max(0, totalLent - totalPlannedAmount));

	$effect(() => {
		if (open) {
			const existing = (debtor.plans ?? []).map((p) => ({
				id: crypto.randomUUID(),
				month: p.month,
				amount: toInputValue(p.amount)
			}));

			if (existing.length) {
				if (initialMonth && !existing.some((r) => r.month === initialMonth)) {
					existing.push({
						id: crypto.randomUUID(),
						month: initialMonth,
						amount: ''
					});
				}
				rows = existing.sort((a, b) => a.month.localeCompare(b.month));
			} else {
				const startMonth = initialMonth ?? toMonthKey(todayIso());
				rows = [{ id: crypto.randomUUID(), month: startMonth, amount: '' }];
			}
			error = null;
		}
	});

	function add() {
		const nextMonth = rows.length
			? addMonths(rows[rows.length - 1].month, 1)
			: toMonthKey(todayIso());
		rows.push({
			id: crypto.randomUUID(),
			month: nextMonth,
			amount: ''
		});
	}

	function remove(id: string) {
		rows = rows.filter((r) => r.id !== id);
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;

		const validRows = rows.filter((r) => r.month.trim() !== '');
		const plans = validRows.map((r) => ({
			month: r.month,
			amount: parseAmount(r.amount) ?? 0
		}));

		busy = true;
		error = await loans.setPlan(debtor.id, plans);
		busy = false;

		if (error) return;
		open = false;
		toasts.success('Plan mensual guardado.');
	}
</script>

<Modal
	bind:open
	title="Plan de cuotas mensuales"
	description={`${debtor.name} · Saldo pendiente: ${formatMoney(totalRemainingDebt, debtor.currency)}`}
>
	<form onsubmit={save} class="space-y-4">
		<p class="text-xs leading-relaxed text-muted">
			Define cuánto acordaron pagar en cada mes (por ejemplo, en octubre, noviembre, etc.). Cada mes
			tendrá su cuota asignada sin necesidad de dividir los préstamos uno por uno.
		</p>

		<div class="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
			{#each rows as row, i (row.id)}
				<div class="rounded-2xl border border-outline bg-canvas p-3">
					<div class="mb-2 flex items-center justify-between">
						<p class="text-xs font-bold text-muted">Mes {i + 1}</p>
						<IconButton
							icon={Trash2}
							variant="danger"
							label={`Quitar mes ${i + 1}`}
							onclick={() => remove(row.id)}
						/>
					</div>
					<MonthField label="Mes acordado" bind:value={row.month} fromYear={2000} toYear={2100} />
					<MoneyField
						class="mt-3"
						label="Cuota prevista a pagar"
						bind:value={row.amount}
						currency={debtor.currency}
					/>
				</div>
			{/each}
		</div>

		<Button variant="secondary" size="sm" icon={Plus} onclick={add}>Añadir otro mes</Button>

		<div class="space-y-1.5 rounded-2xl bg-primary-soft p-4 text-xs">
			<div class="flex justify-between gap-2">
				<span class="text-muted">Total prestado</span>
				<strong class="tabular">{formatMoney(totalLent, debtor.currency)}</strong>
			</div>
			<div class="flex justify-between gap-2">
				<span class="text-muted">Total programado en cuotas</span>
				<strong class="tabular font-extrabold text-primary"
					>{formatMoney(totalPlannedAmount, debtor.currency)}</strong
				>
			</div>
			{#if unallocatedDebt > 0}
				<div class="flex justify-between gap-2">
					<span class="text-muted">Sin programar aún</span>
					<strong class="tabular text-muted">{formatMoney(unallocatedDebt, debtor.currency)}</strong
					>
				</div>
			{/if}
		</div>

		{#if error}<p role="alert" class="text-sm font-semibold text-expense-strong">{error}</p>{/if}

		<div class="flex gap-3 pt-2">
			<Button variant="secondary" block onclick={() => (open = false)}>Cancelar</Button>
			<Button type="submit" loading={busy} block>Guardar plan</Button>
		</div>
	</form>
</Modal>
