<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronLeft } from '@lucide/svelte';
	import IconButton from './IconButton.svelte';

	interface Props {
		title: string;
		subtitle?: string;
		/** Back link (already resolved). */
		back?: string;
		actions?: Snippet;
	}

	let { title, subtitle, back, actions }: Props = $props();
</script>

<header class="mb-6 flex flex-wrap items-start gap-x-4 gap-y-3">
	{#if back}
		<IconButton icon={ChevronLeft} label="Volver" href={back} class="mt-0.5" />
	{/if}
	<div class="min-w-0 flex-1">
		<h1 class="text-2xl leading-tight font-extrabold tracking-tight sm:text-[26px]">{title}</h1>
		{#if subtitle}<p class="mt-1 text-sm text-muted">{subtitle}</p>{/if}
	</div>
	{#if actions}
		<div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">{@render actions()}</div>
	{/if}
</header>
