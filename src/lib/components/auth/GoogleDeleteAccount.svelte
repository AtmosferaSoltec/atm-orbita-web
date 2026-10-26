<script lang="ts">
	import { onMount } from 'svelte';
	import { googleChallenge, googleConfig, loadGoogleIdentity } from '#lib/api/google.ts';
	import { isApiError, messageFor } from '#lib/api/errors.ts';
	import { session } from '#lib/stores/session.svelte.ts';
	import { Button, FormAlert } from '#lib/components/ui/index.ts';

	// Confirms the deletion of an account that has no password by asking Google again.
	// The credential comes with a single-use challenge the API issued (see the API's
	// plan 21): it proves who the person is, so no session is needed.

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
					if (active && !busy) void remove(response.credential);
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
					: 'No se pudo cargar Google. Inténtalo de nuevo.';
		}
	}

	async function remove(credential: string) {
		busy = true;
		error = null;
		try {
			await session.deleteAccountWithGoogle(credential);
			if (active) ondeleted();
		} catch (failure) {
			if (!active) return;
			error = messageFor(failure);
			await prepare();
		} finally {
			busy = false;
		}
	}

	onMount(() => {
		active = true;
		void (async () => {
			try {
				const config = await googleConfig();
				if (!active) return;
				const available = Boolean(config.client_id);
				onavailable?.(available);
				if (!available) return;
				clientID = config.client_id;
				await prepare();
			} catch {
				onavailable?.(false);
			}
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
