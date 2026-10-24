import { loadJson, newId, newToken, saveJson } from '#lib/data/storage.ts';
import { seedLoans } from '#lib/data/seed.ts';
import type { Loan, LoanDraft, LoanPayment } from '#lib/domain/loans.ts';

const KEY = 'loans';

class LoansStore {
	items = $state<Loan[]>(loadJson(KEY, seedLoans));

	get(id: string): Loan | undefined {
		return this.items.find((l) => l.id === id);
	}

	byToken(token: string): Loan | undefined {
		return this.items.find((l) => l.publicToken === token);
	}

	add(draft: LoanDraft): Loan {
		const loan: Loan = {
			...draft,
			id: newId(),
			publicToken: newToken(),
			payments: [],
			createdAt: new Date().toISOString()
		};
		this.items.push(loan);
		this.#save();
		return loan;
	}

	update(id: string, draft: LoanDraft): void {
		const index = this.items.findIndex((l) => l.id === id);
		if (index < 0) return;
		this.items[index] = { ...this.items[index], ...draft };
		this.#save();
	}

	remove(id: string): void {
		this.items = this.items.filter((l) => l.id !== id);
		this.#save();
	}

	addPayment(loanId: string, payment: Omit<LoanPayment, 'id'>): void {
		this.get(loanId)?.payments.push({ ...payment, id: newId() });
		this.#save();
	}

	removePayment(loanId: string, paymentId: string): void {
		const loan = this.get(loanId);
		if (!loan) return;
		loan.payments = loan.payments.filter((p) => p.id !== paymentId);
		this.#save();
	}

	/** A new token invalidates the previous public link. */
	regenerateLink(loanId: string): void {
		const loan = this.get(loanId);
		if (!loan) return;
		loan.publicToken = newToken();
		this.#save();
	}

	reset(): void {
		this.items = seedLoans();
		this.#save();
	}

	#save(): void {
		saveJson(KEY, $state.snapshot(this.items));
	}
}

export const loans = new LoansStore();
