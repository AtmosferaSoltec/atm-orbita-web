<script lang="ts">
	import { Popover } from 'bits-ui';
	import { CalendarClock, ChevronDown, Check } from '@lucide/svelte';
	import Field from './Field.svelte';
	import { FIELD_BOX, fieldBorder } from './field-styles';
	let { value = $bindable() }: { value: number } = $props();
	let open = $state(false);
	const id = $props.id();
</script>

<Field {id} label="Día de cobro">
	<Popover.Root bind:open>
		<Popover.Trigger {id} class="{FIELD_BOX} {fieldBorder()} text-left text-[15px] font-semibold">
			<CalendarClock size={18} class="text-muted-light" aria-hidden="true" />
			<span class="flex-1">Día {value}</span><ChevronDown
				size={17}
				class="text-muted"
				aria-hidden="true"
			/>
		</Popover.Trigger>
		<Popover.Content
			role="dialog"
			sideOffset={8}
			align="start"
			class="picker-popover z-[70] w-[300px] max-w-[calc(100vw-2rem)] rounded-card border border-outline bg-surface p-4 text-ink shadow-pop"
			aria-label="Elegir día de cobro"
		>
			<p class="text-sm font-extrabold">¿Qué día se cobra?</p>
			<div class="mt-3 grid grid-cols-7 gap-1">
				{#each Array.from({ length: 31 }, (_, i) => i + 1) as day (day)}
					<button
						type="button"
						aria-label="Día {day}"
						aria-pressed={value === day}
						class="flex size-9 items-center justify-center rounded-xl text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary {day ===
						value
							? 'bg-primary text-white shadow-sm'
							: 'hover:bg-primary-soft hover:text-primary'}"
						onclick={() => {
							value = day;
							open = false;
						}}>{day}</button
					>
				{/each}
			</div>
			<p class="mt-3 border-t border-divider pt-3 text-xs leading-relaxed text-muted">
				Si el mes tiene menos días, el cobro será el último día del mes.
			</p>
			<div class="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary">
				<Check size={14} aria-hidden="true" />Día {value} de cada mes
			</div>
		</Popover.Content>
	</Popover.Root>
</Field>
