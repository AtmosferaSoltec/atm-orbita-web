<script lang="ts">
	interface Props {
		checked: boolean;
		label: string;
		description?: string;
	}

	let { checked = $bindable(), label, description }: Props = $props();
	const id = $props.id();
</script>

<!-- The whole row toggles (ORBITA_SPEC §5, "Fila con interruptor"). -->
<label
	for={id}
	class="flex cursor-pointer items-center gap-4 rounded-field border border-outline bg-surface px-4 py-3.5 transition-colors hover:border-chip-border"
>
	<span class="min-w-0 flex-1">
		<span class="block text-[15px] font-bold">{label}</span>
		{#if description}<span class="mt-0.5 block text-[13px] text-muted">{description}</span>{/if}
	</span>
	<input {id} type="checkbox" role="switch" bind:checked class="peer sr-only" />
	<span
		class="relative h-7 w-12 shrink-0 rounded-full bg-[#8793A6] transition-colors peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
		aria-hidden="true"
	></span>
</label>
