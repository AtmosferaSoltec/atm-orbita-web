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
	DEBTOR_CURRENCY_LOCKED: 'La moneda del deudor es fija. Crea otra ficha para usar otra moneda.',
	LOAN_KIND_LOCKED: 'No se puede cambiar un préstamo por un abono ni al revés.',
	LOAN_BALANCE_EXCEEDED:
		'Los abonos no pueden superar lo prestado en esa fecha. Actualiza la ficha y revisa los montos.',

	SERVICE_CURRENCY_LOCKED: 'La moneda no se puede cambiar mientras existan pagos registrados.',
	GOOGLE_UNAVAILABLE: 'El acceso con Google no está disponible en este momento.',
	GOOGLE_INVALID: 'No pudimos verificar tu cuenta de Google. Vuelve a continuar con Google.',
	GOOGLE_CHALLENGE_EXPIRED: 'El intento de acceso venció. Vuelve a continuar con Google.',
	GOOGLE_LINK_REQUIRED: 'Confirma tu contraseña de Orbita para vincular Google.',
	GOOGLE_IDENTITY_CONFLICT:
		'Tu cuenta ya tiene otra cuenta de Google vinculada. Usa esa cuenta o ingresa con contraseña.',

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
	DEBTOR_NAME_REQUIRED: 'Escribe el nombre de la persona.',
	LOAN_DATE_INVALID: 'Elige una fecha válida hasta hoy.',
	LOAN_PAYMENT_MONTH_INVALID: 'Elige el mes al que corresponde el abono.',
	LOAN_PLAN_INVALID: 'Revisa el reparto mensual del préstamo.',
	LOAN_PLAN_MONTH_INVALID: 'Elige meses válidos y no repitas un mes en el mismo préstamo.',
	LOAN_PLAN_EXCEEDS_TOTAL: 'El reparto no puede superar el total de este préstamo.',
	LOAN_TITLE_TOO_LONG: 'El concepto puede tener hasta 100 caracteres.',
	LOAN_KIND_INVALID: 'Elige un préstamo o un abono.',
	LOAN_TOTAL_TOO_LARGE: 'El total supera el monto permitido.',

	SERVICE_NAME_REQUIRED: 'Escribe un nombre para el servicio.',
	SERVICE_COLOR_INVALID: 'Elige un color para el servicio.',
	BILLING_DAY_INVALID: 'Elige un día de cobro entre 1 y 31.',
	SERVICE_DATE_INVALID: 'Elige una fecha de inicio válida.',
	SERVICE_STATUS_INVALID: 'Elige un estado válido.',
	SERVICE_END_INVALID: 'Elige una fecha de último cobro igual o posterior al inicio.',
	SERVICE_MEMBERS_REQUIRED: 'Agrega entre 1 y 100 personas con quienes lo compartes.',
	SERVICE_MEMBER_INVALID: 'Revisa las personas del servicio e inténtalo de nuevo.',
	SERVICE_MEMBER_NAME_INVALID: 'Escribe un nombre de hasta 60 caracteres para cada persona.',
	SERVICE_MEMBER_MONTH_INVALID:
		'Cada persona debe empezar a pagar desde el mes de inicio del servicio o después.',
	SERVICE_SHARES_EXCEED_TOTAL: 'Lo que pagan los demás no puede superar el costo del servicio.',
	SERVICE_NOTE_TOO_LONG: 'La nota puede tener hasta 500 caracteres.',
	SERVICE_PAYMENT_MONTH_INVALID:
		'Solo puedes registrar meses que correspondan al servicio y ya se hayan cobrado.',
	SERVICE_PAYMENT_DATE_INVALID: 'Elige una fecha de pago entre el inicio del servicio y hoy.',
	SERVICE_PAYMENTS_REQUIRED: 'Selecciona al menos un mes para registrar el pago.',

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
