<script lang="ts">
	import { fly } from 'svelte/transition';
	import { CircleAlert, CircleCheck, Info, X } from '@lucide/svelte';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	const ICONS = { info: Info, success: CircleCheck, error: CircleAlert };
	const ICON_COLOR = { info: 'text-white/80', success: 'text-income', error: 'text-[#FF8A80]' };
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8"
	aria-live="polite"
>
	{#key toasts.current?.id}
		{#if toasts.current}
			{@const Icon = ICONS[toasts.current.tone]}
			<div
				transition:fly={{ y: 16, duration: 200 }}
				class="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-pop"
				role={toasts.current.tone === 'error' ? 'alert' : 'status'}
			>
				<Icon size={19} class="shrink-0 {ICON_COLOR[toasts.current.tone]}" aria-hidden="true" />
				<span class="flex-1">{toasts.current.message}</span>
				<button
					type="button"
					class="-mr-1 inline-flex size-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10"
					onclick={() => toasts.dismiss()}
					aria-label="Cerrar aviso"
				>
					<X size={16} />
				</button>
			</div>
		{/if}
	{/key}
</div>
