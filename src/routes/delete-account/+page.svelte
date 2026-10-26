<script lang="ts">
	import { resolve } from '$app/paths';
	import { CircleCheck, Mail, Trash2 } from '@lucide/svelte';
	import GoogleDeleteAccount from '#lib/components/auth/GoogleDeleteAccount.svelte';
	import PublicPage from '#lib/components/layout/PublicPage.svelte';
	import {
		Button,
		Card,
		FormAlert,
		IconBadge,
		PasswordField,
		SegmentedControl,
		SwitchRow,
		TextField
	} from '#lib/components/ui/index.ts';
	import { messageFor } from '#lib/api/errors.ts';
	import { session } from '#lib/stores/session.svelte.ts';
	import { validateEmail } from '../(auth)/validation';

	// The page Google Play asks for: anyone can request the deletion of their account
	// and data from the web, without the app and without being signed in first.
	// Everything here is real and irreversible.

	const CONTACT = 'atmosfera.soltec@gmail.com';

	type Method = 'password' | 'google';

	let method = $state<Method>('password');
	let googleAvailable = $state(true);
	let email = $state('');
	let password = $state('');
	let confirmed = $state(false);
	let error = $state<string | null>(null);
	let busy = $state(false);
	let done = $state(false);

	// Someone already signed in deletes the account they are in; no email to type.
	const accountEmail = $derived(session.user?.email ?? null);

	async function remove(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		if (!accountEmail) error = validateEmail(email);
		if (!error && !password) error = 'Escribe tu contraseña.';
		if (!error && !confirmed)
			error = 'Marca la casilla para confirmar que quieres eliminar tu cuenta.';
		if (error) return;
		busy = true;
		try {
			await session.deleteAccount(email.trim(), password);
			password = '';
			done = true;
		} catch (failure) {
			error = messageFor(failure);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Eliminar mi cuenta · Orbita</title>
	<meta
		name="description"
		content="Pide la eliminación de tu cuenta de Orbita y de todos tus datos, sin necesidad de abrir la app."
	/>
</svelte:head>

<PublicPage>
	{#if done}
		<Card padding="lg" class="mt-6 text-center">
			<div class="flex justify-center">
				<IconBadge icon={CircleCheck} tone="income" size="lg" />
			</div>
			<h1 class="mt-4 text-2xl font-extrabold tracking-tight">Tu cuenta fue eliminada</h1>
			<p class="mt-2 text-muted" role="status">
				Borramos tu cuenta de Orbita y todos tus datos. Ya no podrás entrar con ella y no hay forma
				de recuperarla.
			</p>
			<div class="mt-6 flex justify-center">
				<Button href={resolve('/')} variant="secondary">Volver al inicio</Button>
			</div>
		</Card>
	{:else}
		<h1 class="mt-4 text-[26px] font-extrabold tracking-tight">Eliminar mi cuenta de Orbita</h1>
		<p class="mt-2 text-muted">
			Aquí puedes pedir que eliminemos tu cuenta de <strong class="text-ink">Orbita</strong>, de
			Atmosfera, y todos tus datos, sin abrir la app. La eliminación es
			<strong class="text-ink">inmediata y no se puede deshacer</strong>.
		</p>

		<div class="mt-6 grid gap-4 sm:grid-cols-2">
			<Card>
				<h2 class="text-base font-extrabold">Qué se elimina</h2>
				<ul class="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
					<li>Tu cuenta: correo, nombre y contraseña.</li>
					<li>Tus cuentas, movimientos, categorías y tarjetas de la app.</li>
					<li>Tus recibos por honorarios y sus archivos XML y PDF.</li>
					<li>Tus préstamos y servicios; los enlaces públicos dejan de funcionar.</li>
					<li>Tus sesiones abiertas y la vinculación con Google, si la usaste.</li>
				</ul>
			</Card>
			<Card>
				<h2 class="text-base font-extrabold">Qué se conserva</h2>
				<ul class="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
					<li>
						Los registros técnicos del servidor (fecha, ruta y dirección IP de las visitas) se
						borran solos a los 14 días. No incluyen tus datos.
					</li>
					<li>No guardamos copias de seguridad de la base de datos.</li>
					<li>Nada más: no queda información tuya en Orbita.</li>
				</ul>
			</Card>
		</div>

		<Card padding="lg" class="mt-6">
			<h2 class="text-lg font-extrabold">Confirma que eres tú</h2>
			{#if accountEmail}
				<p class="mt-1 text-sm text-muted">
					Tienes la sesión abierta como <strong class="text-ink">{accountEmail}</strong>. Se
					eliminará esa cuenta.
				</p>
			{:else}
				<p class="mt-1 text-sm text-muted">Elige cómo entras a Orbita.</p>
			{/if}

			{#if googleAvailable}
				<div class="mt-4">
					<SegmentedControl
						label="Cómo confirmas tu identidad"
						bind:value={method}
						block
						options={[
							{ value: 'password', label: 'Correo y contraseña' },
							{ value: 'google', label: 'Google' }
						]}
					/>
				</div>
			{/if}

			<div class="mt-5 flex flex-col gap-4">
				<SwitchRow
					bind:checked={confirmed}
					label="Entiendo que se borrará todo y no se puede deshacer"
					description="Cuentas, recibos, préstamos, servicios y archivos."
				/>

				{#if method === 'password'}
					<form class="flex flex-col gap-4" onsubmit={remove} novalidate>
						{#if !accountEmail}
							<TextField
								label="Correo"
								type="email"
								bind:value={email}
								icon={Mail}
								placeholder="tucorreo@ejemplo.com"
								autocomplete="email"
							/>
						{/if}
						<PasswordField bind:value={password} />
						<FormAlert message={error} />
						<Button type="submit" variant="danger" size="lg" block icon={Trash2} loading={busy}>
							Eliminar mi cuenta para siempre
						</Button>
					</form>
					<p class="text-[13px] text-muted">
						¿Entraste siempre con Google? Elige la opción «Google». ¿Olvidaste tu contraseña?
						<a
							href={resolve('/(auth)/forgot-password')}
							class="font-bold text-primary hover:underline">Crea una nueva</a
						>.
					</p>
				{/if}
				{#if googleAvailable}
					<div hidden={method !== 'google'}>
						<GoogleDeleteAccount
							locked={!confirmed}
							ondeleted={() => (done = true)}
							onavailable={(available) => {
								googleAvailable = available;
								if (!available) method = 'password';
							}}
						/>
						{#if !confirmed}
							<p class="mt-2 text-center text-[13px] text-muted">
								Marca la casilla de arriba para activar el botón de Google.
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</Card>

		<Card class="mt-6">
			<h2 class="text-base font-extrabold">¿No puedes entrar a tu cuenta?</h2>
			<p class="mt-1 text-sm text-muted">
				Escríbenos a
				<a
					href={`mailto:${CONTACT}?subject=Eliminar mi cuenta de Orbita`}
					class="font-bold text-primary hover:underline">{CONTACT}</a
				>
				desde el correo con el que te registraste, indicando que quieres eliminar tu cuenta de Orbita.
				Verificamos que la cuenta es tuya y la eliminamos.
			</p>
			<h2 class="mt-5 text-base font-extrabold">Desde la app</h2>
			<p class="mt-1 text-sm text-muted">
				También puedes hacerlo en la app de Orbita: <strong class="text-ink"
					>Ajustes → Eliminar cuenta</strong
				>.
			</p>
		</Card>
	{/if}
</PublicPage>
