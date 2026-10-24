<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { PageHeader } from '#lib/components/ui/index.ts';
	import ServiceForm from '#lib/components/services/ServiceForm.svelte';
	import { services } from '#lib/stores/services.svelte.ts';
	import { newId } from '#lib/data/storage.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';
	const creationId = newId();
</script>

<svelte:head><title>Nuevo servicio · Orbita</title></svelte:head>

<PageHeader
	title="Nuevo servicio"
	subtitle="Algo que pagas cada mes."
	back={resolve('/(app)/services')}
/>

<ServiceForm
	submitLabel="Guardar servicio"
	onsubmit={async (draft) => {
		const service = await services.add(draft, creationId);
		toasts.success('Servicio guardado.');
		await goto(resolve('/(app)/services/[id]', { id: service.id }), { replaceState: true });
	}}
/>
