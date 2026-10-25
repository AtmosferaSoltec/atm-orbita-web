<script lang="ts">
	import { Plus, Trash2 } from '@lucide/svelte';
	import { Button, Modal, MoneyField, MonthField, IconButton } from '#lib/components/ui/index.ts';
	import { formatMoney, parseAmount, toInputValue } from '#lib/domain/money.ts';
	import { addMonths, toMonthKey, todayIso } from '#lib/domain/dates.ts';
	import type { Debtor, LoanMovement } from '#lib/domain/loans.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
	let {
		open = $bindable(),
		debtor,
		movement
	}: { open: boolean; debtor: Debtor; movement: LoanMovement | null } = $props();
	interface Row {
		id: string;
		month: string;
		amount: string;
	}
	let rows = $state<Row[]>([]);
	let error = $state<string | null>(null);
	let busy = $state(false);
	const total = $derived(rows.reduce((sum, r) => sum + (parseAmount(r.amount) ?? 0), 0));
	const remaining = $derived((movement?.amount ?? 0) - total);
	$effect(() => {
		if (open && movement) {
			const initialRows = (movement.plan ?? []).map((p) => ({
				id: crypto.randomUUID(),
				month: p.month,
				amount: toInputValue(p.amount)
			}));
			rows = initialRows.length
				? initialRows
				: [{ id: crypto.randomUUID(), month: toMonthKey(todayIso()), amount: '' }];
			error = null;
		}
	});
	function add() {
		rows.push({
			id: crypto.randomUUID(),
			month: rows.length ? addMonths(rows[rows.length - 1].month, 1) : toMonthKey(todayIso()),
			amount: ''
		});
	}
	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		if (!movement) return;
		busy = true;
		error = await loans.setPlan(
			debtor.id,
			movement.id,
			rows.map((r) => ({ month: r.month, amount: parseAmount(r.amount) ?? 0 }))
		);
		busy = false;
		if (error) return;
		open = false;
		toasts.success('Reparto mensual guardado.');
	}
</script>

<Modal
	bind:open
	title="Repartir por meses"
	description={`${movement?.title || movement?.note || 'Préstamo'} · ${formatMoney(movement?.amount ?? 0, debtor.currency)}`}
>
	<form onsubmit={save} class="space-y-4">
		<p class="text-sm leading-relaxed text-muted">
			Indica cuánto corresponde pagar por este préstamo en cada mes. Los montos pueden ser distintos
			y puedes dejar una parte sin repartir.
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
							onclick={() => (rows = rows.filter((r) => r.id !== row.id))}
						/>
					</div>
					<MonthField label={`Mes ${i + 1}`} bind:value={row.month} fromYear={2000} toYear={2100} />
					<MoneyField
						class="mt-3"
						label={`Monto del mes ${i + 1}`}
						bind:value={row.amount}
						currency={debtor.currency}
					/>
				</div>
			{/each}
		</div>
		<Button variant="secondary" size="sm" icon={Plus} onclick={add}>Añadir mes</Button>
		<div class="rounded-2xl bg-primary-soft p-4 text-sm">
			<div class="flex justify-between gap-2">
				<span>Repartido</span><strong class="tabular">{formatMoney(total, debtor.currency)}</strong>
			</div>
			<div class="mt-2 flex justify-between gap-2">
				<span>{remaining < 0 ? 'Excede el préstamo' : 'Sin repartir'}</span><strong
					class="tabular {remaining < 0 ? 'text-expense-strong' : ''}"
					>{formatMoney(Math.abs(remaining), debtor.currency)}</strong
				>
			</div>
		</div>
		{#if error}<p role="alert" class="text-sm font-semibold text-expense-strong">{error}</p>{/if}
		<div class="flex gap-3">
			<Button variant="secondary" block onclick={() => (open = false)}>Cancelar</Button><Button
				type="submit"
				loading={busy}
				block>Guardar reparto</Button
			>
		</div>
	</form>
</Modal>
