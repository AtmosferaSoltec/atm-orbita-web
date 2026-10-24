<script lang="ts" generics="T extends string | number">
	interface Props {
		value: T;
		options: { value: T; label: string }[];
		label: string;
		size?: 'sm' | 'md';
		block?: boolean;
		onDark?: boolean;
		onchange?: (value: T) => void;
	}

	let {
		value = $bindable(),
		options,
		label,
		size = 'md',
		block = false,
		onDark = false,
		onchange
	}: Props = $props();

	function select(option: T) {
		value = option;
		onchange?.(option);
	}
</script>

<!-- Pill with 2–3 options, the selected one on white (ORBITA_SPEC §5). -->
<div
	role="radiogroup"
	aria-label={label}
	class="inline-flex rounded-pill p-1 {onDark ? 'bg-white/15' : 'bg-neutral-soft'} {block
		? 'flex w-full'
		: ''}"
>
	{#each options as option (option.value)}
		{@const active = option.value === value}
		<button
			type="button"
			role="radio"
			aria-checked={active}
			onclick={() => select(option.value)}
			class="rounded-pill font-bold whitespace-nowrap transition-all {size === 'sm'
				? 'h-8 px-3 text-[13px]'
				: 'h-10 px-4 text-sm'} {block ? 'flex-1' : ''} {active
				? 'bg-white text-ink shadow-sm'
				: onDark
					? 'text-white/80 hover:text-white'
					: 'text-muted hover:text-ink'}"
		>
			{option.label}
		</button>
	{/each}
</div>
