<script lang="ts">
	import { untrack } from 'svelte';
	import { CalendarDays, Check, Plus, Trash2, Type, User } from '@lucide/svelte';
	import {
		Button,
		Card,
		IconButton,
		MoneyField,
		MonthField,
		SegmentedControl,
		SelectField,
		SwitchRow,
		TextAreaField,
		TextField
	} from '#lib/components/ui/index.ts';
	import ServiceIcon from './ServiceIcon.svelte';
	import {
		formatMoney,
		parseAmount,
		splitEvenly,
		toInputValue,
		type Currency
	} from '#lib/domain/money.ts';
	import { toMonthKey, todayIso, type MonthKey } from '#lib/domain/dates.ts';
	import {
		SERVICE_CATEGORIES,
		SERVICE_COLORS,
		myShare,
		validateService,
		type Service,
		type ServiceDraft,
		type ServiceStatus
	} from '#lib/domain/services.ts';
	import { newId } from '#lib/data/storage.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	interface Props {
		initial?: Service;
		submitLabel: string;
		onsubmit: (draft: ServiceDraft) => void;
	}

	let { initial, submitLabel, onsubmit }: Props = $props();

	interface MemberInput {
		id: string;
		name: string;
		amount: string;
		since: MonthKey;
	}

	const start = untrack(() => initial);
	const today = todayIso();

	let name = $state(start?.name ?? '');
	let category = $state(start?.category ?? SERVICE_CATEGORIES[0]);
	let color = $state(start?.color ?? SERVICE_COLORS[0]);
	let currency = $state<Currency>(start?.currency ?? 'PEN');
	let amountText = $state(toInputValue(start?.amount));
	let billingDay = $state(String(start?.billingDay ?? Number(today.slice(8, 10))));
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
		members.push({ id: newId(), name: '', amount: '', since: toMonthKey(today) });
	}

	/** Everyone pays the same, me included; I absorb the rounding. */
	function splitEqually() {
		const shares = splitEvenly(amount, members.length + 1);
		members.forEach((m, i) => (m.amount = toInputValue(shares[members.length - i])));
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const draft: ServiceDraft = {
			name: name.trim(),
			category,
			color,
			currency,
			amount,
			billingDay: Number(billingDay),
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
		onsubmit(draft);
	}
</script>

<form class="grid gap-6 lg:grid-cols-[1fr_320px]" onsubmit={submit} novalidate>
	<div class="flex flex-col gap-6">
		<Card padding="lg">
			<h2 class="text-base font-extrabold">Servicio</h2>
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<TextField
					label="Nombre"
					bind:value={name}
					icon={Type}
					placeholder="Netflix, GitHub, Claude…"
					maxlength={60}
				/>
				<SelectField
					label="Categoría"
					bind:value={category}
					options={SERVICE_CATEGORIES.map((c) => ({ value: c, label: c }))}
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
					<MoneyField label="Monto mensual" bind:value={amountText} {currency} />
					<SelectField
						label="Día de cobro"
						bind:value={billingDay}
						options={Array.from({ length: 31 }, (_, i) => ({
							value: String(i + 1),
							label: `Día ${i + 1}`
						}))}
					/>
					<TextField
						label="Empecé a pagarlo el"
						type="date"
						bind:value={startedOn}
						icon={CalendarDays}
					/>
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
						<TextField
							label="Último cobro"
							type="date"
							bind:value={endedOn}
							icon={CalendarDays}
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
								<MonthField label="Paga desde" bind:value={member.since} class="flex-1" />
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
						{#if members.length && amount}
							<Button variant="ghost" size="sm" onclick={splitEqually}
								>Repartir en partes iguales</Button
							>
						{/if}
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
					<p class="text-[13px] text-muted">{category}</p>
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
			<Button type="submit" size="lg" block class="mt-6">{submitLabel}</Button>
		</Card>
	</aside>
</form>
