// Demo persistence in localStorage. Every access is guarded: storage can be missing or blocked
// (private windows, previews), and the app must keep working with the in-memory data.

const PREFIX = 'orbita:';

export function loadJson<T>(key: string, fallback: () => T): T {
	try {
		const raw = globalThis.localStorage?.getItem(PREFIX + key);
		if (raw) return JSON.parse(raw) as T;
	} catch {
		// fall through to the fallback
	}
	return fallback();
}

export function saveJson(key: string, value: unknown): void {
	try {
		globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
	} catch {
		// keep working in memory
	}
}

export function removeJson(key: string): void {
	try {
		globalThis.localStorage?.removeItem(PREFIX + key);
	} catch {
		// nothing to clean
	}
}

export function newId(): string {
	return crypto.randomUUID();
}

export function newToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}
