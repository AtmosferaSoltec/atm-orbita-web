<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { IconComponent } from './types';

	interface Props extends HTMLButtonAttributes {
		icon: IconComponent;
		label: string;
		href?: string;
		variant?: 'surface' | 'ghost' | 'danger';
	}

	let {
		icon: Icon,
		label,
		href,
		variant = 'surface',
		type = 'button',
		class: className = '',
		...rest
	}: Props = $props();

	const VARIANTS = {
		surface: 'bg-surface border border-outline text-ink hover:bg-canvas',
		ghost: 'text-muted hover:bg-neutral-soft hover:text-ink',
		danger: 'text-muted hover:bg-expense-soft hover:text-expense-strong'
	};

	const classes = $derived(
		`inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors ${VARIANTS[variant]} ${className}`
	);
</script>

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass resolved paths -->
	<a {href} class={classes} aria-label={label} title={label}>
		<Icon size={19} strokeWidth={2} aria-hidden="true" />
	</a>
{:else}
	<button {type} class={classes} aria-label={label} title={label} {...rest}>
		<Icon size={19} strokeWidth={2} aria-hidden="true" />
	</button>
{/if}
