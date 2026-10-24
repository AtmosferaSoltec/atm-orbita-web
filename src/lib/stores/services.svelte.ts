import * as remote from '#lib/api/services.ts';
import type { MemberPayment, Service, ServiceDraft } from '#lib/domain/services.ts';
import { todayIso, type MonthKey } from '#lib/domain/dates.ts';
import { messageFor } from '#lib/api/errors.ts';

class ServicesStore {
	items = $state<Service[]>([]);
	today = $state(todayIso());
	loaded = $state(false);
	loading = $state(false);
	error = $state<string | null>(null);
	#pending: Promise<void> | null = null;
	#generation = 0;

	get(id: string): Service | undefined {
		return this.items.find((s) => s.id === id);
	}
	load(force = false): Promise<void> {
		if (this.#pending) return this.#pending;
		if (this.loaded && !force) return Promise.resolve();
		const generation = this.#generation;
		this.loading = true;
		this.error = null;
		this.#pending = (async () => {
			try {
				const data = await remote.listServices();
				if (generation !== this.#generation) return;
				this.items = data.items;
				this.today = data.today;
				this.loaded = true;
			} catch (failure) {
				if (generation === this.#generation) this.error = messageFor(failure);
			} finally {
				if (generation === this.#generation) {
					this.loading = false;
					this.#pending = null;
				}
			}
		})();
		return this.#pending;
	}
	async add(draft: ServiceDraft, id: string): Promise<Service> {
		const generation = this.#generation;
		const service = await remote.createService(id, draft);
		this.#put(service, generation);
		return service;
	}
	async update(id: string, draft: ServiceDraft): Promise<void> {
		const generation = this.#generation;
		this.#put(await remote.updateService(id, draft), generation);
	}
	async remove(id: string): Promise<void> {
		const generation = this.#generation;
		await remote.deleteService(id);
		if (generation === this.#generation) this.items = this.items.filter((s) => s.id !== id);
	}
	async markPaid(id: string, payments: Omit<MemberPayment, 'id'>[]): Promise<void> {
		const generation = this.#generation;
		this.#put(await remote.markPaid(id, payments), generation);
	}
	async unmarkPaid(id: string, memberId: string, month: MonthKey): Promise<void> {
		const generation = this.#generation;
		this.#put(await remote.unmarkPaid(id, memberId, month), generation);
	}
	clear(): void {
		this.#generation++;
		this.items = [];
		this.today = todayIso();
		this.loaded = false;
		this.loading = false;
		this.error = null;
		this.#pending = null;
	}
	#put(service: Service, generation: number): void {
		if (generation !== this.#generation) return;
		this.items = [...this.items.filter((s) => s.id !== service.id), service];
	}
}
export const services = new ServicesStore();
