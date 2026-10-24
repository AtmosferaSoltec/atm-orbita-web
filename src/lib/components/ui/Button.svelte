<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { LoaderCircle } from '@lucide/svelte';
	import type { IconComponent } from './types';

	type Variant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		/** Renders a link styled as a button. Pass an already resolved path. */
		href?: string;
		icon?: IconComponent;
		loading?: boolean;
		block?: boolean;
		children?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		href,
		icon: Icon,
		loading = false,
		block = false,
		type = 'button',
		disabled,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const VARIANTS: Record<Variant, string> = {
		primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20',
		secondary: 'bg-surface text-ink border border-outline hover:border-chip-border hover:bg-canvas',
		soft: 'bg-primary-soft text-primary hover:bg-primary/15',
		ghost: 'text-muted hover:bg-neutral-soft hover:text-ink',
		danger: 'bg-expense text-white hover:bg-expense-strong'
	};

	const SIZES: Record<Size, string> = {
		sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-xl',
		md: 'h-11 px-5 text-sm gap-2 rounded-[14px]',
		lg: 'h-14 px-6 text-[15px] gap-2 rounded-button'
	};

	const classes = $derived(
		[
			'inline-flex items-center justify-center font-bold whitespace-nowrap transition-colors select-none',
			'disabled:pointer-events-none disabled:opacity-50',
			VARIANTS[variant],
			SIZES[size],
			block ? 'w-full' : '',
			className
		].join(' ')
	);
	const iconSize = $derived(size === 'sm' ? 16 : 18);
</script>

{#snippet content()}
	{#if loading}
		<LoaderCircle size={iconSize} class="animate-spin" aria-hidden="true" />
	{:else if Icon}
		<Icon size={iconSize} strokeWidth={2.1} aria-hidden="true" />
	{/if}
	{@render children?.()}
{/snippet}

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass resolved paths -->
	<a {href} class={classes}>{@render content()}</a>
{:else}
	<button {type} class={classes} disabled={disabled || loading} aria-busy={loading} {...rest}>
		{@render content()}
	</button>
{/if}
