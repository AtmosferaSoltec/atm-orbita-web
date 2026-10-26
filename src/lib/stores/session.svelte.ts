// The signed-in person. The session survives reloads through the HttpOnly
// refresh cookie: on start the app renews it and asks the API who it is.

import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import * as auth from '#lib/api/auth.ts';
import { refreshSession, setAccessToken, whenSessionLost } from '#lib/api/client.ts';
import { receipts } from './receipts.svelte';
import { services } from './services.svelte';
import { loans } from './loans.svelte';

export type SessionUser = auth.AccountUser;

class SessionStore {
	user = $state<SessionUser | null>(null);
	#ready: Promise<void> | null = null;

	get isSignedIn(): boolean {
		return this.user !== null;
	}

	/** How the app greets the person: the first name, or the start of the email. */
	get firstName(): string {
		const name = this.user?.name?.trim();
		if (name) return name.split(/\s+/)[0];
		return this.user?.email.split('@')[0] ?? '';
	}

	get displayName(): string {
		return this.user?.name?.trim() || this.user?.email || '';
	}

	/** Restores the session once per page load (guards await it). */
	ensureReady(): Promise<void> {
		this.#ready ??= (async () => {
			if (!(await refreshSession())) return;
			try {
				this.user = await auth.me();
			} catch {
				setAccessToken(null);
				this.user = null;
			}
		})();
		return this.#ready;
	}

	async signIn(email: string, password: string): Promise<void> {
		this.user = await auth.login(email, password);
	}

	async signInWithGoogle(credential: string, mainCurrency: string, password = ''): Promise<void> {
		this.user = await auth.loginWithGoogle(credential, mainCurrency, password);
	}

	async register(input: auth.RegisterInput): Promise<void> {
		this.user = await auth.register(input);
	}

	async signOut(): Promise<void> {
		try {
			await auth.logout();
		} finally {
			this.user = null;
			receipts.clear();
			services.clear();
			loans.clear();
		}
	}

	/**
	 * Deletes the account for good. Without a session it signs in first (the public
	 * deletion page); if the deletion fails that session is closed again, so a
	 * visitor is never left signed in by a failed attempt.
	 */
	async deleteAccount(email: string, password: string): Promise<void> {
		const openedHere = !this.user;
		if (openedHere) this.user = await auth.login(email, password);
		try {
			await auth.deleteAccount(password);
		} catch (failure) {
			if (openedHere) await this.signOut().catch(() => undefined);
			throw failure;
		}
		this.#forget();
	}

	/** Deletes the account of a Google user; no session needed. */
	async deleteAccountWithGoogle(credential: string): Promise<void> {
		await auth.deleteAccountWithGoogle(credential);
		this.#forget();
	}

	/** The API rejected the session (revoked elsewhere, expired): back to login. */
	expire(): void {
		if (!this.user) return;
		this.#forget();
		void goto(resolve('/(auth)/login'), { replaceState: true });
	}

	/** Drops everything of the person from memory (the next one must not see it). */
	#forget(): void {
		setAccessToken(null);
		this.user = null;
		receipts.clear();
		services.clear();
		loans.clear();
	}
}

export const session = new SessionStore();
whenSessionLost(() => session.expire());
