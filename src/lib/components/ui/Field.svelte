<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		label: string;
		hint?: string;
		error?: string | null;
		/** Right side of the label row (e.g. "¿Olvidaste tu contraseña?"). */
		aside?: Snippet;
		class?: string;
		children: Snippet;
	}

	let { id, label, hint, error, aside, class: className = '', children }: Props = $props();
</script>

<div class="flex flex-col gap-1.5 {className}">
	<div class="flex items-center justify-between gap-2">
		<label for={id} class="text-[13px] font-bold text-neutral">{label}</label>
		{@render aside?.()}
	</div>
	{@render children()}
	{#if error}
		<p id="{id}-error" class="text-[13px] font-semibold text-expense-strong">{error}</p>
	{:else if hint}
		<p id="{id}-hint" class="text-[13px] text-muted">{hint}</p>
	{/if}
</div>
