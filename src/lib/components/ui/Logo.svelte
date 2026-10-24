<script lang="ts">
	interface Props {
		size?: 'sm' | 'md';
		onDark?: boolean;
	}

	let { size = 'md', onDark = false }: Props = $props();
</script>

<span class="inline-flex items-center gap-2.5">
	<span
		class="hero-savings relative inline-flex items-center justify-center rounded-xl shadow-md shadow-violet/30 {size ===
		'sm'
			? 'size-8'
			: 'size-9'}"
		aria-hidden="true"
	>
		<svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="white" stroke-width="2">
			<circle cx="12" cy="12" r="3.2" fill="white" stroke="none" />
			<ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-25 12 12)" opacity="0.85" />
		</svg>
	</span>
	<span
		class="font-extrabold tracking-tight {size === 'sm' ? 'text-lg' : 'text-xl'} {onDark
			? 'text-white'
			: 'text-ink'}">Orbita</span
	>
</span>
