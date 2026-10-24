<script lang="ts">
	import { Calendar, Popover } from 'bits-ui';
	import { parseDate, type DateValue } from '@internationalized/date';
	import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import Field from './Field.svelte';
	import { FIELD_BOX, fieldBorder } from './field-styles';
	import { formatDate, isIsoDate, todayIso } from '#lib/domain/dates.ts';
	let {
		value = $bindable(),
		label,
		min = '2000-01-01',
		max = '2100-12-31',
		class: className = ''
	}: { value: string; label: string; min?: string; max?: string; class?: string } = $props();
	const id = $props.id();
	let open = $state(false);
	const selected = $derived(isIsoDate(value) ? parseDate(value) : undefined);
	const minimum = $derived(parseDate(min));
	const maximum = $derived(parseDate(max));
	function select(date: DateValue | undefined) {
		if (date) {
			value = date.toString();
			open = false;
		}
	}
	const nav =
		'inline-flex size-8 items-center justify-center rounded-xl text-muted hover:bg-neutral-soft focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-30';
</script>

<Field {id} {label} class={className}>
	<Popover.Root bind:open>
		<Popover.Trigger
			{id}
			class="{FIELD_BOX} {fieldBorder()} text-left text-[15px] font-semibold"
			aria-label={label}
		>
			<CalendarDays size={18} class="text-muted-light" aria-hidden="true" />
			<span class="flex-1">{isIsoDate(value) ? formatDate(value) : 'Elige una fecha'}</span
			><ChevronDown size={17} class="text-muted" aria-hidden="true" />
		</Popover.Trigger>
		<Popover.Content
			role="dialog"
			sideOffset={8}
			align="start"
			class="picker-popover z-[80] w-[316px] max-w-[calc(100vw-2rem)] rounded-card border border-outline bg-surface p-4 text-ink shadow-pop"
			aria-label={label}
		>
			<Calendar.Root
				type="single"
				value={selected}
				onValueChange={select}
				minValue={minimum}
				maxValue={maximum}
				locale="es-PE"
				weekStartsOn={1}
				weekdayFormat="short"
				fixedWeeks
				preventDeselect
			>
				{#snippet children({ months, weekdays })}
					<Calendar.Header class="mb-4 flex items-center justify-between gap-2">
						<Calendar.PrevButton class={nav} aria-label="Mes anterior"
							><ChevronLeft size={18} /></Calendar.PrevButton
						>
						<div class="flex items-center gap-1 text-sm font-extrabold">
							<Calendar.MonthSelect
								aria-label="Mes del calendario"
								class="max-w-[120px] rounded-lg bg-transparent p-1 capitalize outline-primary"
							/>
							<Calendar.YearSelect
								aria-label="Año del calendario"
								class="rounded-lg bg-transparent p-1 outline-primary"
							/>
						</div>
						<Calendar.NextButton class={nav} aria-label="Mes siguiente"
							><ChevronRight size={18} /></Calendar.NextButton
						>
					</Calendar.Header>
					{#each months as month (month.value.toString())}
						<Calendar.Grid class="w-full border-collapse">
							<Calendar.GridHead
								><Calendar.GridRow>
									{#each weekdays as day, i (i)}<Calendar.HeadCell
											class="h-8 text-center text-[11px] font-bold text-muted"
											>{day.slice(0, 2)}</Calendar.HeadCell
										>{/each}
								</Calendar.GridRow></Calendar.GridHead
							>
							<Calendar.GridBody>
								{#each month.weeks as week, i (i)}
									<Calendar.GridRow>
										{#each week as date (date.toString())}
											<Calendar.Cell {date} month={month.value} class="p-0.5 text-center">
												<Calendar.Day
													class="relative inline-flex size-9 items-center justify-center rounded-xl text-sm font-semibold transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary data-disabled:pointer-events-none data-disabled:opacity-25 data-outside-month:text-muted-light data-selected:bg-primary data-selected:text-white data-today:font-extrabold"
												>
													{date.day}
													<span
														class="absolute bottom-1 left-1/2 hidden size-1 -translate-x-1/2 rounded-full bg-current [[data-today]_&]:block"
														aria-hidden="true"
													></span>
												</Calendar.Day>
											</Calendar.Cell>
										{/each}
									</Calendar.GridRow>
								{/each}
							</Calendar.GridBody>
						</Calendar.Grid>
					{/each}
				{/snippet}
			</Calendar.Root>
			<div class="mt-3 flex items-center justify-between border-t border-divider pt-3">
				<p class="text-xs text-muted">
					{isIsoDate(value) ? formatDate(value) : 'Selecciona un día'}
				</p>
				<button
					type="button"
					class="rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-primary-soft"
					disabled={todayIso() < min || todayIso() > max}
					onclick={() => {
						value = todayIso();
						open = false;
					}}>Hoy</button
				>
			</div>
		</Popover.Content>
	</Popover.Root>
</Field>
