import { loadJson, newId, saveJson } from '#lib/data/storage.ts';
import { documentStorage } from '#lib/data/document-storage.ts';
import { seedReceipts } from '#lib/data/seed.ts';
import {
	DEFAULT_YEARLY_LIMIT,
	receiptCode,
	type Receipt,
	type ReceiptDraft
} from '#lib/domain/receipts.ts';
import {
	CONTENT_TYPE,
	looksLikePdf,
	receiptDocumentKey,
	validateDocumentFile,
	type DocumentKind,
	type StoredDocument
} from '#lib/domain/documents.ts';
import { parseRheXml, RheXmlError } from '#lib/domain/rhe-xml.ts';
import type { Cents } from '#lib/domain/money.ts';

const ITEMS_KEY = 'receipts';
const LIMITS_KEY = 'receipt-limits';

/** Receipts saved before documents existed have no `documents` field. */
function loadReceipts(): Receipt[] {
	return loadJson(ITEMS_KEY, seedReceipts).map((r) => ({ ...r, documents: r.documents ?? [] }));
}

class ReceiptsStore {
	items = $state<Receipt[]>(loadReceipts());
	/** Yearly cap by year; years without one use the default. */
	limits = $state<Record<string, Cents>>(loadJson(LIMITS_KEY, () => ({})));

	get(id: string): Receipt | undefined {
		return this.items.find((r) => r.id === id);
	}

	limitFor(year: number): Cents {
		return this.limits[String(year)] ?? DEFAULT_YEARLY_LIMIT;
	}

	setLimit(year: number, limit: Cents): void {
		this.limits[String(year)] = limit;
		saveJson(LIMITS_KEY, $state.snapshot(this.limits));
	}

	/** Saves the receipt and then its files. Returns the receipt and the first file problem, if any. */
	async add(
		draft: ReceiptDraft,
		files: Partial<Record<DocumentKind, File>> = {}
	): Promise<{ receipt: Receipt; error: string | null }> {
		const receipt: Receipt = {
			...draft,
			id: newId(),
			documents: [],
			createdAt: new Date().toISOString()
		};
		this.items.push(receipt);
		this.#save();

		let error: string | null = null;
		for (const [kind, file] of Object.entries(files) as [DocumentKind, File][]) {
			error ??= await this.attach(receipt.id, kind, file);
		}
		return { receipt, error };
	}

	update(id: string, draft: ReceiptDraft): void {
		const index = this.items.findIndex((r) => r.id === id);
		if (index < 0) return;
		this.items[index] = { ...this.items[index], ...draft };
		this.#save();
	}

	setCollected(id: string, collectedOn: string | null): void {
		const receipt = this.get(id);
		if (!receipt) return;
		receipt.collectedOn = collectedOn;
		this.#save();
	}

	remove(id: string): void {
		const receipt = this.get(id);
		receipt?.documents.forEach((d) => void documentStorage.remove(d.storageKey));
		this.items = this.items.filter((r) => r.id !== id);
		this.#save();
	}

	document(receiptId: string, kind: DocumentKind): StoredDocument | undefined {
		return this.get(receiptId)?.documents.find((d) => d.kind === kind);
	}

	/**
	 * Stores a file for the receipt, replacing the previous one of the same kind.
	 * Returns a message for the person when the file is not acceptable, or null.
	 */
	async attach(receiptId: string, kind: DocumentKind, file: File): Promise<string | null> {
		const receipt = this.get(receiptId);
		if (!receipt) return 'Este registro ya no existe.';

		const problem =
			validateDocumentFile(file, kind) ?? (await this.#checkContent(receipt, kind, file));
		if (problem) return problem;

		const id = newId();
		const document: StoredDocument = {
			id,
			kind,
			fileName: file.name,
			size: file.size,
			contentType: CONTENT_TYPE[kind],
			storageKey: receiptDocumentKey(receiptId, id, kind),
			uploadedAt: new Date().toISOString()
		};
		try {
			await documentStorage.put(document.storageKey, file);
		} catch {
			return 'No se pudo guardar el archivo. Inténtalo de nuevo.';
		}

		const previous = this.document(receiptId, kind);
		if (previous) void documentStorage.remove(previous.storageKey);
		receipt.documents = [...receipt.documents.filter((d) => d.kind !== kind), document];
		this.#save();
		return null;
	}

	async detach(receiptId: string, documentId: string): Promise<void> {
		const receipt = this.get(receiptId);
		const document = receipt?.documents.find((d) => d.id === documentId);
		if (!receipt || !document) return;
		receipt.documents = receipt.documents.filter((d) => d.id !== documentId);
		this.#save();
		await documentStorage.remove(document.storageKey);
	}

	/** The file's bytes, or null if storage no longer has them. */
	read(document: StoredDocument): Promise<Blob | null> {
		return documentStorage.get(document.storageKey);
	}

	reset(): void {
		this.items = seedReceipts();
		this.limits = {};
		this.#save();
		saveJson(LIMITS_KEY, {});
		void documentStorage.clear();
	}

	async #checkContent(receipt: Receipt, kind: DocumentKind, file: File): Promise<string | null> {
		if (kind === 'pdf') {
			return (await looksLikePdf(file)) ? null : 'El archivo no es un PDF válido.';
		}
		try {
			const parsed = parseRheXml(await file.text());
			const code = receiptCode(parsed);
			if (parsed.series && code.toUpperCase() !== receiptCode(receipt).toUpperCase()) {
				return `Este XML es del recibo ${code}, no del ${receiptCode(receipt)}.`;
			}
			return null;
		} catch (error) {
			return error instanceof RheXmlError ? error.message : 'No se pudo leer el archivo.';
		}
	}

	#save(): void {
		saveJson(ITEMS_KEY, $state.snapshot(this.items));
	}
}

export const receipts = new ReceiptsStore();
