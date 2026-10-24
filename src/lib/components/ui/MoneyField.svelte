<script lang="ts">
	import TextField from './TextField.svelte';
	import { CURRENCY_SYMBOL, type Currency } from '#lib/domain/money.ts';

	interface Props {
		label: string;
		/** Raw text typed by the person; parse it with `parseAmount`. */
		value: string;
		currency?: Currency;
		hint?: string;
		error?: string | null;
		placeholder?: string;
		class?: string;
	}

	let {
		label,
		value = $bindable(),
		currency = 'PEN',
		hint,
		error,
		placeholder = '0.00',
		class: className
	}: Props = $props();
</script>

<TextField
	{label}
	bind:value
	{hint}
	{error}
	{placeholder}
	class={className}
	prefix={CURRENCY_SYMBOL[currency]}
	inputmode="decimal"
	autocomplete="off"
/>
