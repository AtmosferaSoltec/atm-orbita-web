<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Eye, EyeOff, LockKeyhole } from '@lucide/svelte';
	import TextField from './TextField.svelte';

	interface Props {
		label?: string;
		value: string;
		hint?: string;
		autocomplete?: 'current-password' | 'new-password';
		aside?: Snippet;
	}

	let {
		label = 'Contraseña',
		value = $bindable(),
		hint,
		autocomplete = 'current-password',
		aside
	}: Props = $props();

	let visible = $state(false);
</script>

<TextField
	{label}
	bind:value
	{hint}
	{aside}
	icon={LockKeyhole}
	type={visible ? 'text' : 'password'}
	{autocomplete}
	placeholder="••••••••"
	maxlength={128}
>
	{#snippet trailing()}
		<button
			type="button"
			class="-mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-neutral-soft"
			onclick={() => (visible = !visible)}
			aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
		>
			{#if visible}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
		</button>
	{/snippet}
</TextField>
