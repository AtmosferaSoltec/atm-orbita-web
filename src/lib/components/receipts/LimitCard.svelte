<script lang="ts">
	import { Settings2 } from '@lucide/svelte';
	import { HeroCard, ProgressBar } from '#lib/components/ui/index.ts';
	import { formatMoney } from '#lib/domain/money.ts';
	import type { YearSummary } from '#lib/domain/receipts.ts';

	interface Props {
		summary: YearSummary;
		onedit?: () => void;
	}

	let { summary, onedit }: Props = $props();

	const LEVEL = {
		ok: { label: 'Vas bien', class: 'bg-white/20 text-white' },
		warning: { label: 'Cerca del tope', class: 'bg-[#FBBF24] text-ink' },
		exceeded: { label: 'Tope superado', class: 'bg-[#FF8A80] text-ink' }
	};
</script>

<HeroCard>
	<div class="flex items-start justify-between gap-3">
		<p class="text-sm font-semibold text-white/85">Emitido en {summary.year} · monto bruto</p>
		<span class="rounded-full px-2.5 py-1 text-xs font-extrabold {LEVEL[summary.level].class}">
			{LEVEL[summary.level].label}
		</span>
	</div>
	<p class="tabular mt-2 text-4xl font-extrabold tracking-tight sm:text-[42px]">
		{formatMoney(summary.gross)}
	</p>
	<p class="mt-1 text-sm text-white/85">
		de {formatMoney(summary.limit)} ·
		{#if summary.level === 'exceeded'}
			te pasaste por {formatMoney(summary.gross - summary.limit)}
		{:else}
			te quedan {formatMoney(summary.remaining)}
		{/if}
	</p>
	<div class="mt-5">
		<ProgressBar value={summary.usedPercent} label="Tope anual usado" onDark />
	</div>
	<div
		class="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/14 px-4 py-3 text-sm"
	>
		<span class="font-semibold">{summary.usedPercent}% del tope usado</span>
		{#if onedit}
			<button
				type="button"
				onclick={onedit}
				class="inline-flex items-center gap-1.5 font-bold text-white/90 hover:text-white"
			>
				<Settings2 size={16} aria-hidden="true" /> Cambiar tope
			</button>
		{/if}
	</div>
</HeroCard>
