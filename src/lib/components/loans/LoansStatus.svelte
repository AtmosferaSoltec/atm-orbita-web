<script lang="ts">
	import { loans } from '#lib/stores/loans.svelte.ts';
	import { Button, Card } from '#lib/components/ui/index.ts';
</script>

{#if loans.error}<Card class="mb-5"
		><div role="alert" class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="font-bold">No pudimos cargar tus préstamos</p>
				<p class="mt-1 text-sm text-muted">{loans.error}</p>
			</div>
			<Button variant="secondary" loading={loans.loading} onclick={() => loans.load(true)}
				>Reintentar</Button
			>
		</div></Card
	>{:else if loans.loading && !loans.loaded}<p
		role="status"
		class="py-8 text-center text-sm text-muted"
	>
		Cargando tus préstamos…
	</p>{/if}
