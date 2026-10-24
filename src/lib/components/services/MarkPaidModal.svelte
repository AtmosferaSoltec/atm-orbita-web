<script lang="ts">
	import { CalendarDays, Check } from '@lucide/svelte';
	import { Button, Modal, TextField } from '#lib/components/ui/index.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatMonth, todayIso, type MonthKey } from '#lib/domain/dates.ts';
	import type { MemberStatus, Service } from '#lib/domain/services.ts';
	import { services } from '#lib/stores/services.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	interface Props {
		open: boolean;
		service: Service;
		status: MemberStatus | null;
	}

	let { open = $bindable(), service, status }: Props = $props();

	let selected = $state<MonthKey[]>([]);
	let paidOn = $state(todayIso());
	let error = $state<string | null>(null);

	$effect(() => {
		if (open && status) {
			// Oldest owed month first: people usually pay what is older.
			selected = status.owedMonths.slice(0, 1);
			paidOn = todayIso();
			error = null;
		}
	});

	function toggle(month: MonthKey) {
		selected = selected.includes(month)
			? selected.filter((m) => m !== month)
			: [...selected, month];
	}

	function save() {
		if (!status) return;
		if (!selected.length) {
			error = 'Elige al menos un mes.';
			return;
		}
		if (paidOn > todayIso()) {
			error = 'La fecha no puede ser posterior a hoy.';
			return;
		}
		services.markPaid(
			service.id,
			selected.map((month) => ({
				memberId: status.member.id,
				month,
				paidOn,
				amount: status.member.amount
			}))
		);
		open = false;
		toasts.success(
			`${status.member.name}: ${selected.length} ${selected.length === 1 ? 'mes pagado' : 'meses pagados'}.`
		);
	}
</script>

<Modal
	bind:open
	title="Registrar pago de {status?.member.name ?? ''}"
	description="Marca los meses que te pagó de {service.name}."
>
	{#if status}
		<fieldset>
			<legend class="text-[13px] font-bold text-neutral">Meses que debe</legend>
			<div class="mt-2 flex flex-col gap-2">
				{#each status.owedMonths as month (month)}
					{@const checked = selected.includes(month)}
					<label
						class="flex cursor-pointer items-center gap-3 rounded-field border px-4 py-3 transition-colors {checked
							? 'border-primary bg-primary-soft'
							: 'border-outline hover:border-chip-border'}"
					>
						<input type="checkbox" class="sr-only" {checked} onchange={() => toggle(month)} />
						<span
							class="inline-flex size-5 items-center justify-center rounded-md border-2 {checked
								? 'border-primary bg-primary text-white'
								: 'border-chip-border'}"
							aria-hidden="true"
						>
							{#if checked}<Check size={14} strokeWidth={3} />{/if}
						</span>
						<span class="flex-1 text-[15px] font-bold">{formatMonth(month)}</span>
						<span class="tabular text-sm font-bold text-muted"
							>{formatMoney(status.member.amount, service.currency)}</span
						>
					</label>
				{/each}
			</div>
		</fieldset>
		<div class="mt-4">
			<TextField
				label="Fecha en que te pagó"
				type="date"
				bind:value={paidOn}
				icon={CalendarDays}
				max={todayIso()}
			/>
		</div>
		{#if error}<p class="mt-3 text-sm font-semibold text-expense-strong">{error}</p>{/if}
	{/if}
	{#snippet footer()}
		<Button variant="secondary" block onclick={() => (open = false)}>Cancelar</Button>
		<Button block onclick={save}>
			Guardar{selected.length && status
				? ` · ${formatMoney(selected.length * status.member.amount, service.currency)}`
				: ''}
		</Button>
	{/snippet}
</Modal>
