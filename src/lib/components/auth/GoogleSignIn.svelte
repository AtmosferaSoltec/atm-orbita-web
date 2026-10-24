<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { googleChallenge, googleConfig, loadGoogleIdentity } from '#lib/api/google.ts';
	import { isApiError, messageFor } from '#lib/api/errors.ts';
	import { session } from '#lib/stores/session.svelte.ts';
	import { Button, FormAlert, PasswordField } from '#lib/components/ui/index.ts';

	let { mainCurrency = 'PEN' }: { mainCurrency?: string } = $props();
	let container: HTMLDivElement;
	let enabled = $state(false);
	let ready = $state(false);
	let busy = $state(false);
	let linking = $state(false);
	let password = $state('');
	let error = $state<string | null>(null);
	let credential = '';
	let clientID = '';
	let active = false;

	async function prepare() {
		ready = false;
		try {
			const identity = await loadGoogleIdentity();
			if (!active) return;
			const challenge = await googleChallenge();
			if (!active) return;
			identity.initialize({
				client_id: clientID,
				nonce: challenge.nonce,
				auto_select: false,
				ux_mode: 'popup',
				callback: (response) => {
					if (!active || busy) return;
					credential = response.credential;
					void signIn();
				}
			});
			// Google owns the children of this otherwise empty integration container.
			// eslint-disable-next-line svelte/no-dom-manipulating
			container.replaceChildren();
			identity.renderButton(container, {
				theme: 'outline',
				size: 'large',
				text: 'continue_with',
				locale: 'es',
				width: Math.min(container.clientWidth || 320, 400)
			});
			ready = true;
		} catch (failure) {
			if (active)
				error = isApiError(failure, 'TOO_MANY_REQUESTS')
					? messageFor(failure)
					: 'No se pudo cargar el acceso con Google. Inténtalo de nuevo.';
		}
	}

	async function signIn(event?: SubmitEvent) {
		event?.preventDefault();
		if (busy) return;
		if (linking && !password) {
			error = 'Escribe la contraseña de tu cuenta de Orbita.';
			return;
		}
		busy = true;
		error = null;
		try {
			await session.signInWithGoogle(credential, mainCurrency, password);
			credential = '';
			password = '';
			if (active) await goto(resolve('/(app)/dashboard'), { replaceState: true });
		} catch (failure) {
			if (!active) return;
			if (isApiError(failure, 'GOOGLE_LINK_REQUIRED')) {
				linking = true;
			} else {
				error = messageFor(failure);
				if (
					!linking ||
					isApiError(failure, 'GOOGLE_CHALLENGE_EXPIRED') ||
					isApiError(failure, 'GOOGLE_INVALID')
				) {
					linking = false;
					credential = '';
					password = '';
					await prepare();
				}
			}
		} finally {
			busy = false;
		}
	}

	async function cancelLink() {
		linking = false;
		credential = '';
		password = '';
		error = null;
		await prepare();
	}

	onMount(() => {
		active = true;
		void (async () => {
			try {
				const config = await googleConfig();
				if (!active || !config.client_id) return;
				clientID = config.client_id;
				enabled = true;
				await prepare();
			} catch {
				// Email sign-in remains available if provider discovery is offline.
			}
		})();
		return () => {
			active = false;
			credential = '';
			password = '';
		};
	});
</script>

<div class="mt-6 space-y-4" class:hidden={!enabled}>
	<div class="flex items-center gap-3 text-xs text-muted">
		<span class="h-px flex-1 bg-outline"></span>o continúa con<span class="h-px flex-1 bg-outline"
		></span>
	</div>
	<div
		class:hidden={linking}
		inert={busy || !ready}
		class="flex min-h-10 justify-center"
		bind:this={container}
	></div>
	{#if linking}
		<form onsubmit={signIn} class="space-y-4">
			<p class="text-sm text-muted">
				Ya tienes una cuenta con este correo. Confirma tu contraseña de Orbita para vincular Google
				y conservar tus datos. Solo lo pediremos esta vez.
			</p>
			<PasswordField bind:value={password} label="Contraseña de Orbita" />
			<Button type="submit" block loading={busy}>Vincular Google e ingresar</Button>
			<Button variant="ghost" block disabled={busy} onclick={cancelLink}>Usar otra cuenta</Button>
			<a
				href={resolve('/(auth)/forgot-password')}
				class="block text-center text-sm font-bold text-primary hover:underline"
				>¿Olvidaste tu contraseña?</a
			>
		</form>
	{:else if busy}
		<p role="status" class="text-center text-sm text-muted">Verificando tu cuenta…</p>
	{:else if !ready && !error}
		<p role="status" class="text-center text-sm text-muted">Cargando Google…</p>
	{/if}
	<FormAlert message={error} />
	{#if error && !ready && !linking}
		<Button
			variant="secondary"
			block
			onclick={() => {
				error = null;
				void prepare();
			}}>Reintentar Google</Button
		>
	{/if}
</div>
