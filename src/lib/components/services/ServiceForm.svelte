<script lang="ts">
	import CurrencySwitch from '#lib/components/ui/CurrencySwitch.svelte';
	import BillingDayPicker from '#lib/components/ui/BillingDayPicker.svelte';
	import DatePicker from '#lib/components/ui/DatePicker.svelte';
	import { messageFor } from '#lib/api/errors.ts';
	import { untrack } from 'svelte';
	import { Check, Plus, Trash2, Type, User } from '@lucide/svelte';
	import {
		Button,
		Card,
		IconButton,
		MoneyField,
		MonthField,
		SelectField,
		SwitchRow,
		TextAreaField,
		TextField
	} from '#lib/components/ui/index.ts';
	import ServiceIcon from './ServiceIcon.svelte';
	import { formatMoney, parseAmount, toInputValue, type Currency } from '#lib/domain/money.ts';
	import { toMonthKey, type MonthKey } from '#lib/domain/dates.ts';
	import {
		SERVICE_COLORS,
		myShare,
		validateService,
		type Service,
		type ServiceDraft,
		type ServiceStatus
	} from '#lib/domain/services.ts';
	import { services } from '#lib/stores/services.svelte.ts';
	import { newId } from '#lib/data/storage.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	interface Props {
		initial?: Service;
		submitLabel: string;
		onsubmit: (draft: ServiceDraft) => Promise<void>;
	}

	let { initial, submitLabel, onsubmit }: Props = $props();

	interface MemberInput {
		id: string;
		name: string;
		amount: string;
		since: MonthKey;
	}

	const start = untrack(() => initial);
	const today = untrack(() => services.today);
	let saving = $state(false);

	let name = $state(start?.name ?? '');
	let color = $state(start?.color ?? SERVICE_COLORS[0]);
	let currency = $state<Currency>(start?.currency ?? 'PEN');
	let amountText = $state(toInputValue(start?.amount));
	let billingDay = $state(start?.billingDay ?? Number(today.slice(8, 10)));
	let startedOn = $state(start?.startedOn ?? today);
	let status = $state<ServiceStatus>(start?.status ?? 'active');
	let endedOn = $state(start?.endedOn ?? today);
	let note = $state(start?.note ?? '');
	let shared = $state(start?.shared ?? false);
	let members = $state<MemberInput[]>(
		start?.members.map((m) => ({ ...m, amount: toInputValue(m.amount) })) ?? []
	);

	const amount = $derived(parseAmount(amountText) ?? 0);
	const parsedMembers = $derived(
		members.map((m) => ({
			id: m.id,
			name: m.name.trim(),
			amount: parseAmount(m.amount) ?? 0,
			since: m.since
		}))
	);
	const mine = $derived(myShare({ amount, shared, members: parsedMembers }));

	function addMember() {
		members.push({
			id: newId(),
			name: '',
			amount: '',
			since: toMonthKey(startedOn > today ? startedOn : today)
		});
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (saving) return;
		const draft: ServiceDraft = {
			name: name.trim(),
			color,
			currency,
			amount,
			billingDay,
			startedOn,
			status,
			endedOn: status === 'cancelled' ? endedOn : null,
			note: note.trim(),
			shared,
			members: shared ? parsedMembers : []
		};
		const error = validateService(draft);
		if (error) {
			toasts.error(error);
			return;
		}
		saving = true;
		try {
			await onsubmit(draft);
		} catch (failure) {
			toasts.error(messageFor(failure));
		} finally {
			saving = false;
		}
	}
</script>

