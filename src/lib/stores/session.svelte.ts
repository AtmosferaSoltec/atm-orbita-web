// Demo session: any email and password sign in (like the Android demo mode). It will be replaced
// by the API session (access token in memory, refresh token) when the web connects to the API.

import { loadJson, removeJson, saveJson } from '#lib/data/storage.ts';

export interface SessionUser {
	name: string;
	email: string;
}

const KEY = 'session';

class SessionStore {
	user = $state<SessionUser | null>(loadJson<SessionUser | null>(KEY, () => null));

	get isSignedIn(): boolean {
		return this.user !== null;
	}

	get firstName(): string {
		return this.user?.name.split(' ')[0] ?? '';
	}

	signIn(email: string): void {
		const local = email.split('@')[0] ?? '';
		const name = local.charAt(0).toUpperCase() + local.slice(1);
		this.#set({ name: name || 'Usuario', email });
	}

	register(name: string, email: string): void {
		this.#set({ name: name.trim(), email });
	}

	signOut(): void {
		this.user = null;
		removeJson(KEY);
	}

	#set(user: SessionUser): void {
		this.user = user;
		saveJson(KEY, user);
	}
}

export const session = new SessionStore();
