// Receipts endpoints of the API (plan 18). Amounts travel as text ("2000.00")
// and the web works in integer cents.

import { api, apiBlob } from './client';
import { parseAmount, toInputValue, type Cents } from '#lib/domain/money.ts';
import type { ClientDocType, Receipt, ReceiptDraft, ReceiptSource } from '#lib/domain/receipts.ts';
import type { DocumentKind, StoredDocument } from '#lib/domain/documents.ts';

interface DocumentDto {
	id: string;
	kind: DocumentKind;
	file_name: string;
	size_bytes: number;
	uploaded_at: string;
}

interface ReceiptDto {
	id: string;
	series: string;
	number: string;
	issue_date: string;
	client: { name: string; doc_type: ClientDocType; doc_number: string };
	description: string;
	gross: string;
	withholding: string;
	collected_on: string | null;
	source: ReceiptSource;
	documents: DocumentDto[];
	created_at: string;
}

interface LimitDto {
	year: number;
	amount: string;
	is_default: boolean;
}

export interface YearLimit {
	amount: Cents;
	isDefault: boolean;
}

function cents(text: string): Cents {
	return parseAmount(text) ?? 0;
}

/** "2000.00": the API's amount format (always two decimals). */
function amountText(value: Cents): string {
	return toInputValue(value) || '0.00';
}

function toDocument(dto: DocumentDto): StoredDocument {
	return {
		id: dto.id,
		kind: dto.kind,
		fileName: dto.file_name,
		size: dto.size_bytes,
		uploadedAt: dto.uploaded_at
	};
}

function toReceipt(dto: ReceiptDto): Receipt {
	return {
		id: dto.id,
		series: dto.series,
		number: dto.number,
		issueDate: dto.issue_date,
		client: {
			name: dto.client.name,
			docType: dto.client.doc_type,
			docNumber: dto.client.doc_number
		},
		description: dto.description,
		gross: cents(dto.gross),
		withholding: cents(dto.withholding),
		collectedOn: dto.collected_on,
		source: dto.source,
		documents: dto.documents.map(toDocument),
		createdAt: dto.created_at
	};
}

function toBody(draft: ReceiptDraft) {
	return {
		series: draft.series,
		number: draft.number,
		issue_date: draft.issueDate,
		client: {
			name: draft.client.name,
			doc_type: draft.client.docType,
			doc_number: draft.client.docNumber
		},
		description: draft.description,
		gross: amountText(draft.gross),
		withholding: amountText(draft.withholding),
		collected_on: draft.collectedOn,
		source: draft.source
	};
}

export async function listReceipts(year: number): Promise<Receipt[]> {
	return (await api<ReceiptDto[]>(`/receipts?year=${year}`)).map(toReceipt);
}

export function receiptYears(): Promise<{ years: number[]; current_year: number }> {
	return api('/receipts/years');
}

export async function getReceipt(id: string): Promise<Receipt> {
	return toReceipt(await api<ReceiptDto>(`/receipts/${id}`));
}

/** The id is created here so that retrying never duplicates the receipt. */
export async function createReceipt(id: string, draft: ReceiptDraft): Promise<Receipt> {
	return toReceipt(
		await api<ReceiptDto>('/receipts', { method: 'POST', body: { id, ...toBody(draft) } })
	);
}

export async function updateReceipt(id: string, draft: ReceiptDraft): Promise<Receipt> {
	return toReceipt(
		await api<ReceiptDto>(`/receipts/${id}`, { method: 'PATCH', body: toBody(draft) })
	);
}

export async function setReceiptCollected(
	id: string,
	collectedOn: string | null
): Promise<Receipt> {
	const dto = await api<ReceiptDto>(`/receipts/${id}/collected`, {
		method: 'PUT',
		body: { collected_on: collectedOn }
	});
	return toReceipt(dto);
}

export function deleteReceipt(id: string): Promise<void> {
	return api(`/receipts/${id}`, { method: 'DELETE' });
}

export async function getYearLimit(year: number): Promise<YearLimit> {
	const dto = await api<LimitDto>(`/receipt-limits/${year}`);
	return { amount: cents(dto.amount), isDefault: dto.is_default };
}

export async function setYearLimit(year: number, amount: Cents): Promise<YearLimit> {
	const dto = await api<LimitDto>(`/receipt-limits/${year}`, {
		method: 'PUT',
		body: { amount: amountText(amount) }
	});
	return { amount: cents(dto.amount), isDefault: dto.is_default };
}

export async function uploadDocument(
	id: string,
	kind: DocumentKind,
	file: File
): Promise<StoredDocument> {
	const form = new FormData();
	form.append('file', file, file.name);
	return toDocument(
		await api<DocumentDto>(`/receipts/${id}/documents/${kind}`, { method: 'PUT', form })
	);
}

export function deleteDocument(id: string, kind: DocumentKind): Promise<void> {
	return api(`/receipts/${id}/documents/${kind}`, { method: 'DELETE' });
}

/** The file itself, to show it inside the page. */
export function documentContent(id: string, kind: DocumentKind): Promise<Blob> {
	return apiBlob(`/receipts/${id}/documents/${kind}/content`);
}

/** A short-lived signed R2 URL; with `download` the browser saves the file. */
export async function documentUrl(
	id: string,
	kind: DocumentKind,
	download: boolean
): Promise<string> {
	const data = await api<{ url: string }>(
		`/receipts/${id}/documents/${kind}/url${download ? '?download=1' : ''}`
	);
	return data.url;
}
