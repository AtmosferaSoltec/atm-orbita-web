<script lang="ts" generics="T extends string">
	import { ChevronDown } from '@lucide/svelte';
	import Field from './Field.svelte';
	import { FIELD_BOX, fieldBorder } from './field-styles';

	interface Props {
		label: string;
		value: T;
		options: { value: T; label: string }[];
		hint?: string;
		error?: string | null;
		class?: string;
		onchange?: (value: T) => void;
	}

	let {
		label,
		value = $bindable(),
		options,
		hint,
		error,
		class: className = '',
		onchange
	}: Props = $props();

	const id = $props.id();
</script>

<Field {id} {label} {hint} {error} class={className}>
	<div class="relative {FIELD_BOX} {fieldBorder(error)}">
		<select
			{id}
			bind:value
			onchange={() => onchange?.(value)}
			class="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent px-4 pr-10 text-[15px] font-semibold text-ink outline-none"
		>
			{#each options as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<ChevronDown
			size={18}
			class="pointer-events-none absolute right-4 text-muted"
			aria-hidden="true"
		/>
	</div>
</Field>
