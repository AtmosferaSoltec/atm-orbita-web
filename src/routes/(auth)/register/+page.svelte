<script lang="ts">
	import GoogleSignIn from '#lib/components/auth/GoogleSignIn.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Mail, User } from '@lucide/svelte';
	import { Button, FormAlert, PasswordField, TextField } from '#lib/components/ui/index.ts';
	import { messageFor } from '#lib/api/errors.ts';
	import { session } from '#lib/stores/session.svelte.ts';
	import { validateEmail, validateName, validatePassword } from '../validation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = validateName(name) ?? validateEmail(email) ?? validatePassword(password);
		if (error) return;
		loading = true;
		try {
			await session.register({
				name: name.trim(),
				email: email.trim(),
				password
			});
			await goto(resolve('/(app)/dashboard'), { replaceState: true });
		} catch (failure) {
			error = messageFor(failure);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Crea tu cuenta · Orbita</title></svelte:head>

<h1 class="text-[26px] font-extrabold tracking-tight">Crea tu cuenta</h1>
<p class="mt-1 text-muted">Sirve para la web y para la app de Orbita.</p>

<form class="mt-7 flex flex-col gap-4" onsubmit={submit} novalidate>
	<TextField
		label="Nombre"
		bind:value={name}
		icon={User}
		placeholder="Cómo quieres que te llamemos"
		autocomplete="name"
		maxlength={60}
	/>
	<TextField
		label="Correo"
		type="email"
		bind:value={email}
		icon={Mail}
		placeholder="tucorreo@ejemplo.com"
		autocomplete="email"
	/>
	<PasswordField bind:value={password} autocomplete="new-password" hint="Mínimo 8 caracteres." />

	<FormAlert message={error} />

	<Button type="submit" size="lg" block {loading}>Crear cuenta</Button>
</form>

<GoogleSignIn />

<p class="mt-6 text-center text-sm text-muted">
	¿Ya tienes cuenta?
	<a href={resolve('/(auth)/login')} class="font-bold text-primary hover:underline">Inicia sesión</a
	>
</p>
