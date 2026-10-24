<script lang="ts">
	import { TONE_FILL, type Tone } from './types';

	interface Props {
		/** 0–100; values above 100 fill the bar. */
		value: number;
		tone?: Tone;
		label: string;
		size?: 'sm' | 'md';
		/** Track for dark (hero) backgrounds. */
		onDark?: boolean;
	}

	let { value, tone = 'primary', label, size = 'md', onDark = false }: Props = $props();

	const width = $derived(Math.max(0, Math.min(value, 100)));
</script>

<div
	class="w-full overflow-hidden rounded-full {size === 'sm' ? 'h-1.5' : 'h-2.5'} {onDark
		? 'bg-white/20'
		: 'bg-neutral-soft'}"
	role="progressbar"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-valuenow={Math.round(width)}
>
	<div
		class="h-full rounded-full transition-[width] duration-500 {onDark
			? 'bg-white'
			: TONE_FILL[tone]}"
		style="width:{width}%"
	></div>
</div>
