// Two backends. Data endpoints go to the Orbita API (atm-orbita-api, `/api/v1`,
// proxied in development) with the Bearer access token. Every authentication call
// goes to the auth API (atm-auth-api, PUBLIC_AUTH_API_URL). The access token lives
// only in memory; the refresh token (it rotates on every use) is kept in
// localStorage, or in sessionStorage when the auth API says the session is
// "temporary".

import { PUBLIC_AUTH_API_URL } from '$app/env/public';
import { ApiError, NETWORK_ERROR, type FieldProblem } from './errors';
import { withSessionLock } from './session-lock';

const BASE = '/api/v1';
const AUTH_BASE = PUBLIC_AUTH_API_URL.replace(/\/+$/, '');
const REFRESH_KEY = 'orbita:refresh-token';

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let onSessionLost: (() => void) | null = null;

/** The auth API's token response. */
export interface Tokens {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
	refresh_expires_in: number;
	session_mode: 'persistent' | 'temporary' | string;
}

function readStored(): string | null {
	for (const area of ['localStorage', 'sessionStorage'] as const) {
		try {
			const value = window[area].getItem(REFRESH_KEY);
			if (value) return value;
		} catch {
			// storage blocked: the session just will not survive a reload
		}
	}
	return null;
}

function clearStored(): void {
	for (const area of ['localStorage', 'sessionStorage'] as const) {
		try {
			window[area].removeItem(REFRESH_KEY);
		} catch {
			// nothing to clear
		}
	}
}

/** Keeps the new tokens: access in memory, refresh in the storage the session mode asks for. */
export function storeTokens(tokens: Tokens): void {
	accessToken = tokens.access_token;
	clearStored();
	try {
		const area = tokens.session_mode === 'temporary' ? window.sessionStorage : window.localStorage;
		area.setItem(REFRESH_KEY, tokens.refresh_token);
	} catch {
		// storage blocked: the session just will not survive a reload
	}
}

/** The refresh token the auth API needs to close the session. */
export function storedRefreshToken(): string | null {
	return readStored();
}

export function setAccessToken(token: string | null): void {
	accessToken = token;
}

/** Forgets the whole session on this device (memory and storage). */
export function clearSession(): void {
	accessToken = null;
	clearStored();
}

export function hasAccessToken(): boolean {
	return accessToken !== null;
}

/** Called when the session can no longer be renewed (to send the person to login). */
export function whenSessionLost(callback: () => void): void {
	onSessionLost = callback;
}

/**
 * Renews the access token with the stored refresh token. Only one renewal runs at a
 * time, and the Web Lock serializes tabs: each reads the freshest rotated token
 * inside the lock, so two tabs never present the same one (which would end the session).
 */
export function refreshSession(): Promise<boolean> {
	refreshing ??= withSessionLock(async () => {
		const refreshToken = readStored();
		if (!refreshToken) {
			accessToken = null;
			return false;
		}
		try {
			const res = await fetch(`${AUTH_BASE}/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token: refreshToken })
			});
			if (!res.ok) {
				// A network or server hiccup must not throw the session away.
				if (res.status === 401 || res.status === 403) clearSession();
				else accessToken = null;
				return false;
			}
			storeTokens((await res.json()) as Tokens);
			return true;
		} catch {
			return false;
		} finally {
			refreshing = null;
		}
	});
	return refreshing;
}

interface RequestOptions {
	method?: string;
	body?: unknown;
	form?: FormData;
	/** Public endpoints do not send the token nor retry. */
	auth?: boolean;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
	const headers: Record<string, string> = {};
	if (options.auth !== false && accessToken) headers.Authorization = `Bearer ${accessToken}`;
	let body: BodyInit | undefined;
	if (options.form) body = options.form;
	else if (options.body !== undefined) {
		headers['Content-Type'] = 'application/json';
		body = JSON.stringify(options.body);
	}
	try {
		return await fetch(`${BASE}${path}`, {
			method: options.method ?? 'GET',
			headers,
			body,
			credentials: 'same-origin'
		});
	} catch {
		throw new ApiError(0, NETWORK_ERROR, 'Sin conexión.');
	}
}

async function toError(res: Response): Promise<ApiError> {
	try {
		const payload = (await res.json()) as {
			error?: { code?: string; message?: string; details?: FieldProblem[] };
		};
		const error = payload.error ?? {};
		return new ApiError(
			res.status,
			error.code ?? 'INTERNAL_ERROR',
			error.message ?? '',
			error.details ?? []
		);
	} catch {
		return new ApiError(res.status, 'INTERNAL_ERROR', '');
	}
}

/** The API's error code of a failed response, without consuming its body. */
async function errorCodeOf(res: Response): Promise<string | undefined> {
	try {
		return ((await res.clone().json()) as { error?: { code?: string } }).error?.code;
	} catch {
		return undefined;
	}
}

/**
 * Sends a request; when the access token is rejected (UNAUTHORIZED) renews the
 * session once and retries. Other 401s are answers, not an expired session.
 */
async function request(path: string, options: RequestOptions = {}): Promise<Response> {
	let res = await send(path, options);
	if (res.status === 401 && options.auth !== false && (await errorCodeOf(res)) === 'UNAUTHORIZED') {
		if (await refreshSession()) {
			res = await send(path, options);
		} else {
			onSessionLost?.();
		}
	}
	if (!res.ok) throw await toError(res);
	return res;
}

/** JSON endpoints: returns `data` (or undefined for 204). */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const res = await request(path, options);
	if (res.status === 204) return undefined as T;
	const payload = (await res.json()) as { data: T };
	return payload.data;
}

/** Binary endpoints (a receipt's file). */
export async function apiBlob(path: string): Promise<Blob> {
	const res = await request(path);
	return res.blob();
}

/** List endpoints may include server metadata, such as the profile-local date. */
export async function apiWithMeta<T, M>(path: string): Promise<{ data: T; meta: M }> {
	const res = await request(path);
	return (await res.json()) as { data: T; meta: M };
}

/**
 * Calls the auth API. Its answers are plain JSON (no `data` envelope) and its error
 * codes are lowercase snake_case. With `bearer` it sends the access token (and
 * renews the session once when it is rejected).
 */
export async function authApi<T>(
	path: string,
	options: { method?: string; body?: unknown; bearer?: boolean } = {}
): Promise<T> {
	const call = async () => {
		const headers: Record<string, string> = {};
		if (options.body !== undefined) headers['Content-Type'] = 'application/json';
		if (options.bearer && accessToken) headers.Authorization = `Bearer ${accessToken}`;
		try {
			return await fetch(`${AUTH_BASE}${path}`, {
				method: options.method ?? 'GET',
				headers,
				body: options.body === undefined ? undefined : JSON.stringify(options.body)
			});
		} catch {
			throw new ApiError(0, NETWORK_ERROR, 'Sin conexión.');
		}
	};
	let res = await call();
	if (res.status === 401 && options.bearer && (await errorCodeOf(res)) === 'unauthorized') {
		if (await refreshSession()) res = await call();
		else onSessionLost?.();
	}
	if (!res.ok) throw await toError(res);
	if (res.status === 204) return undefined as T;
	return (await res.json()) as T;
}
