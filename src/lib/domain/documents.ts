// Files attached to a record (the receipt's XML and its optional PDF). The metadata lives with the
// record; the bytes live in object storage under `storageKey` (Cloudflare R2 once the API exists).

export type DocumentKind = 'xml' | 'pdf';

export interface StoredDocument {
	id: string;
	kind: DocumentKind;
	fileName: string;
	size: number;
	contentType: string;
	/** Object key, laid out as in R2: `receipts/{receiptId}/{documentId}.{kind}`. */
	storageKey: string;
	uploadedAt: string;
}

export const MAX_DOCUMENT_BYTES: Record<DocumentKind, number> = {
	xml: 1_000_000,
	pdf: 5_000_000
};

export const DOCUMENT_ACCEPT: Record<DocumentKind, string> = {
	xml: '.xml,text/xml,application/xml',
	pdf: '.pdf,application/pdf'
};

export const CONTENT_TYPE: Record<DocumentKind, string> = {
	xml: 'application/xml',
	pdf: 'application/pdf'
};

export function receiptDocumentKey(
	receiptId: string,
	documentId: string,
	kind: DocumentKind
): string {
	return `receipts/${receiptId}/${documentId}.${kind}`;
}

/** First problem with a file chosen for `kind`, or null. Checks name and size, not content. */
export function validateDocumentFile(
	file: { name: string; size: number },
	kind: DocumentKind
): string | null {
	if (!file.name.toLowerCase().endsWith(`.${kind}`)) {
		return kind === 'xml'
			? 'Elige el archivo .xml del recibo.'
			: 'Elige el archivo .pdf del recibo.';
	}
	if (file.size === 0) return 'El archivo está vacío.';
	if (file.size > MAX_DOCUMENT_BYTES[kind]) {
		return `El archivo pesa más de ${formatFileSize(MAX_DOCUMENT_BYTES[kind])}.`;
	}
	return null;
}

/** A real PDF starts with `%PDF-`; this catches files that were only renamed. */
export async function looksLikePdf(blob: Blob): Promise<boolean> {
	const head = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
	return String.fromCharCode(...head) === '%PDF-';
}

/** `820 B`, `12 KB`, `1.4 MB` */
export function formatFileSize(bytes: number): string {
	if (bytes < 1000) return `${bytes} B`;
	if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
	return `${(Math.round(bytes / 100_000) / 10).toFixed(1)} MB`;
}
