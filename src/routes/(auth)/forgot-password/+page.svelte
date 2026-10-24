<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { KeyRound, Mail } from '@lucide/svelte';
	import { Button, FormAlert, PasswordField, TextField } from '#lib/components/ui/index.ts';
	import { simulateRequest, validateEmail, validatePassword } from '../validation';

	// Three steps, as in the Android app (ORBITA_SPEC §7.1): email → 6-digit code → new password.
	type Step = 'email' | 'code' | 'password';

	let step = $state<Step>('email');
	let email = $state('');
	let code = $state('');
	let password = $state('');
	let repeat = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	const TITLES: Record<Step, [string, string]> = {
		email: [
			'Recupera tu contraseña',
			'Escribe tu correo y te enviaremos un código para crear una contraseña nueva.'
		],
		code: ['Escribe el código', ''],
		password: [
			'Crea una contraseña nueva',
			'Al guardarla se cerrará la sesión en todos tus dispositivos.'
		]
	};

	function go(next: Step) {
		error = null;
		step = next;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (step === 'email') error = validateEmail(email);
		if (step === 'code') error = /^\d{6}$/.test(code) ? null : 'Escribe los 6 dígitos del código.';
		if (step === 'password')
			error =
				validatePassword(password) ??
				(password === repeat ? null : 'Las contraseñas no coinciden.');
		if (error) return;

		loading = true;
		await simulateRequest();
		loading = false;
		if (step === 'email') go('code');
		else if (step === 'code') go('password');
		else await goto(resolve('/(auth)/login?password-changed'), { replaceState: true });
	}
</script>

<svelte:head><title>Recupera tu contraseña · Orbita</title></svelte:head>

<h1 class="text-[26px] font-extrabold tracking-tight">{TITLES[step][0]}</h1>
<p class="mt-1 text-muted">
	{#if step === 'code'}
		Si <strong class="text-ink">{email}</strong> tiene una cuenta, te enviamos un código de 6 dígitos.
		Vence en 15 minutos.
	{:else}
		{TITLES[step][1]}
	{/if}
</p>

<form class="mt-7 flex flex-col gap-4" onsubmit={submit} novalidate>
	{#if step === 'email'}
		<TextField
			label="Correo"
			type="email"
			bind:value={email}
			icon={Mail}
			placeholder="tucorreo@ejemplo.com"
			autocomplete="email"
		/>
	{:else if step === 'code'}
		<TextField
			label="Código"
			bind:value={code}
			icon={KeyRound}
			placeholder="000000"
			inputmode="numeric"
			autocomplete="one-time-code"
			maxlength={6}
			oninput={() => (code = code.replace(/\D/g, ''))}
			hint="Maqueta: no llega ningún correo; sirve cualquier código de 6 dígitos."
		/>
	{:else}
		<PasswordField
			label="Contraseña nueva"
			bind:value={password}
			autocomplete="new-password"
			hint="Mínimo 8 caracteres."
		/>
		<PasswordField
			label="Repite la contraseña nueva"
			bind:value={repeat}
			autocomplete="new-password"
		/>
	{/if}

	<FormAlert message={error} />

	<Button type="submit" size="lg" block {loading}>
		{step === 'email' ? 'Enviar código' : step === 'code' ? 'Continuar' : 'Guardar contraseña'}
	</Button>
</form>

<div class="mt-6 flex flex-col items-center gap-3 text-sm">
	{#if step === 'code'}
		<button
			type="button"
			class="font-bold text-primary hover:underline"
			onclick={() => go('email')}
		>
			Pedir otro código
		</button>
	{/if}
	<a href={resolve('/(auth)/login')} class="font-bold text-primary hover:underline">
		Volver a iniciar sesión
	</a>
</div>
