<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { KeyRound, Mail } from '@lucide/svelte';
	import { Button, FormAlert, PasswordField, TextField } from '#lib/components/ui/index.ts';
	import { forgotPassword, resetPassword, verifyResetCode } from '#lib/api/auth.ts';
	import { messageFor } from '#lib/api/errors.ts';
	import { validateEmail, validatePassword } from '../validation';

	// Three steps, as in the Android app (ORBITA_SPEC §7.1, API plan 11):
	// email → 6-digit code → new password.
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

	function validate(): string | null {
		if (step === 'email') return validateEmail(email);
		if (step === 'code') return /^\d{6}$/.test(code) ? null : 'Escribe los 6 dígitos del código.';
		return (
			validatePassword(password) ?? (password === repeat ? null : 'Las contraseñas no coinciden.')
		);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = validate();
		if (error) return;
		loading = true;
		try {
			if (step === 'email') {
				// The API answers the same whether the email exists or not.
				await forgotPassword(email.trim());
				code = '';
				go('code');
			} else if (step === 'code') {
				await verifyResetCode(email.trim(), code);
				go('password');
			} else {
				await resetPassword(email.trim(), code, password);
				await goto(resolve('/(auth)/login?password-changed'), { replaceState: true });
			}
		} catch (failure) {
			error = messageFor(failure);
		} finally {
			loading = false;
		}
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
			hint="¿No llega? Revisa el correo no deseado o pide otro código."
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
