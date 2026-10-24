<script lang="ts">
	import Field from './Field.svelte';

	interface Props {
		label: string;
		value: string;
		max?: number;
		placeholder?: string;
		hint?: string;
		rows?: number;
		class?: string;
	}

	let {
		label,
		value = $bindable(),
		max = 500,
		placeholder,
		hint,
		rows = 3,
		class: className
	}: Props = $props();

	const id = $props.id();
</script>

<Field {id} {label} {hint} class={className}>
	<div
		class="rounded-field border border-outline bg-surface px-4 pt-3 pb-2 transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 hover:border-chip-border"
	>
		<textarea
			{id}
			bind:value
			{rows}
			maxlength={max}
			{placeholder}
			class="block w-full resize-none bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-muted-light"
		></textarea>
		<p class="tabular text-right text-xs font-semibold text-muted-light">{value.length}/{max}</p>
	</div>
</Field>
