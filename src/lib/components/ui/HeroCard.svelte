<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'savings' | 'credit';
		class?: string;
		children: Snippet;
	}

	let { variant = 'savings', class: className = '', children }: Props = $props();
</script>

<!-- Highlighted card of the design system (ORBITA_SPEC §5): gradient, glow and dark veil. -->
<section
	class="relative isolate overflow-hidden rounded-hero p-6 text-white shadow-xl sm:p-7 {variant ===
	'savings'
		? 'hero-savings shadow-violet/25'
		: 'hero-credit shadow-orange/25'} {className}"
>
	<div class="hero-veil pointer-events-none absolute inset-0 -z-10"></div>
	{@render children()}
</section>
