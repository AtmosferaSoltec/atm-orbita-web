<script lang="ts">
	import { Button, Modal, MoneyField } from '#lib/components/ui/index.ts';
	import { parseAmount, toInputValue } from '#lib/domain/money.ts';
	import { messageFor } from '#lib/api/errors.ts';
	import { receipts } from '#lib/stores/receipts.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	interface Props {
		open: boolean;
		year: number;
	}

	let { open = $bindable(), year }: Props = $props();

	let value = $state('');
	let error = $state<string | null>(null);
	let saving = $state(false);

	$effect(() => {
		if (open) {
			value = toInputValue(receipts.limitFor(year));
			error = null;
		}
	});

	async function save() {
		const limit = parseAmount(value);
		if (!limit) {
			error = 'Escribe un monto mayor que cero.';
			return;
		}
		saving = true;
		try {
			await receipts.setLimit(year, limit);
			open = false;
			toasts.success(`Tope de ${year} actualizado.`);
		} catch (failure) {
			error = messageFor(failure);
		} finally {
			saving = false;
		}
	}
</script>

<Modal
	bind:open
	title="Tope anual de {year}"
	description="El monto bruto máximo que quieres emitir en recibos por honorarios este año."
	size="sm"
>
	<MoneyField label="Tope anual" bind:value {error} />
	{#snippet footer()}
		<Button variant="secondary" block onclick={() => (open = false)}>Cancelar</Button>
		<Button block loading={saving} onclick={save}>Guardar</Button>
	{/snippet}
</Modal>
