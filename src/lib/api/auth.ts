// Identity endpoints of the API: the same accounts as the Android app.

import { api, setAccessToken } from './client';

export interface AccountUser {
	id: string;
	email: string;
	name: string | null;
	created_at: string;
}

export interface CurrencyOption {
	code: string;
	symbol: string;
	name: string;
}

interface AuthPayload {
	user: AccountUser;
	tokens: { access_token: string; access_token_expires_in: number };
}

export interface RegisterInput {
	name: string;
	email: string;
	password: string;
	mainCurrency: string;
}

async function openSession(path: string, body: unknown): Promise<AccountUser> {
	const data = await api<AuthPayload>(path, { method: 'POST', body, auth: false });
	setAccessToken(data.tokens.access_token);
	return data.user;
}

export function login(email: string, password: string): Promise<AccountUser> {
	return openSession('/auth/login', { email, password });
}

export function register(input: RegisterInput): Promise<AccountUser> {
	return openSession('/auth/register', {
		name: input.name,
		email: input.email,
		password: input.password,
		main_currency: input.mainCurrency,
		// "Hoy" lo decide el API con la zona del perfil (como en Android).
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	});
}

export async function logout(): Promise<void> {
	try {
		await api('/auth/logout', { method: 'POST', auth: false });
	} finally {
		setAccessToken(null);
	}
}

export function me(): Promise<AccountUser> {
	return api<AccountUser>('/me');
}

export function currencies(): Promise<CurrencyOption[]> {
	return api<CurrencyOption[]>('/currencies', { auth: false });
}

export function forgotPassword(email: string): Promise<void> {
	return api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });
}

export function verifyResetCode(email: string, code: string): Promise<void> {
	return api('/auth/verify-reset-code', { method: 'POST', body: { email, code }, auth: false });
}

export function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
	return api('/auth/reset-password', {
		method: 'POST',
		body: { email, code, new_password: newPassword },
		auth: false
	});
}
