<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Makes the whole card a link. Pass an already resolved path. */
		href?: string;
		padding?: 'none' | 'sm' | 'md' | 'lg';
		class?: string;
		children: Snippet;
	}

	let { href, padding = 'md', class: className = '', children }: Props = $props();

	const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6 sm:p-7' };
	const classes = $derived(
		`block rounded-card border border-outline/70 bg-surface shadow-card ${PADDING[padding]} ${
			href ? 'transition hover:-translate-y-px hover:border-chip-border hover:shadow-pop/40' : ''
		} ${className}`
	);
</script>

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass resolved paths -->
	<a {href} class={classes}>{@render children()}</a>
{:else}
	<section class={classes}>{@render children()}</section>
{/if}
