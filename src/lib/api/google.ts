import { PUBLIC_GOOGLE_CLIENT_ID } from '$app/env/public';
import { authApi } from './client';

/** The Google OAuth web client ID (public). Empty = Google sign-in is hidden. */
export function googleClientId(): string {
	return PUBLIC_GOOGLE_CLIENT_ID;
}

/** A single-use nonce the auth API issues; Google must sign it into the ID token. */
export async function googleChallenge(): Promise<{ nonce: string }> {
	return authApi('/google/challenge', { method: 'POST', body: {} });
}

interface CredentialResponse {
	credential: string;
}

export interface GoogleIdentity {
	initialize(options: {
		client_id: string;
		nonce: string;
		callback: (response: CredentialResponse) => void;
		auto_select: boolean;
		ux_mode: 'popup';
	}): void;
	renderButton(element: HTMLElement, options: Record<string, string | number>): void;
	disableAutoSelect(): void;
}

declare global {
	interface Window {
		google?: { accounts: { id: GoogleIdentity } };
	}
}

let loading: Promise<GoogleIdentity> | null = null;

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
	if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
	loading ??= new Promise<GoogleIdentity>((resolve, reject) => {
		const script = document.createElement('script');
		const timer = window.setTimeout(fail, 15000);
		function fail() {
			window.clearTimeout(timer);
			script.remove();
			loading = null;
			reject(new Error('Google Identity Services could not load'));
		}
		script.src = 'https://accounts.google.com/gsi/client?hl=es';
		script.async = true;
		script.onload = () => {
			window.clearTimeout(timer);
			const identity = window.google?.accounts.id;
			if (identity) resolve(identity);
			else fail();
		};
		script.onerror = fail;
		document.head.appendChild(script);
	});
	return loading;
}
