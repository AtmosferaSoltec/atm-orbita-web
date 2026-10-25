import * as remote from '#lib/api/loans.ts';
import { ApiError, messageFor } from '#lib/api/errors.ts';
import { todayIso } from '#lib/domain/dates.ts';
import { newId } from '#lib/data/storage.ts';
import type { Currency } from '#lib/domain/money.ts';
import {
	validateDebtorName,
	validateMovement,
	validateLedger,
	validatePlan,
	type Debtor,
	type MovementDraft,
	type PlannedAmount
} from '#lib/domain/loans.ts';
class LoansStore {
	items = $state<Debtor[]>([]);
	today = $state(todayIso());
	loaded = $state(false);
	loading = $state(false);
	error = $state<string | null>(null);
	#generation = 0;
	#pending: Promise<void> | null = null;
	#queue: Promise<void> = Promise.resolve();
	get(id: string) {
		return this.items.find((d) => d.id === id);
	}
	#run<T>(work: () => Promise<T>, apply: (result: T) => void): Promise<T> {
		const generation = this.#generation;
		const guard = () => {
			if (generation !== this.#generation)
				throw new ApiError(401, 'SESSION_EXPIRED', 'Tu sesión terminó.');
		};
		const task = this.#queue.then(async () => {
			guard();
			const result = await work();
			guard();
			apply(result);
			return result;
		});
		this.#queue = task.then(
			() => undefined,
			() => undefined
		);
		return task;
	}
	load(force = false): Promise<void> {
		if (this.#pending) return this.#pending;
		if (this.loaded && !force) return Promise.resolve();
		const generation = this.#generation;
		this.loading = true;
		this.error = null;
		this.#pending = this.#run(remote.listDebtors, (result) => {
			this.items = result.items;
			this.today = result.today;
			this.loaded = true;
		})
			.then(() => undefined)
			.catch((failure) => {
				if (generation === this.#generation) this.error = messageFor(failure);
			})
			.finally(() => {
				if (generation === this.#generation) {
					this.loading = false;
					this.#pending = null;
				}
			});
		return this.#pending;
	}
	#put(d: Debtor) {
		this.items = [...this.items.filter((item) => item.id !== d.id), d];
	}
	add(name: string, currency: Currency, id: string): Promise<Debtor> {
		return this.#run(
			() => remote.createDebtor(id, name.trim(), currency),
			(d) => this.#put(d)
		);
	}
	async rename(id: string, name: string): Promise<string | null> {
		const error = validateDebtorName(name);
		if (error) return error;
		try {
			await this.#run(
				() => remote.renameDebtor(id, name.trim()),
				(d) => this.#put(d)
			);
			return null;
		} catch (failure) {
			return messageFor(failure);
		}
	}
	remove(id: string): Promise<void> {
		return this.#run(
			() => remote.deleteDebtor(id),
			() => {
				this.items = this.items.filter((d) => d.id !== id);
			}
		);
	}
	async saveMovement(
		id: string,
		draft: MovementDraft,
		editingId?: string,
		createId = newId()
	): Promise<string | null> {
		const debtor = this.get(id);
		if (!debtor) return 'No se encontró a la persona.';
		const error = validateMovement(debtor, draft, editingId, this.today);
		if (error) return error;
		try {
			await this.#run(
				() => remote.saveMovement(id, editingId ?? createId, draft, !!editingId),
				(d) => this.#put(d)
			);
			return null;
		} catch (failure) {
			return messageFor(failure);
		}
	}
	async removeMovement(id: string, movementId: string): Promise<string | null> {
		const debtor = this.get(id);
		if (!debtor) return 'No se encontró a la persona.';
		const error = validateLedger(debtor.movements.filter((m) => m.id !== movementId));
		if (error) return error;
		try {
			await this.#run(
				() => remote.removeMovement(id, movementId),
				(d) => this.#put(d)
			);
			return null;
		} catch (failure) {
			return messageFor(failure);
		}
	}
	async setPlan(id: string, movementId: string, plan: PlannedAmount[]): Promise<string | null> {
		const movement = this.get(id)?.movements.find((m) => m.id === movementId && m.kind === 'loan');
		if (!movement) return 'No se encontró el préstamo.';
		const error = validatePlan(movement.amount, plan);
		if (error) return error;
		try {
			await this.#run(
				() => remote.setPlan(id, movementId, plan),
				(d) => this.#put(d)
			);
			return null;
		} catch (failure) {
			return messageFor(failure);
		}
	}
	setShare(id: string, enabled: boolean): Promise<Debtor> {
		return this.#run(
			() => remote.setShare(id, enabled),
			(d) => this.#put(d)
		);
	}
	clear() {
		this.#generation++;
		this.items = [];
		this.today = todayIso();
		this.loaded = false;
		this.loading = false;
		this.error = null;
		this.#pending = null;
		this.#queue = Promise.resolve();
	}
}
export const loans = new LoansStore();
