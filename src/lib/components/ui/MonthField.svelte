<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import Field from './Field.svelte';
	import { FIELD_BOX, fieldBorder } from './field-styles';
	import { monthKey, monthName, parts, type MonthKey } from '#lib/domain/dates.ts';

	interface Props {
		label: string;
		/** `YYYY-MM` */
		value: MonthKey;
		fromYear?: number;
		toYear?: number;
		hint?: string;
		error?: string | null;
		class?: string;
	}

	let {
		label,
		value = $bindable(),
		fromYear = new Date().getFullYear() - 3,
		toYear = new Date().getFullYear() + 3,
		hint,
		error,
		class: className
	}: Props = $props();

	const id = $props.id();
	const selected = $derived(parts(value || monthKey(new Date().getFullYear(), 1)));
	const years = $derived(Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i));

	const SELECT =
		'absolute inset-0 w-full cursor-pointer appearance-none bg-transparent px-4 pr-9 text-[15px] font-semibold text-ink outline-none';
</script>

<Field {id} {label} {hint} {error} class={className}>
	<div class="grid grid-cols-[1.4fr_1fr] gap-2">
		<div class="relative {FIELD_BOX} {fieldBorder(error)}">
			<select
				{id}
				aria-label="{label}: mes"
				class={SELECT}
				value={selected.month}
				onchange={(e) => (value = monthKey(selected.year, Number(e.currentTarget.value)))}
			>
				{#each { length: 12 }, i (i)}
					<option value={i + 1}>{monthName(i + 1)}</option>
				{/each}
			</select>
			<ChevronDown
				size={18}
				class="pointer-events-none absolute right-3 text-muted"
				aria-hidden="true"
			/>
		</div>
		<div class="relative {FIELD_BOX} {fieldBorder(error)}">
			<select
				aria-label="{label}: año"
				class={SELECT}
				value={selected.year}
				onchange={(e) => (value = monthKey(Number(e.currentTarget.value), selected.month))}
			>
				{#each years as year (year)}
					<option value={year}>{year}</option>
				{/each}
			</select>
			<ChevronDown
				size={18}
				class="pointer-events-none absolute right-3 text-muted"
				aria-hidden="true"
			/>
		</div>
	</div>
</Field>
