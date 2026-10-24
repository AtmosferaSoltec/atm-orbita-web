// Talks to the Orbita API (atm-orbita-api). The access token lives only in
// memory; the refresh token is an HttpOnly cookie that JavaScript never sees
// (API plan 17). In development Vite proxies /api to the local API, so the
// browser sees a single origin.

import { ApiError, NETWORK_ERROR, type FieldProblem } from './errors';
import { withSessionLock } from './session-lock';

const BASE = '/api/v1';
const SESSION_HEADERS = { 'X-Session-Transport': 'cookie' };

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let onSessionLost: (() => void) | null = null;

interface TokensPayload {
	access_token: string;
}

export function setAccessToken(token: string | null): void {
	accessToken = token;
}

export function hasAccessToken(): boolean {
	return accessToken !== null;
}

/** Called when the session can no longer be renewed (to send the person to login). */
export function whenSessionLost(callback: () => void): void {
	onSessionLost = callback;
}

/** Renews the access token with the cookie. Only one renewal runs at a time. */
export function refreshSession(): Promise<boolean> {
	refreshing ??= withSessionLock(async () => {
		try {
			const res = await fetch(`${BASE}/auth/refresh`, {
				method: 'POST',
				headers: SESSION_HEADERS,
				credentials: 'same-origin'
			});
			if (!res.ok) {
				accessToken = null;
				return false;
			}
			const body = (await res.json()) as { data: { tokens: TokensPayload } };
			accessToken = body.data.tokens.access_token;
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
	/** Public endpoints (login, register…) do not send the token nor retry. */
	auth?: boolean;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
	const headers: Record<string, string> = { ...SESSION_HEADERS };
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

/** Sends a request; on 401 renews the session once and retries. */
async function request(path: string, options: RequestOptions = {}): Promise<Response> {
	let res = await (path.startsWith('/auth/') && options.method === 'POST'
		? withSessionLock(() => send(path, options))
		: send(path, options));
	if (res.status === 401 && options.auth !== false) {
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
