<script lang="ts">
	import type { Snippet } from 'svelte';
	import { TONE_SOFT, type IconComponent, type Tone } from './types';

	interface Props {
		tone?: Tone;
		icon?: IconComponent;
		children: Snippet;
	}

	let { tone = 'neutral', icon: Icon, children }: Props = $props();
</script>

<span
	class="inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-bold whitespace-nowrap {TONE_SOFT[
		tone
	]}"
>
	{#if Icon}<Icon size={13} strokeWidth={2.4} aria-hidden="true" />{/if}
	{@render children()}
</span>
