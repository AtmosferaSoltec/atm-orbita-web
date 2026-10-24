<script lang="ts">
	import { resolve } from '$app/paths';
	import { ChevronRight, Users } from '@lucide/svelte';
	import { Badge } from '#lib/components/ui/index.ts';
	import ServiceIcon from './ServiceIcon.svelte';
	import { SERVICE_STATUS } from './labels';
	import { formatMoney } from '#lib/domain/money.ts';
	import { formatDate, relativeDays, todayIso } from '#lib/domain/dates.ts';
	import { nextChargeDate, owedToMe, type Service } from '#lib/domain/services.ts';

	let { service }: { service: Service } = $props();

	const today = todayIso();
	const next = $derived(nextChargeDate(service, today));
	const owed = $derived(owedToMe(service, today));
</script>

<a
	href={resolve('/(app)/services/[id]', { id: service.id })}
	class="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-canvas sm:px-5"
>
	<ServiceIcon name={service.name} color={service.color} />
	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<p class="truncate text-[15px] font-bold">{service.name}</p>
			{#if service.shared}<Users
					size={15}
					class="shrink-0 text-muted-light"
					aria-label="Compartido"
				/>{/if}
		</div>
		<p class="truncate text-[13px] text-muted">
			{#if service.status === 'active' && next}
				Próximo cobro {relativeDays(next, today)} · {formatDate(next)}
			{:else}
				{service.category}
			{/if}
		</p>
	</div>
	<div class="hidden sm:block">
		{#if owed > 0}
			<Badge tone="expense">Te deben {formatMoney(owed, service.currency)}</Badge>
		{:else if service.status !== 'active'}
			<Badge tone={SERVICE_STATUS[service.status].tone}
				>{SERVICE_STATUS[service.status].label}</Badge
			>
		{/if}
	</div>
	<div class="text-right">
		<p class="tabular font-extrabold">{formatMoney(service.amount, service.currency)}</p>
		<p class="text-xs text-muted">al mes</p>
	</div>
	<ChevronRight size={18} class="shrink-0 text-muted-light" aria-hidden="true" />
</a>
