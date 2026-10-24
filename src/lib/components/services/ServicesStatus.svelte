<script lang="ts">
	import { services } from '#lib/stores/services.svelte.ts';
	import { Button, Card } from '#lib/components/ui/index.ts';
</script>

{#if services.error}
	<Card class="mb-5">
		<div role="alert" class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="font-bold">No pudimos cargar tus servicios</p>
				<p class="mt-1 text-sm text-muted">{services.error}</p>
			</div>
			<Button variant="secondary" loading={services.loading} onclick={() => services.load(true)}
				>Reintentar</Button
			>
		</div>
	</Card>
{:else if services.loading && !services.loaded}
	<p role="status" class="py-8 text-center text-sm text-muted">Cargando tus servicios…</p>
{/if}
