<script lang="ts">
	import { ArrowDownLeft, ArrowUpRight, HandCoins, Pencil, Trash2 } from '@lucide/svelte';
	import { EmptyState, IconBadge, IconButton } from '#lib/components/ui/index.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatDate, formatMonth } from '#lib/domain/dates.ts';
	import type { LoanMovement } from '#lib/domain/loans.ts';
	let {
		movements,
		onedit,
		onremove
	}: {
		movements: LoanMovement[];
		onedit?: (m: LoanMovement) => void;
		onremove?: (m: LoanMovement) => void;
	} = $props();
</script>

{#if movements.length}
	<ul class="divide-y divide-divider">
		{#each movements as movement (movement.id)}
			{@const payment = movement.kind === 'payment'}
			<li class="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
				<IconBadge
					icon={payment ? ArrowDownLeft : ArrowUpRight}
					tone={payment ? 'income' : 'primary'}
					size="sm"
				/>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-extrabold">
						{payment ? 'Abono recibido' : movement.title || 'Préstamo añadido'}
					</p>
					<p class="mt-0.5 text-xs text-muted">{formatDate(movement.date)}</p>
					{#if payment}<p class="mt-1 text-xs font-semibold text-primary">
							{movement.appliedMonth
								? `Aplicado a ${formatMonth(movement.appliedMonth).toLowerCase()}`
								: 'Sin mes asignado'}
						</p>{/if}
					{#if movement.note}<p class="mt-1 text-sm break-words whitespace-pre-wrap text-muted">
							{movement.note}
						</p>{/if}
				</div>
				<p class="tabular text-right text-sm font-extrabold {payment ? 'text-income-strong' : ''}">
					{formatMoney(movement.amount, movement.currency)}
				</p>
				{#if onedit && onremove}<div class="flex w-full justify-end gap-1 pl-12 sm:w-auto sm:pl-0">
						<IconButton
							icon={Pencil}
							label="Editar movimiento"
							variant="ghost"
							onclick={() => onedit?.(movement)}
						/><IconButton
							icon={Trash2}
							label="Eliminar movimiento"
							variant="danger"
							onclick={() => onremove?.(movement)}
						/>
					</div>{/if}
			</li>
		{/each}
	</ul>
{:else}<EmptyState
		icon={HandCoins}
		title="Sin movimientos"
		text="Aquí aparecerán los préstamos y los abonos que registres."
	/>{/if}
