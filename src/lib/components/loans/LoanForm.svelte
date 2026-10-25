<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { UserRound, ArrowRight, HandCoins } from '@lucide/svelte';
	import { Button, Card, TextField, IconBadge } from '#lib/components/ui/index.ts';
	import CurrencySwitch from '#lib/components/ui/CurrencySwitch.svelte';
	import type { Currency } from '#lib/domain/money.ts';
	import { messageFor } from '#lib/api/errors.ts';
	import { validateDebtorName } from '#lib/domain/loans.ts';
	let {
		initial = '',
		initialCurrency = 'PEN',
		currencyLocked = false,
		submitLabel = 'Crear deudor',
		onsubmit
	}: {
		initial?: string;
		initialCurrency?: Currency;
		currencyLocked?: boolean;
		submitLabel?: string;
		onsubmit: (name: string, currency: Currency) => Promise<string | null | void>;
	} = $props();
	let name = $state(untrack(() => initial));
	let currency = $state<Currency>(untrack(() => initialCurrency));
	let error = $state<string | null>(null);
	let busy = $state(false);
	async function save(event: SubmitEvent) {
		event.preventDefault();
		error = validateDebtorName(name);
		if (error || busy) return;
		busy = true;
		try {
			error = (await onsubmit(name.trim(), currency)) ?? null;
		} catch (failure) {
			error = messageFor(failure);
		} finally {
			busy = false;
		}
	}
</script>

<div class="grid max-w-4xl gap-5 lg:grid-cols-[1.4fr_1fr]">
	<Card padding="lg">
		<form onsubmit={save} class="space-y-6">
			<TextField
				label="Nombre"
				bind:value={name}
				maxlength={60}
				placeholder="Por ejemplo, Gerson"
				icon={UserRound}
				disabled={busy}
				{error}
				autocomplete="off"
			/>

			{#if currencyLocked}
				<p class="rounded-xl bg-canvas px-4 py-3 text-sm font-semibold">
					Moneda: {currency === 'PEN' ? 'Soles (S/)' : 'Dólares (US$)'}
				</p>
			{:else}<CurrencySwitch bind:value={currency} disabled={busy} />{/if}
			<p class="text-xs leading-relaxed text-muted">
				La moneda se mantiene en todos sus préstamos y abonos. Para otra moneda, crea otra ficha de
				deudor.
			</p>
			<p class="text-sm leading-relaxed text-muted">
				Después podrás añadir el dinero que le prestaste y registrar cada abono desde su ficha.
			</p>
			<div class="flex flex-wrap gap-3">
				<Button type="submit" icon={ArrowRight} loading={busy}>{submitLabel}</Button><Button
					variant="secondary"
					href={resolve('/(app)/loans')}>Cancelar</Button
				>
			</div>
		</form>
	</Card>
	<div class="rounded-card bg-primary-soft p-6">
		<IconBadge icon={HandCoins} />
		<h2 class="mt-4 text-base font-extrabold">Una persona, un saldo claro</h2>
		<p class="mt-2 text-sm leading-relaxed text-muted">
			Suma los préstamos que le hagas. Resta cada abono, del monto que sea. Siempre sabrás cuánto te
			falta cobrar.
		</p>
	</div>
</div>
