/** Cookies are shared across tabs. Serialize rotations across the whole origin
 * so two tabs cannot reuse the same refresh token and revoke the session. */
export function withSessionLock<T>(work: () => Promise<T>): Promise<T> {
	if (typeof navigator !== 'undefined' && navigator.locks) {
		return navigator.locks.request('orbita-session', work);
	}
	return work();
}
