<script lang="ts">
	import ServicesStatus from '#lib/components/services/ServicesStatus.svelte';
	import { messageFor } from '#lib/api/errors.ts';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { FileQuestion, Pencil, StickyNote, Trash2, Users } from '@lucide/svelte';
	import {
		Badge,
		Button,
		Card,
		ConfirmDialog,
		EmptyState,
		IconButton,
		PageHeader
	} from '#lib/components/ui/index.ts';
	import MarkPaidModal from '#lib/components/services/MarkPaidModal.svelte';
	import MemberCard from '#lib/components/services/MemberCard.svelte';
	import ServiceIcon from '#lib/components/services/ServiceIcon.svelte';
	import { SERVICE_STATUS } from '#lib/components/services/labels.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatDate, formatMonth, relativeDays } from '#lib/domain/dates.ts';
	import {
		chargeDates,
		lastChargeDate,
		membersStatus,
		myShare,
		nextChargeDate,
		totalSpent,
		type MemberMonth,
		type MemberStatus
	} from '#lib/domain/services.ts';
	import { services } from '#lib/stores/services.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	const today = $derived(services.today);
	const service = $derived(services.get(page.params.id ?? ''));
	const members = $derived(service ? membersStatus(service, today) : []);
	const next = $derived(service ? nextChargeDate(service, today) : null);
	const last = $derived(service ? lastChargeDate(service, today) : null);

	let paying = $state(false);
	let payingStatus = $state<MemberStatus | null>(null);
	let confirmDelete = $state(false);
	let undoTarget = $state<{ status: MemberStatus; month: MemberMonth } | null>(null);
	let confirmUndo = $state(false);

	function openPay(status: MemberStatus) {
		payingStatus = status;
		paying = true;
	}

	async function toggleMonth(status: MemberStatus, month: MemberMonth) {
		if (!service) return;
		if (month.status === 'paid') {
			undoTarget = { status, month };
			confirmUndo = true;
		} else if (month.status === 'owed') {
			try {
				await services.markPaid(service.id, [
					{
						memberId: status.member.id,
						month: month.month,
						paidOn: today,
						amount: status.member.amount
					}
				]);
				toasts.success(`${status.member.name}: ${formatMonth(month.month).toLowerCase()} pagado.`);
			} catch (failure) {
				toasts.error(messageFor(failure));
			}
		}
	}

	async function remove() {
		if (!service) return;
		try {
			await services.remove(service.id);
			toasts.success('Servicio eliminado.');
			await goto(resolve('/(app)/services'), { replaceState: true });
		} catch (failure) {
			toasts.error(messageFor(failure));
		}
	}
</script>

<svelte:head><title>Servicio · Orbita</title></svelte:head>

<ServicesStatus />
{#if service}
	<PageHeader title={service.name} subtitle="Suscripción mensual" back={resolve('/(app)/services')}>
		{#snippet actions()}
			<IconButton
				icon={Trash2}
				label="Eliminar servicio"
				variant="danger"
				onclick={() => (confirmDelete = true)}
			/>
			<Button
				href={resolve('/(app)/services/[id]/edit', { id: service.id })}
				variant="secondary"
				icon={Pencil}>Editar</Button
			>
		{/snippet}
	</PageHeader>

	<div class="grid gap-5 lg:grid-cols-[340px_1fr]">
		<aside class="flex flex-col gap-5 lg:self-start">
			<Card padding="lg">
				<div class="flex items-center gap-3.5">
					<ServiceIcon name={service.name} color={service.color} size="lg" />
					<div>
						<p class="tabular text-2xl font-extrabold">
							{formatMoney(service.amount, service.currency)}
						</p>
						<p class="text-[13px] text-muted">al mes · día {service.billingDay}</p>
					</div>
				</div>
				<div class="mt-4">
					<Badge tone={SERVICE_STATUS[service.status].tone}
						>{SERVICE_STATUS[service.status].label}</Badge
					>
				</div>
				<dl class="mt-5 flex flex-col gap-3 border-t border-divider pt-4 text-sm">
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Próximo cobro</dt>
						<dd class="text-right font-bold">
							{next ? `${formatDate(next)} (${relativeDays(next, today)})` : '—'}
						</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Último cobro</dt>
						<dd class="font-bold">{last ? formatDate(last) : 'Aún no se cobra'}</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Pagando desde</dt>
						<dd class="font-bold">{formatDate(service.startedOn)}</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Llevas pagado</dt>
						<dd class="tabular text-right font-bold">
							{formatMoney(totalSpent(service, today), service.currency)}
							<span class="block text-xs font-medium text-muted"
								>{chargeDates(service, today).length} cobros</span
							>
						</dd>
					</div>
					{#if service.shared}
						<div class="flex justify-between gap-3 border-t border-divider pt-3">
							<dt class="font-bold">Tu parte al mes</dt>
							<dd class="tabular font-extrabold">
								{formatMoney(myShare(service), service.currency)}
							</dd>
						</div>
					{/if}
				</dl>
				{#if service.note}
					<p class="mt-4 flex items-start gap-2 border-t border-divider pt-4 text-sm text-muted">
						<StickyNote size={16} class="mt-0.5 shrink-0" aria-hidden="true" />
						{service.note}
					</p>
				{/if}
			</Card>
		</aside>

		<section class="min-w-0">
			<h2 class="text-base font-extrabold">Personas con quienes lo compartes</h2>
			{#if service.shared && members.length}
				<p class="mt-1 text-[13px] text-muted">
					Toca un mes para marcarlo como pagado hoy, o uno pagado para deshacerlo.
				</p>
				<div class="mt-4 flex flex-col gap-4">
					{#each members as status (status.member.id)}
						<MemberCard
							{status}
							currency={service.currency}
							onpay={() => openPay(status)}
							ontoggle={(month) => toggleMonth(status, month)}
						/>
					{/each}
				</div>
			{:else}
				<Card class="mt-4">
					<EmptyState
						icon={Users}
						tone="neutral"
						title="No lo compartes con nadie"
						text="Si alguien te paga una parte, edítalo y activa «Lo comparto con otras personas»."
					>
						{#snippet action()}
							<Button
								href={resolve('/(app)/services/[id]/edit', { id: service.id })}
								variant="secondary"
							>
								Compartir servicio
							</Button>
						{/snippet}
					</EmptyState>
				</Card>
			{/if}
		</section>
	</div>

	<MarkPaidModal bind:open={paying} {service} status={payingStatus} />
	<ConfirmDialog
		bind:open={confirmDelete}
		title="¿Eliminar este servicio?"
		text="Se borrarán también los pagos registrados de las personas con quienes lo compartes."
		onconfirm={remove}
	/>
	<ConfirmDialog
		bind:open={confirmUndo}
		title="¿Marcar como no pagado?"
		text={undoTarget
			? `${undoTarget.status.member.name} · ${formatMonth(undoTarget.month.month)}`
			: ''}
		confirmLabel="Deshacer pago"
		onconfirm={async () => {
			if (!undoTarget) return;
			try {
				await services.unmarkPaid(service.id, undoTarget.status.member.id, undoTarget.month.month);
				toasts.success('Pago deshecho.');
			} catch (failure) {
				toasts.error(messageFor(failure));
			}
		}}
	/>
{:else if !services.error && services.loaded}
	<Card>
		<EmptyState icon={FileQuestion} tone="neutral" title="Este registro ya no existe.">
			{#snippet action()}<Button href={resolve('/(app)/services')}>Volver a servicios</Button
				>{/snippet}
		</EmptyState>
	</Card>
{/if}
