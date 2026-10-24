// Money is always an integer number of cents (céntimos). Never use floats for amounts.

export type Cents = number;
export type Currency = 'PEN' | 'USD';

export const CURRENCIES: Currency[] = ['PEN', 'USD'];

export const CURRENCY_SYMBOL: Record<Currency, string> = {
	PEN: 'S/',
	USD: 'US$'
};

export const CURRENCY_NAME: Record<Currency, string> = {
	PEN: 'Soles',
	USD: 'Dólares'
};

const MINUS = '−';

function groupThousands(digits: string): string {
	return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Digits only, without symbol: `1,245.80`. */
export function formatNumber(cents: Cents): string {
	const abs = Math.abs(cents);
	const units = Math.floor(abs / 100);
	const decimals = String(abs % 100).padStart(2, '0');
	return `${groupThousands(String(units))}.${decimals}`;
}

/**
 * `S/ 1,245.80`. With `signed`, positives get `+` and negatives the typographic minus (U+2212).
 */
export function formatMoney(
	cents: Cents,
	currency: Currency = 'PEN',
	options: { signed?: boolean } = {}
): string {
	const body = `${CURRENCY_SYMBOL[currency]} ${formatNumber(cents)}`;
	if (cents < 0) return `${MINUS}${body}`;
	if (options.signed && cents > 0) return `+${body}`;
	return body;
}

/**
 * Parses what a person types: accepts `.` or `,` as the decimal separator and up to 2 decimals.
 * `1,245.80`, `1245,8`, `1500` and `1,500` (thousands) are all valid. Returns null when invalid.
 */
export function parseAmount(input: string): Cents | null {
	let text = input.trim().replace(/\s/g, '');
	if (!text) return null;
	if (!/^\d[\d.,]*$/.test(text)) return null;

	const lastDot = text.lastIndexOf('.');
	const lastComma = text.lastIndexOf(',');
	let integer = text;
	let decimals = '';
	if (lastDot >= 0 && lastComma >= 0) {
		const decimalAt = Math.max(lastDot, lastComma);
		integer = text.slice(0, decimalAt);
		decimals = text.slice(decimalAt + 1);
		if (/[.,]/.test(decimals) || integer.includes(text[decimalAt])) return null;
	} else if (lastDot >= 0 || lastComma >= 0) {
		const groups = text.split(lastDot >= 0 ? '.' : ',');
		if (groups.length === 2 && groups[1].length <= 2) {
			[integer, decimals] = groups;
			decimals ||= '0';
		}
	}
	// Thousands separators must split the integer part in groups of exactly 3 digits.
	if (/[.,]/.test(integer)) {
		if (!/^\d{1,3}([.,]\d{3})+$/.test(integer)) return null;
		integer = integer.replace(/[.,]/g, '');
	}
	text = decimals ? `${integer}.${decimals}` : integer;

	const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(text);
	if (!match) return null;
	const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
	return Number.isSafeInteger(cents) ? cents : null;
}

/** Value for an input field: `1245.80`, or empty for 0/null. */
export function toInputValue(cents: Cents | null | undefined): string {
	if (!cents) return '';
	return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export function sum(values: Cents[]): Cents {
	return values.reduce((acc, value) => acc + value, 0);
}

/** Percentage with one decimal (`37.2`). Returns 0 when the total is 0. */
export function percentOf(part: Cents, total: Cents): number {
	if (total <= 0) return 0;
	return Math.round((part * 1000) / total) / 10;
}

/** Rate in basis points (800 = 8%), rounded half up to the cent. */
export function applyRate(cents: Cents, basisPoints: number): Cents {
	return Math.round((cents * basisPoints) / 10_000);
}

/** Splits a total in `parts` amounts that add up exactly (the first ones absorb the remainder). */
export function splitEvenly(total: Cents, parts: number): Cents[] {
	if (parts <= 0) return [];
	const base = Math.floor(total / parts);
	const remainder = total - base * parts;
	return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}
