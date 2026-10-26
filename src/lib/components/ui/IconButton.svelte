<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { IconComponent } from './types';

	interface Props extends HTMLButtonAttributes {
		icon: IconComponent;
		label: string;
		href?: string;
		variant?: 'surface' | 'ghost' | 'danger';
		size?: 'sm' | 'md';
	}

	let {
		icon: Icon,
		label,
		href,
		variant = 'surface',
		size = 'md',
		type = 'button',
		class: className = '',
		...rest
	}: Props = $props();

	const VARIANTS = {
		surface: 'bg-surface border border-outline text-ink hover:bg-canvas',
		ghost: 'text-muted hover:bg-neutral-soft hover:text-ink',
		danger: 'text-muted hover:bg-expense-soft hover:text-expense-strong'
	};

	// 'sm' is for compact rows (the footer of a monthly-plan card); 'md' keeps the 40px target.
	const SIZES = { sm: 'size-8', md: 'size-10' };
	const iconSize = $derived(size === 'sm' ? 16 : 19);

	const classes = $derived(
		`inline-flex ${SIZES[size]} shrink-0 items-center justify-center rounded-full transition-colors ${VARIANTS[variant]} ${className}`
	);
</script>

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass resolved paths -->
	<a {href} class={classes} aria-label={label} title={label}>
		<Icon size={iconSize} strokeWidth={2} aria-hidden="true" />
	</a>
{:else}
	<button {type} class={classes} aria-label={label} title={label} {...rest}>
		<Icon size={iconSize} strokeWidth={2} aria-hidden="true" />
	</button>
{/if}
