<script lang="ts">
	import type { Currency } from '#lib/domain/money.ts';
	let { value = $bindable(), disabled = false }: { value: Currency; disabled?: boolean } = $props();
	const name = $props.id();
</script>

<fieldset
	{disabled}
	class="inline-grid grid-cols-2 rounded-pill bg-neutral-soft p-1 disabled:opacity-60"
>
	<legend class="sr-only">Moneda</legend>
	<div class="relative col-span-2 grid grid-cols-2">
		<span
			aria-hidden="true"
			class="pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-pill bg-surface shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
			style:transform={value === 'USD' ? 'translateX(100%)' : 'translateX(0)'}
		></span>
		{#each [{ value: 'PEN', label: 'S/ Soles' }, { value: 'USD', label: 'US$ Dólares' }] as option (option.value)}
			<label class="relative cursor-pointer rounded-pill">
				<input
					type="radio"
					{name}
					value={option.value}
					bind:group={value}
					class="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
				/>
				<span
					class="flex h-11 items-center justify-center rounded-pill px-5 text-sm font-bold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 {value ===
					option.value
						? 'text-ink'
						: 'text-muted'}">{option.label}</span
				>
			</label>
		{/each}
	</div>
</fieldset>
