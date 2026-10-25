<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { loans } from '#lib/stores/loans.svelte.ts';
	import LoansStatus from '#lib/components/loans/LoansStatus.svelte';
	let { children }: { children: Snippet } = $props();
	onMount(() => {
		void loans.load();
	});
</script>

<LoansStatus />
{#if loans.loaded}{@render children()}{/if}
