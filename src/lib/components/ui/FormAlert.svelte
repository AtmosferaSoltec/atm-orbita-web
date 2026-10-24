<script lang="ts">
	import { CircleAlert, CircleCheck } from '@lucide/svelte';

	interface Props {
		message: string | null;
		tone?: 'error' | 'success';
	}

	let { message, tone = 'error' }: Props = $props();
</script>

{#if message}
	<p
		class="flex items-start gap-2 text-sm font-semibold {tone === 'error'
			? 'text-expense-strong'
			: 'text-income-strong'}"
		role={tone === 'error' ? 'alert' : 'status'}
	>
		{#if tone === 'error'}
			<CircleAlert size={18} class="mt-px shrink-0" aria-hidden="true" />
		{:else}
			<CircleCheck size={18} class="mt-px shrink-0" aria-hidden="true" />
		{/if}
		{message}
	</p>
{/if}
