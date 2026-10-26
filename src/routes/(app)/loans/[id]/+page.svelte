<script lang="ts">
	import { messageFor } from '#lib/api/errors.ts';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ArrowDownLeft, HandCoins, Pencil, Plus, Trash2 } from '@lucide/svelte';
	import {
		Button,
		Card,
		ConfirmDialog,
		EmptyState,
		IconButton,
		PageHeader,
		SegmentedControl
	} from '#lib/components/ui/index.ts';
	import LoanOverview from '#lib/components/loans/LoanOverview.svelte';
	import MovementList from '#lib/components/loans/MovementList.svelte';
	import MovementModal from '#lib/components/loans/MovementModal.svelte';
	import MonthlyPlan from '#lib/components/loans/MonthlyPlan.svelte';
	import DebtorPlanModal from '#lib/components/loans/DebtorPlanModal.svelte';
	import ShareLinkCard from '#lib/components/loans/ShareLinkCard.svelte';
	import {
		balancesOf,
		sortedMovements,
		type LoanMovement,
		type MovementKind
	} from '#lib/domain/loans.ts';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
	const debtor = $derived(loans.get(page.params.id ?? ''));
	const balances = $derived(debtor ? balancesOf(debtor) : []);
	const currency = $derived(debtor?.currency ?? 'PEN');
	const balance = $derived(balances.find((b) => b.currency === currency));
	let filter = $state<'all' | 'loan' | 'payment'>('all');
	const movements = $derived(
		debtor
			? sortedMovements(debtor).filter(
					(m) => m.currency === currency && (filter === 'all' || m.kind === filter)
				)
			: []
	);
	let movementOpen = $state(false);
	let planOpen = $state(false);
	let selectedPlanMonth = $state<string | null>(null);
	let kind = $state<MovementKind>('loan');
	let editing = $state<LoanMovement | null>(null);
	let deleteDebtor = $state(false);
	let deleteMovement = $state(false);
	let removing = $state<LoanMovement | null>(null);
	function add(type: MovementKind) {
		kind = type;
		editing = null;
		movementOpen = true;
	}
	function edit(m: LoanMovement) {
		kind = m.kind;
		editing = m;
		movementOpen = true;
	}
	function remove(m: LoanMovement) {
		removing = m;
		deleteMovement = true;
	}
</script>

<svelte:head><title>{debtor?.name ?? 'Deudor'} · Préstamos · Orbita</title></svelte:head>
{#if debtor}
	<PageHeader
		title={debtor.name}
		subtitle={`Su cuenta de préstamos y abonos en ${currency === 'PEN' ? 'soles' : 'dólares'}.`}
		back={resolve('/(app)/loans')}
	>
		{#snippet actions()}<IconButton
				icon={Pencil}
				label="Editar nombre"
				href={resolve('/(app)/loans/[id]/edit', { id: debtor.id })}
			/><IconButton
				icon={Trash2}
				label="Eliminar deudor"
				variant="danger"
				onclick={() => (deleteDebtor = true)}
			/><Button variant="secondary" icon={Plus} onclick={() => add('loan')}>Añadir préstamo</Button
			><Button
				icon={ArrowDownLeft}
				disabled={!balance || balance.balance <= 0}
				onclick={() => add('payment')}>Registrar abono</Button
			>{/snippet}
	</PageHeader>
	{#if balance}<LoanOverview {balance} />{:else}<Card
			><EmptyState
				icon={HandCoins}
				title="La ficha está lista"
				text="Añade el primer préstamo. Después podrás registrar abonos del monto que recibas."
				>{#snippet action()}<Button icon={Plus} onclick={() => add('loan')}
						>Añadir primer préstamo</Button
					>{/snippet}</EmptyState
			></Card
		>{/if}
	<MonthlyPlan
		{debtor}
		oneditplan={(month) => {
			selectedPlanMonth = month ?? null;
			planOpen = true;
		}}
	/>
	<div class="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
		<Card padding="none" class="min-w-0 overflow-hidden">
			<div class="border-b border-divider p-5">
				<h2 class="text-base font-extrabold">Movimientos</h2>
				<p class="mt-1 mb-4 text-xs text-muted">
					Cada préstamo suma. Cada abono reduce el saldo en su moneda.
				</p>
				<SegmentedControl
					bind:value={filter}
					label="Filtrar movimientos"
					size="sm"
					options={[
						{ value: 'all', label: 'Todos' },
						{ value: 'loan', label: 'Préstamos' },
						{ value: 'payment', label: 'Abonos' }
					]}
				/>
			</div>
			<MovementList {movements} onedit={edit} onremove={remove} />
		</Card>
		<aside class="space-y-4">
			<ShareLinkCard {debtor} />
		</aside>
	</div>
	<MovementModal bind:open={movementOpen} {debtor} {kind} {editing} />
	<DebtorPlanModal bind:open={planOpen} {debtor} initialMonth={selectedPlanMonth} />
	<ConfirmDialog
		bind:open={deleteDebtor}
		title="¿Eliminar deudor?"
		text="Se eliminará la ficha de {debtor.name} junto con todos sus préstamos y abonos de este navegador."
		onconfirm={async () => {
			try {
				await loans.remove(debtor.id);
			} catch (failure) {
				toasts.error(messageFor(failure));
				return;
			}
			toasts.success('Deudor eliminado.');
			await goto(resolve('/(app)/loans'));
		}}
	/>
	<ConfirmDialog
		bind:open={deleteMovement}
		title="¿Eliminar movimiento?"
		text="El saldo se recalculará. Un préstamo solo puede eliminarse si los abonos restantes siguen cubiertos por lo prestado."
		onconfirm={async () => {
			if (!removing) return;
			const error = await loans.removeMovement(debtor.id, removing.id);
			if (error) toasts.error(error);
			else toasts.success('Movimiento eliminado.');
			removing = null;
		}}
	/>
{:else}<PageHeader title="Deudor no encontrado" back={resolve('/(app)/loans')} /><Card
		><EmptyState
			icon={HandCoins}
			title="Esta ficha no está disponible"
			text="Puede haberse eliminado o pertenecer a otro navegador."
		/></Card
	>{/if}
