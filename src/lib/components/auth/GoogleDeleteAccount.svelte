<script lang="ts">
	import { onMount } from 'svelte';
	import { googleChallenge, googleClientId, loadGoogleIdentity } from '#lib/api/google.ts';
	import { isApiError, messageFor } from '#lib/api/errors.ts';
	import { session } from '#lib/stores/session.svelte.ts';
	import { Button, FormAlert } from '#lib/components/ui/index.ts';

	// Confirms the deletion of an account that has no password by asking Google again.
	// The credential comes with a single-use challenge nonce the auth API issued: it
	// proves who the person is. DELETE /account needs a session, so without one the
	// first Google confirmation signs in and the person confirms a second time.

	interface Props {
		/** The person has not yet checked "I understand": the button stays locked. */
		locked: boolean;
		ondeleted: () => void;
		/** Tells the page whether Google is configured at all (to hide the option). */
		onavailable?: (available: boolean) => void;
	}

	let { locked, ondeleted, onavailable }: Props = $props();

	let container: HTMLDivElement;
	let ready = $state(false);
	let busy = $state(false);
	let error = $state<string | null>(null);
	const clientID = googleClientId();
	let notice = $state<string | null>(null);
	let active = false;

	async function prepare() {
		ready = false;
		try {
			const identity = await loadGoogleIdentity();
			if (!active) return;
			const challenge = await googleChallenge();
			if (!active) return;
			const nonce = challenge.nonce;
			identity.initialize({
				client_id: clientID,
				nonce,
				auto_select: false,
				ux_mode: 'popup',
				callback: (response) => {
					if (active && !busy) void remove(response.credential, nonce);
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
				error = isApiError(failure, 'too_many_attempts')
					? messageFor(failure)
					: 'No se pudo cargar Google. Inténtalo de nuevo.';
		}
	}

	async function remove(credential: string, nonce: string) {
		busy = true;
		error = null;
		notice = null;
		try {
			if (!session.isSignedIn) {
				await session.signInWithGoogle(credential, nonce);
				if (!active) return;
				notice = 'Verificamos tu cuenta. Confirma otra vez con Google para eliminarla.';
				await prepare();
				return;
			}
			await session.deleteAccountWithGoogle(credential, nonce);
			if (active) ondeleted();
		} catch (failure) {
			if (!active) return;
			error = isApiError(failure, 'password_required_to_link')
				? 'Esa cuenta tiene contraseña. Elige «Correo y contraseña» para eliminarla.'
				: messageFor(failure);
			await prepare();
		} finally {
			busy = false;
		}
	}

	onMount(() => {
		active = true;
		void (async () => {
			onavailable?.(Boolean(clientID));
			if (!clientID) return;
			await prepare();
		})();
		return () => {
			active = false;
		};
	});
</script>

<div class="space-y-3">
	<!-- Locked until the person confirms: Google's button is the action itself. -->
	<div
		bind:this={container}
		inert={locked || busy || !ready}
		class="flex min-h-10 justify-center transition-opacity {locked ? 'opacity-40' : ''}"
	></div>
	{#if busy}
		<p role="status" class="text-center text-sm text-muted">Eliminando tu cuenta…</p>
	{:else if !ready && !error}
		<p role="status" class="text-center text-sm text-muted">Cargando Google…</p>
	{/if}
	{#if notice && !error}
		<FormAlert tone="success" message={notice} />
	{/if}
	<FormAlert message={error} />
	{#if error && !ready}
		<Button
			variant="secondary"
			block
			onclick={() => {
				error = null;
				void prepare();
			}}>Reintentar</Button
		>
	{/if}
</div>
