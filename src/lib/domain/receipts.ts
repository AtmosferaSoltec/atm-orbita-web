// Recibos por honorarios (RxH): each receipt counts towards a yearly cap measured on the gross amount.

import { applyRate, percentOf, sum, type Cents } from './money';
import { monthKey, parts, todayIso, type IsoDate } from './dates';
import type { StoredDocument } from './documents';

export const WITHHOLDING_BASIS_POINTS = 800; // 8% income-tax withholding (4ta categoría)
export const DEFAULT_YEARLY_LIMIT: Cents = 5_000_000; // S/ 50,000.00
export const WARNING_PERCENT = 80;

export type ClientDocType = 'RUC' | 'DNI' | 'OTRO';
export type ReceiptSource = 'xml' | 'manual';

export interface ReceiptClient {
	name: string;
	docType: ClientDocType;
	docNumber: string;
}

export interface Receipt {
	id: string;
	series: string;
	number: string;
	issueDate: IsoDate;
	client: ReceiptClient;
	description: string;
	gross: Cents;
	withholding: Cents;
	/** Day the client paid it; null while it is pending. */
	collectedOn: IsoDate | null;
	source: ReceiptSource;
	/** The XML it was read from and an optional PDF, at most one of each. */
	documents: StoredDocument[];
	createdAt: string;
}

export type ReceiptDraft = Omit<Receipt, 'id' | 'createdAt' | 'documents'>;

export type LimitLevel = 'ok' | 'warning' | 'exceeded';

export interface ClientTotal {
	key: string;
	name: string;
	docNumber: string;
	gross: Cents;
	count: number;
}

export interface MonthTotal {
	month: string;
	gross: Cents;
	/** Gross of receipts where the client withheld the 8%. */
	grossWithheld: Cents;
	/** Gross of receipts paid in full, without withholding. */
	grossNotWithheld: Cents;
	count: number;
}

export interface YearSummary {
	year: number;
	count: number;
	gross: Cents;
	withholding: Cents;
	net: Cents;
	pendingToCollect: Cents;
	limit: Cents;
	remaining: Cents;
	usedPercent: number;
	level: LimitLevel;
	byMonth: MonthTotal[];
	byClient: ClientTotal[];
}

export function receiptCode(receipt: Pick<Receipt, 'series' | 'number'>): string {
	return `${receipt.series}-${receipt.number}`;
}

export function netOf(receipt: Pick<Receipt, 'gross' | 'withholding'>): Cents {
	return receipt.gross - receipt.withholding;
}

export function withholdingFor(gross: Cents): Cents {
	return applyRate(gross, WITHHOLDING_BASIS_POINTS);
}

export function limitLevel(usedPercent: number): LimitLevel {
	if (usedPercent >= 100) return 'exceeded';
	if (usedPercent >= WARNING_PERCENT) return 'warning';
	return 'ok';
}

export function clientKey(client: ReceiptClient): string {
	return client.docNumber || client.name.trim().toLowerCase();
}

export function receiptsOfYear(receipts: Receipt[], year: number): Receipt[] {
	return receipts
		.filter((r) => parts(r.issueDate).year === year)
		.sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number));
}

export function summarizeYear(receipts: Receipt[], year: number, limit: Cents): YearSummary {
	const ofYear = receiptsOfYear(receipts, year);
	const gross = sum(ofYear.map((r) => r.gross));
	const withholding = sum(ofYear.map((r) => r.withholding));
	const usedPercent = percentOf(gross, limit);

	const byMonth = Array.from({ length: 12 }, (_, i) => {
		const key = monthKey(year, i + 1);
		const inMonth = ofYear.filter((r) => r.issueDate.startsWith(key));
		const grossWithheld = sum(inMonth.filter((r) => r.withholding > 0).map((r) => r.gross));
		const gross = sum(inMonth.map((r) => r.gross));
		return {
			month: key,
			gross,
			grossWithheld,
			grossNotWithheld: gross - grossWithheld,
			count: inMonth.length
		};
	});

	const clients = new Map<string, ClientTotal>();
	for (const receipt of ofYear) {
		const key = clientKey(receipt.client);
		const current = clients.get(key) ?? {
			key,
			name: receipt.client.name,
			docNumber: receipt.client.docNumber,
			gross: 0,
			count: 0
		};
		current.gross += receipt.gross;
		current.count += 1;
		clients.set(key, current);
	}

	return {
		year,
		count: ofYear.length,
		gross,
		withholding,
		net: gross - withholding,
		pendingToCollect: sum(ofYear.filter((r) => !r.collectedOn).map(netOf)),
		limit,
		remaining: Math.max(limit - gross, 0),
		usedPercent,
		level: limitLevel(usedPercent),
		byMonth,
		byClient: [...clients.values()].sort((a, b) => b.gross - a.gross)
	};
}

export function availableYears(receipts: Receipt[], currentYear: number): number[] {
	const years = new Set(receipts.map((r) => parts(r.issueDate).year));
	years.add(currentYear);
	return [...years].sort((a, b) => b - a);
}

export function isDuplicate(
	receipts: Receipt[],
	draft: Pick<Receipt, 'series' | 'number'>,
	ignoreId?: string
): boolean {
	const code = receiptCode(draft).toUpperCase();
	return receipts.some((r) => r.id !== ignoreId && receiptCode(r).toUpperCase() === code);
}

/** Returns the first problem, in the order the form shows its fields, or null when valid. */
export function validateReceipt(
	draft: ReceiptDraft,
	existing: Receipt[],
	ignoreId?: string,
	today: IsoDate = todayIso()
): string | null {
	if (!draft.series.trim() || !draft.number.trim())
		return 'Escribe la serie y el número del recibo.';
	if (isDuplicate(existing, draft, ignoreId))
		return 'Ya registraste un recibo con esa serie y número.';
	if (!draft.issueDate) return 'Elige la fecha de emisión.';
	if (draft.issueDate > today) return 'La fecha no puede ser posterior a hoy.';
	if (!draft.client.name.trim()) return 'Escribe el nombre del cliente.';
	if (draft.client.docType === 'RUC' && !/^\d{11}$/.test(draft.client.docNumber))
		return 'El RUC debe tener 11 dígitos.';
	if (draft.client.docType === 'DNI' && !/^\d{8}$/.test(draft.client.docNumber))
		return 'El DNI debe tener 8 dígitos.';
	if (draft.gross <= 0) return 'Escribe un monto mayor que cero.';
	if (draft.withholding < 0 || draft.withholding >= draft.gross)
		return 'La retención debe ser menor que el monto bruto.';
	if (draft.description.length > 500) return 'El texto puede tener hasta 500 caracteres.';
	if (draft.collectedOn && draft.collectedOn < draft.issueDate)
		return 'La fecha de cobro no puede ser anterior a la emisión.';
	return null;
}
