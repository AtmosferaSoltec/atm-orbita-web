// The app picks the text from the API's stable `code` (like Android): the API's
// `message` is only a fallback.

export interface FieldProblem {
	field: string;
	code: string;
}

export class ApiError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		message: string,
		readonly fields: FieldProblem[] = []
	) {
		super(message);
	}
}

export const NETWORK_ERROR = 'NETWORK';

const MESSAGES: Record<string, string> = {
	INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
	EMAIL_ALREADY_REGISTERED: 'Ese correo ya tiene una cuenta. Inicia sesión.',
	RESET_CODE_INVALID: 'El código no es válido o ya venció. Pide uno nuevo.',
	SESSION_EXPIRED: 'Tu sesión terminó. Inicia sesión de nuevo.',
	UNAUTHORIZED: 'Tu sesión terminó. Inicia sesión de nuevo.',
	TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento.',
	NOT_FOUND: 'Este registro ya no existe.',
	ID_CONFLICT: 'Ya existe un registro con ese identificador.',
	PAYLOAD_TOO_LARGE: 'El archivo es demasiado grande.',
	RECEIPT_ALREADY_EXISTS: 'Ya registraste un recibo con esa serie y número.',
	XML_RECEIPT_MISMATCH: 'Este XML es de otro recibo.',
	FILE_INVALID: 'El archivo no es válido para este recibo.',
	STORAGE_UNAVAILABLE: 'No se pueden guardar archivos en este momento. Inténtalo más tarde.',
	DATABASE_UNAVAILABLE: 'El servicio no está disponible. Inténtalo en unos minutos.',
	[NETWORK_ERROR]: 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'
};

const FIELD_MESSAGES: Record<string, string> = {
	EMAIL_INVALID: 'Escribe un correo válido.',
	PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres.',
	PASSWORD_TOO_LONG: 'La contraseña puede tener hasta 128 caracteres.',
	PASSWORD_REQUIRED: 'Escribe tu contraseña.',
	NAME_TOO_LONG: 'El nombre puede tener hasta 60 caracteres.',
	CURRENCY_NOT_SUPPORTED: 'Elige una moneda de la lista.',
	SERIES_REQUIRED: 'Escribe la serie y el número del recibo.',
	SERIES_TOO_LONG: 'La serie puede tener hasta 4 caracteres.',
	NUMBER_REQUIRED: 'Escribe la serie y el número del recibo.',
	NUMBER_INVALID: 'El número del recibo solo lleva dígitos (hasta 8).',
	ISSUE_DATE_REQUIRED: 'Elige la fecha de emisión.',
	DATE_IN_FUTURE: 'La fecha no puede ser posterior a hoy.',
	CLIENT_NAME_REQUIRED: 'Escribe el nombre del cliente.',
	CLIENT_NAME_TOO_LONG: 'El nombre del cliente puede tener hasta 200 caracteres.',
	DOC_TYPE_INVALID: 'Elige el tipo de documento del cliente.',
	RUC_INVALID: 'El RUC debe tener 11 dígitos.',
	DNI_INVALID: 'El DNI debe tener 8 dígitos.',
	DOC_NUMBER_TOO_LONG: 'El documento puede tener hasta 15 caracteres.',
	AMOUNT_INVALID: 'Escribe un monto mayor que cero.',
	WITHHOLDING_INVALID: 'La retención debe ser menor que el monto bruto.',
	DESCRIPTION_TOO_LONG: 'El texto puede tener hasta 500 caracteres.',
	COLLECTED_BEFORE_ISSUE: 'La fecha de cobro no puede ser anterior a la emisión.',
	YEAR_INVALID: 'Elige un año válido.'
};

const FALLBACK = 'Algo salió mal. Inténtalo de nuevo.';

/** The text to show for any error thrown by the API client (or anything else). */
export function messageFor(error: unknown): string {
	if (!(error instanceof ApiError)) return FALLBACK;
	if (error.code === 'VALIDATION_FAILED') {
		const first = error.fields[0];
		return (first && FIELD_MESSAGES[first.code]) || error.message || FALLBACK;
	}
	return MESSAGES[error.code] ?? (error.message || FALLBACK);
}

export function isApiError(error: unknown, code: string): boolean {
	return error instanceof ApiError && error.code === code;
}
