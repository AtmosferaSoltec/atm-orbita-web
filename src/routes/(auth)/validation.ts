// Same messages and order as the Android sign-in (ORBITA_SPEC §4.1). The API
// checks everything again; these give an immediate answer.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
	return EMAIL.test(email.trim()) ? null : 'Escribe un correo válido.';
}

export function validatePassword(password: string): string | null {
	if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
	if (password.length > 128) return 'La contraseña puede tener hasta 128 caracteres.';
	return null;
}

export function validateName(name: string): string | null {
	if (!name.trim()) return 'Escribe tu nombre.';
	if (name.trim().length > 60) return 'El nombre puede tener hasta 60 caracteres.';
	return null;
}
