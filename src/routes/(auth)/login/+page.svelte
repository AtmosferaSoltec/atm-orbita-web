<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Mail } from '@lucide/svelte';
	import { Button, FormAlert, PasswordField, TextField } from '#lib/components/ui/index.ts';
	import { session } from '#lib/stores/session.svelte.ts';
	import { simulateRequest, validateEmail, validatePassword } from '../validation';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	const passwordChanged = page.url.searchParams.has('password-changed');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = validateEmail(email) ?? validatePassword(password);
		if (error) return;
		loading = true;
		await simulateRequest();
		session.signIn(email.trim());
		await goto(resolve('/(app)/dashboard'), { replaceState: true });
	}
</script>

<svelte:head><title>Inicia sesión · Orbita</title></svelte:head>

<h1 class="text-[26px] font-extrabold tracking-tight">Inicia sesión</h1>
<p class="mt-1 text-muted">Entra para ver tus recibos, préstamos y servicios.</p>

<form class="mt-7 flex flex-col gap-4" onsubmit={submit} novalidate>
	<TextField
		label="Correo"
		type="email"
		bind:value={email}
		icon={Mail}
		placeholder="tucorreo@ejemplo.com"
		autocomplete="email"
	/>
	<PasswordField bind:value={password}>
		{#snippet aside()}
			<a
				href={resolve('/(auth)/forgot-password')}
				class="text-[13px] font-bold text-primary hover:underline"
			>
				¿Olvidaste tu contraseña?
			</a>
		{/snippet}
	</PasswordField>

	<FormAlert message={error} />
	{#if !error && passwordChanged}
		<FormAlert tone="success" message="Tu contraseña se cambió. Inicia sesión con la nueva." />
	{/if}

	<Button type="submit" size="lg" block {loading}>Ingresar</Button>
</form>

<p class="mt-6 text-center text-sm text-muted">
	¿No tienes cuenta?
	<a href={resolve('/(auth)/register')} class="font-bold text-primary hover:underline">Regístrate</a
	>
</p>
<p class="mt-3 text-center text-xs text-muted-light">
	Maqueta: cualquier correo y contraseña de 8 caracteres entran.
</p>
