<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { FileQuestion } from '@lucide/svelte';
	import { Button, Card, EmptyState, PageHeader } from '#lib/components/ui/index.ts';
	import ServiceForm from '#lib/components/services/ServiceForm.svelte';
	import { services } from '#lib/stores/services.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	const service = $derived(services.get(page.params.id ?? ''));
</script>

<svelte:head><title>Editar servicio · Orbita</title></svelte:head>

{#if service}
	<PageHeader
		title="Editar servicio"
		subtitle={service.name}
		back={resolve('/(app)/services/[id]', { id: service.id })}
	/>
	{#key service.id}
		<ServiceForm
			initial={service}
			submitLabel="Guardar cambios"
			onsubmit={async (draft) => {
				services.update(service.id, draft);
				toasts.success('Cambios guardados.');
				await goto(resolve('/(app)/services/[id]', { id: service.id }), { replaceState: true });
			}}
		/>
	{/key}
{:else}
	<Card>
		<EmptyState icon={FileQuestion} tone="neutral" title="Este registro ya no existe.">
			{#snippet action()}<Button href={resolve('/(app)/services')}>Volver a servicios</Button
				>{/snippet}
		</EmptyState>
	</Card>
{/if}
