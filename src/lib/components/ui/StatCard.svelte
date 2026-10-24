<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronRight } from '@lucide/svelte';
	import Card from './Card.svelte';
	import IconBadge from './IconBadge.svelte';
	import { TONE_TEXT, type IconComponent, type Tone } from './types';

	interface Props {
		icon: IconComponent;
		tone?: Tone;
		label: string;
		value: string;
		/** Colors the value with the tone (amounts of income/expense). */
		colorValue?: boolean;
		hint?: string;
		href?: string;
		footer?: Snippet;
	}

	let {
		icon,
		tone = 'primary',
		label,
		value,
		colorValue = false,
		hint,
		href,
		footer
	}: Props = $props();
</script>

<Card {href} class="h-full">
	<div class="flex items-center gap-3.5">
		<IconBadge {icon} {tone} />
		<div class="min-w-0 flex-1">
			<p class="text-sm font-bold text-muted">{label}</p>
			<p class="tabular truncate text-xl font-extrabold {colorValue ? TONE_TEXT[tone] : ''}">
				{value}
			</p>
		</div>
		{#if href}<ChevronRight size={18} class="shrink-0 text-muted-light" aria-hidden="true" />{/if}
	</div>
	{#if hint}<p class="mt-3 text-[13px] text-muted">{hint}</p>{/if}
	{#if footer}<div class="mt-3">{@render footer()}</div>{/if}
</Card>
