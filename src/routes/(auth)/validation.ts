// Same messages and order as the Android sign-in (ORBITA_SPEC §4.1): email, then password.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
	return EMAIL.test(email.trim()) ? null : 'Escribe un correo válido.';
}

export function validatePassword(password: string): string | null {
	if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
	if (password.length > 128) return 'La contraseña puede tener hasta 128 caracteres.';
	return null;
}

/** Fake latency so the mockup shows the loading state of the buttons. */
export function simulateRequest(ms = 600): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
