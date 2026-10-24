// Receipts of the signed-in person, read from and written to the API. Keeps the
// years already loaded so moving between pages does not refetch everything.

import * as remote from '#lib/api/receipts.ts';
import { messageFor } from '#lib/api/errors.ts';
import { DEFAULT_YEARLY_LIMIT, type Receipt, type ReceiptDraft } from '#lib/domain/receipts.ts';
import { looksLikePdf, validateDocumentFile, type DocumentKind } from '#lib/domain/documents.ts';
import { parts } from '#lib/domain/dates.ts';
import type { Cents } from '#lib/domain/money.ts';

function yearOf(receipt: Pick<Receipt, 'issueDate'>): number {
	return parts(receipt.issueDate).year;
}

class ReceiptsStore {
	/** Receipts by year, newest first; a year is missing until it is loaded. */
	byYear = $state<Record<number, Receipt[]>>({});
	/** Receipts opened one by one (a detail page opened directly), by id. */
	byId = $state<Record<string, Receipt>>({});
	limits = $state<Record<number, remote.YearLimit>>({});
	years = $state<number[]>([]);
	currentYear = $state(new Date().getFullYear());

	itemsOf(year: number): Receipt[] | undefined {
		return this.byYear[year];
	}

	/** Every receipt loaded so far (for the duplicate check of the form). */
	get loaded(): Receipt[] {
		return Object.values(this.byYear).flat();
	}

	find(id: string): Receipt | undefined {
		return this.byId[id] ?? this.loaded.find((r) => r.id === id);
	}

	limitFor(year: number): Cents {
		return this.limits[year]?.amount ?? DEFAULT_YEARLY_LIMIT;
	}

	async loadYears(): Promise<void> {
		const data = await remote.receiptYears();
		this.years = data.years;
		this.currentYear = data.current_year;
	}

	async loadYear(year: number): Promise<Receipt[]> {
		const [items, limit] = await Promise.all([
			remote.listReceipts(year),
			remote.getYearLimit(year)
		]);
		this.byYear[year] = items;
		this.limits[year] = limit;
		return items;
	}

	async setLimit(year: number, amount: Cents): Promise<void> {
		this.limits[year] = await remote.setYearLimit(year, amount);
	}

	async get(id: string): Promise<Receipt> {
		const receipt = await remote.getReceipt(id);
		this.#put(receipt);
		return receipt;
	}

	/**
	 * Creates the receipt and then uploads its files. Returns the receipt and,
	 * if a file could not be saved, the message to show (the receipt stays).
	 */
	async add(
		draft: ReceiptDraft,
		files: Partial<Record<DocumentKind, File>> = {}
	): Promise<{ receipt: Receipt; error: string | null }> {
		let receipt = await remote.createReceipt(crypto.randomUUID(), draft);
		this.#put(receipt);
		let error: string | null = null;
		for (const [kind, file] of Object.entries(files) as [DocumentKind, File][]) {
			error ??= await this.attach(receipt.id, kind, file);
		}
		receipt = this.find(receipt.id) ?? receipt;
		return { receipt, error };
	}

	async update(id: string, draft: ReceiptDraft): Promise<Receipt> {
		const receipt = await remote.updateReceipt(id, draft);
		this.#put(receipt);
		return receipt;
	}

	async setCollected(id: string, collectedOn: string | null): Promise<void> {
		this.#put(await remote.setReceiptCollected(id, collectedOn));
	}

	async remove(id: string): Promise<void> {
		await remote.deleteReceipt(id);
		this.#drop(id);
	}

	/**
	 * Uploads a file for the receipt, replacing the previous one of the same kind.
	 * Returns a message for the person when it fails, or null.
	 */
	async attach(id: string, kind: DocumentKind, file: File): Promise<string | null> {
		const problem =
			validateDocumentFile(file, kind) ??
			(kind === 'pdf' && !(await looksLikePdf(file)) ? 'El archivo no es un PDF válido.' : null);
		if (problem) return problem;
		try {
			const document = await remote.uploadDocument(id, kind, file);
			const receipt = this.find(id);
			if (receipt) {
				this.#put({
					...receipt,
					documents: [...receipt.documents.filter((d) => d.kind !== kind), document]
				});
			}
			return null;
		} catch (error) {
			return messageFor(error);
		}
	}

	async detach(id: string, kind: DocumentKind): Promise<void> {
		await remote.deleteDocument(id, kind);
		const receipt = this.find(id);
		if (receipt)
			this.#put({ ...receipt, documents: receipt.documents.filter((d) => d.kind !== kind) });
	}

	read(id: string, kind: DocumentKind): Promise<Blob> {
		return remote.documentContent(id, kind);
	}

	downloadUrl(id: string, kind: DocumentKind): Promise<string> {
		return remote.documentUrl(id, kind, true);
	}

	/** Forget everything (on sign out: the next person must not see it). */
	clear(): void {
		this.byYear = {};
		this.byId = {};
		this.limits = {};
		this.years = [];
	}

	/** Puts a receipt in its year (and out of any other), keeping newest first. */
	#put(receipt: Receipt): void {
		this.#drop(receipt.id);
		this.byId[receipt.id] = receipt;
		const year = yearOf(receipt);
		if (!this.years.includes(year)) this.years = [...this.years, year].sort((a, b) => b - a);
		const list = this.byYear[year];
		if (!list) return;
		this.byYear[year] = [...list, receipt].sort(
			(a, b) => b.issueDate.localeCompare(a.issueDate) || Number(b.number) - Number(a.number)
		);
	}

	#drop(id: string): void {
		delete this.byId[id];
		for (const [year, list] of Object.entries(this.byYear)) {
			if (list.some((r) => r.id === id))
				this.byYear[Number(year)] = list.filter((r) => r.id !== id);
		}
	}
}

export const receipts = new ReceiptsStore();