<form class="grid gap-6 lg:grid-cols-[1fr_320px]" onsubmit={submit} novalidate>
	<div class="flex flex-col gap-6">
		<Card padding="lg">
			<h2 class="text-base font-extrabold">Servicio</h2>
			<div class="mt-4">
				<TextField
					label="Nombre"
					bind:value={name}
					icon={Type}
					placeholder="Netflix, GitHub, Claude…"
					maxlength={60}
				/>
			</div>
			<fieldset class="mt-4">
				<legend class="text-[13px] font-bold text-neutral">Color</legend>
				<div class="mt-2 flex flex-wrap gap-2">
					{#each SERVICE_COLORS as option (option)}
						<label class="cursor-pointer">
							<input
								type="radio"
								name="color"
								value={option}
								bind:group={color}
								class="peer sr-only"
							/>
							<span
								class="inline-flex size-9 items-center justify-center rounded-full text-white ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-primary"
								style="background:{option}"
							>
								{#if color === option}<Check size={16} strokeWidth={3} aria-hidden="true" />{/if}
							</span>
							<span class="sr-only">Color {option}</span>
						</label>
					{/each}
				</div>
			</fieldset>

			<h2 class="mt-7 text-base font-extrabold">Cobro</h2>
			<div class="mt-4 flex flex-col gap-4">
				<div>
					<p class="mb-1.5 text-[13px] font-bold text-neutral">Moneda</p>
					<CurrencySwitch
						bind:value={currency}
						disabled={Boolean(initial?.memberPayments.length)}
					/>
					{#if initial?.memberPayments.length}<p class="mt-2 text-xs text-muted">
							La moneda se conserva porque ya hay pagos registrados.
						</p>{/if}
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<MoneyField label="Monto mensual" bind:value={amountText} {currency} />
					<BillingDayPicker bind:value={billingDay} />
					<DatePicker label="Empecé a pagarlo el" bind:value={startedOn} />
					<SelectField
						label="Estado"
						bind:value={status}
						options={[
							{ value: 'active', label: 'Activo' },
							{ value: 'paused', label: 'Pausado' },
							{ value: 'cancelled', label: 'Cancelado' }
						]}
					/>
					{#if status === 'cancelled'}
						<DatePicker
							label="Último cobro"
							bind:value={endedOn}
							min={startedOn}
							class="sm:col-span-2"
						/>
					{/if}
				</div>
			</div>
		</Card>

		<Card padding="lg">
			<SwitchRow
				bind:checked={shared}
				label="Lo comparto con otras personas"
				description="Lleva la cuenta de quién te pagó cada mes."
			/>
			{#if !shared && initial?.members.length}<p
					class="mt-3 text-[13px] font-semibold text-orange-strong"
				>
					Al dejar de compartirlo se borrarán las personas y sus pagos registrados.
				</p>{/if}
			{#if shared}
				<div class="mt-5 flex flex-col gap-3">
					{#each members as member, i (member.id)}
						<div class="rounded-card border border-outline p-4">
							<div class="grid gap-3 sm:grid-cols-[1fr_160px]">
								<TextField
									label="Nombre"
									bind:value={member.name}
									icon={User}
									placeholder="Luis"
									maxlength={60}
								/>
								<MoneyField label="Paga al mes" bind:value={member.amount} {currency} />
							</div>
							<div class="mt-3 flex items-end gap-3">
								<MonthField
									label="Paga desde"
									bind:value={member.since}
									fromYear={Number(startedOn.slice(0, 4))}
									toYear={2100}
									class="flex-1"
								/>
								<IconButton
									icon={Trash2}
									label="Quitar a {member.name || 'esta persona'}"
									variant="danger"
									class="mb-1.5"
									onclick={() => members.splice(i, 1)}
								/>
							</div>
						</div>
					{/each}
					<div class="flex flex-wrap gap-2">
						<Button variant="soft" size="sm" icon={Plus} onclick={addMember}>Agregar persona</Button
						>
					</div>
					{#if initial && initial.members.some((m) => !members.find((x) => x.id === m.id))}
						<p class="text-[13px] font-semibold text-orange-strong">
							Al quitar a una persona se borran también sus pagos registrados.
						</p>
					{/if}
				</div>
			{/if}
		</Card>

		<Card padding="lg">
			<TextAreaField
				label="Nota (opcional)"
				bind:value={note}
				placeholder="Cuenta, plan, con qué tarjeta lo pagas…"
			/>
		</Card>
	</div>

	<aside class="lg:sticky lg:top-10 lg:self-start">
		<Card padding="lg">
			<div class="flex items-center gap-3">
				<ServiceIcon name={name || '?'} {color} />
				<div class="min-w-0">
					<p class="truncate font-extrabold">{name || 'Nuevo servicio'}</p>
					<p class="text-[13px] text-muted">Suscripción mensual</p>
				</div>
			</div>
			<dl class="tabular mt-5 flex flex-col gap-3 border-t border-divider pt-4 text-[15px]">
				<div class="flex justify-between gap-3">
					<dt class="text-muted">Costo al mes</dt>
					<dd class="font-bold">{formatMoney(amount, currency)}</dd>
				</div>
				{#if shared}
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Pagan los demás</dt>
						<dd class="font-bold">{formatMoney(amount - mine, currency)}</dd>
					</div>
					<div class="flex justify-between gap-3 border-t border-divider pt-3">
						<dt class="font-bold">Tu parte</dt>
						<dd class="text-lg font-extrabold {mine < 0 ? 'text-expense-strong' : ''}">
							{formatMoney(mine, currency)}
						</dd>
					</div>
				{/if}
			</dl>
			<Button type="submit" size="lg" block class="mt-6" loading={saving}>{submitLabel}</Button>
		</Card>
	</aside>
</form>
