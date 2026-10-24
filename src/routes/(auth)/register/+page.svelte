<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Mail, User } from '@lucide/svelte';
	import { Button, FormAlert, PasswordField, TextField } from '#lib/components/ui/index.ts';
	import { session } from '#lib/stores/session.svelte.ts';
	import { simulateRequest, validateEmail, validatePassword } from '../validation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error =
			(name.trim() ? null : 'Escribe tu nombre.') ??
			(name.length > 60 ? 'El nombre puede tener hasta 60 caracteres.' : null) ??
			validateEmail(email) ??
			validatePassword(password);
		if (error) return;
		loading = true;
		await simulateRequest();
		session.register(name, email.trim());
		await goto(resolve('/(app)/dashboard'), { replaceState: true });
	}
</script>

<svelte:head><title>Crea tu cuenta · Orbita</title></svelte:head>

<h1 class="text-[26px] font-extrabold tracking-tight">Crea tu cuenta</h1>
<p class="mt-1 text-muted">Empieza a llevar el control en menos de un minuto.</p>

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

<p class="mt-6 text-center text-sm text-muted">
	¿Ya tienes cuenta?
	<a href={resolve('/(auth)/login')} class="font-bold text-primary hover:underline">Inicia sesión</a
	>
</p>
