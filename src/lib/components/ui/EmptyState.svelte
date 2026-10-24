<script lang="ts">
	import type { Snippet } from 'svelte';
	import IconBadge from './IconBadge.svelte';
	import type { IconComponent, Tone } from './types';

	interface Props {
		icon: IconComponent;
		title: string;
		text?: string;
		tone?: Tone;
		action?: Snippet;
	}

	let { icon, title, text, tone = 'primary', action }: Props = $props();
</script>

<div class="flex flex-col items-center px-6 py-12 text-center">
	<IconBadge {icon} {tone} size="lg" />
	<h3 class="mt-4 text-base font-extrabold">{title}</h3>
	{#if text}<p class="mt-1 max-w-sm text-sm text-muted">{text}</p>{/if}
	{#if action}<div class="mt-5">{@render action()}</div>{/if}
</div>
