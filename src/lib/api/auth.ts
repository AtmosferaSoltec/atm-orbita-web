// Identity: every call goes to the auth API (atm-auth-api); /me goes to the Orbita
// API. The access token is an RS256 JWT, but the profile comes from GET /me.

import { api, authApi, clearSession, storedRefreshToken, storeTokens, type Tokens } from './client';

export interface AccountUser {
	id: string;
	email: string;
	name: string | null;
	created_at: string;
}

export interface RegisterInput {
	name: string;
	email: string;
	password: string;
}

const SYSTEM = 'orbita';

/** Stores the tokens of a successful sign-in and loads the profile. */
async function openSession(tokens: Tokens): Promise<AccountUser> {
	storeTokens(tokens);
	return me();
}

export async function login(email: string, password: string): Promise<AccountUser> {
	const tokens = await authApi<Tokens>('/login', {
		method: 'POST',
		body: { system: SYSTEM, email, password }
	});
	return openSession(tokens);
}

export async function loginWithGoogle(
	credential: string,
	nonce: string,
	password?: string
): Promise<AccountUser> {
	const tokens = await authApi<Tokens>('/google', {
		method: 'POST',
		body: { system: SYSTEM, credential, nonce, ...(password ? { password } : {}) }
	});
	return openSession(tokens);
}

export async function register(input: RegisterInput): Promise<AccountUser> {
	const tokens = await authApi<Tokens>('/register', {
		method: 'POST',
		body: {
			system: SYSTEM,
			email: input.email,
			full_name: input.name,
			password: input.password
		}
	});
	return openSession(tokens);
}

export async function logout(): Promise<void> {
	const refreshToken = storedRefreshToken();
	try {
		if (refreshToken)
			await authApi('/logout', { method: 'POST', body: { refresh_token: refreshToken } });
	} finally {
		clearSession();
	}
}

export function me(): Promise<AccountUser> {
	return api<AccountUser>('/me');
}

export function forgotPassword(email: string): Promise<void> {
	return authApi('/password/forgot', { method: 'POST', body: { email, system: SYSTEM } });
}

export function verifyResetCode(email: string, code: string): Promise<void> {
	return authApi('/password/verify', { method: 'POST', body: { email, code } });
}

export function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
	return authApi('/password/reset', {
		method: 'POST',
		body: { email, code, new_password: newPassword, system: SYSTEM }
	});
}

/** Deletes the account and all its data for good; the auth API asks for the password again. */
export function deleteAccount(password: string): Promise<void> {
	return authApi('/account', { method: 'DELETE', body: { password }, bearer: true });
}

/**
 * Deletes the account of someone who signs in with Google (no password to ask for):
 * a fresh Google credential and its challenge nonce prove who the person is.
 */
export function deleteAccountWithGoogle(credential: string, nonce: string): Promise<void> {
	return authApi('/account', { method: 'DELETE', body: { credential, nonce }, bearer: true });
}
