import { loadJson, newId, saveJson } from '#lib/data/storage.ts';
import { seedReceipts } from '#lib/data/seed.ts';
import { DEFAULT_YEARLY_LIMIT, type Receipt, type ReceiptDraft } from '#lib/domain/receipts.ts';
import type { Cents } from '#lib/domain/money.ts';

const ITEMS_KEY = 'receipts';
const LIMITS_KEY = 'receipt-limits';

class ReceiptsStore {
	items = $state<Receipt[]>(loadJson(ITEMS_KEY, seedReceipts));
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

	add(draft: ReceiptDraft): Receipt {
		const receipt: Receipt = { ...draft, id: newId(), createdAt: new Date().toISOString() };
		this.items.push(receipt);
		this.#save();
		return receipt;
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
		this.items = this.items.filter((r) => r.id !== id);
		this.#save();
	}

	reset(): void {
		this.items = seedReceipts();
		this.limits = {};
		this.#save();
		saveJson(LIMITS_KEY, {});
	}

	#save(): void {
		saveJson(ITEMS_KEY, $state.snapshot(this.items));
	}
}

export const receipts = new ReceiptsStore();
