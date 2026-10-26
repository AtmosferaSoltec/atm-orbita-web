<script lang="ts">
	import { onMount } from 'svelte';

	// Decorative cards of the Android sign-in (ORBITA_SPEC §7.1): savings and credit gradients,
	// stacked at −4° / +7°, floating ±6px, swapping places every 3.2 s.

	const uid = $props.id();
	let savingsInFront = $state(true);

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const timer = setInterval(() => (savingsInFront = !savingsInFront), 3200);
		return () => clearInterval(timer);
	});
</script>

{#snippet chip(id: string)}
	<svg viewBox="0 0 40 30" class="h-[30px] w-10" aria-hidden="true">
		<defs>
			<linearGradient {id} x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#ffffff" />
				<stop offset="0.5" stop-color="#E2E8F0" />
				<stop offset="1" stop-color="#B6C0CE" />
			</linearGradient>
		</defs>
		<rect width="40" height="30" rx="6" fill="url(#{id})" />
		<g stroke="#0E1A2B" stroke-opacity="0.35" stroke-width="1" fill="none">
			<path d="M0 10h13M0 20h13M27 10h13M27 20h13M13 0v30M27 0v30" />
			<rect x="13" y="8" width="14" height="14" rx="3" />
		</g>
	</svg>
{/snippet}

{#snippet card(variant: 'savings' | 'credit', front: boolean)}
	<div
		class="card absolute top-1/2 left-1/2 h-[166px] w-[264px] {front
			? 'is-front'
			: 'is-back'} {variant}"
	>
		<div
			class="float flex h-full w-full flex-col justify-between rounded-hero p-5 {variant ===
			'savings'
				? 'hero-savings text-white shadow-2xl shadow-primary/40'
				: 'hero-credit text-ink shadow-2xl shadow-orange/40'}"
		>
			<div class="flex items-start justify-between">
				<span class="text-lg font-extrabold tracking-tight">Orbita</span>
				{@render chip(`${uid}-${variant}`)}
			</div>
			<div class="flex gap-2 opacity-60" aria-hidden="true">
				<span class="h-2 w-10 rounded-full bg-current"></span>
				<span class="h-2 w-6 rounded-full bg-current"></span>
			</div>
		</div>
	</div>
{/snippet}

<div class="relative h-[220px] w-full" aria-hidden="true">
	{@render card('credit', !savingsInFront)}
	{@render card('savings', savingsInFront)}
</div>

<style>
	.card {
		transition:
			transform 0.9s cubic-bezier(0.65, 0, 0.35, 1),
			z-index 0s 0.45s;
	}
	.card.is-front {
		z-index: 2;
		transform: translate(-50%, -50%) rotate(-4deg);
	}
	.card.is-back {
		z-index: 1;
		transform: translate(calc(-50% + 28px), calc(-50% - 22px)) rotate(7deg) scale(0.92);
	}
	.float {
		animation: float 2.6s ease-in-out infinite alternate;
	}
	.credit .float {
		animation-direction: alternate-reverse;
	}
	@keyframes float {
		from {
			transform: translateY(-6px);
		}
		to {
			transform: translateY(6px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.float {
			animation: none;
		}
	}
</style>
