<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from './Field.svelte';
	import { FIELD_BOX, FIELD_INPUT, fieldBorder } from './field-styles';
	import type { IconComponent } from './types';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		label: string;
		value: string;
		hint?: string;
		error?: string | null;
		icon?: IconComponent;
		/** Text before the value inside the box, e.g. `S/`. */
		prefix?: string;
		trailing?: Snippet;
		aside?: Snippet;
		class?: string;
	}

	let {
		label,
		value = $bindable(),
		hint,
		error,
		icon: Icon,
		prefix,
		trailing,
		aside,
		class: className = '',
		type = 'text',
		...rest
	}: Props = $props();

	const id = $props.id();
</script>

<Field {id} {label} {hint} {error} {aside} class={className}>
	<div class="{FIELD_BOX} {fieldBorder(error)}">
		{#if Icon}<Icon size={18} class="shrink-0 text-muted-light" aria-hidden="true" />{/if}
		{#if prefix}<span class="shrink-0 text-[15px] font-bold text-muted">{prefix}</span>{/if}
		<input
			{id}
			{type}
			bind:value
			class={FIELD_INPUT}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
			{...rest}
		/>
		{@render trailing?.()}
	</div>
</Field>
