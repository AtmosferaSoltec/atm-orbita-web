import { loadJson, newId, saveJson } from '#lib/data/storage.ts';
import { seedServices } from '#lib/data/seed.ts';
import type { MemberPayment, Service, ServiceDraft } from '#lib/domain/services.ts';
import type { MonthKey } from '#lib/domain/dates.ts';

const KEY = 'services';

class ServicesStore {
	items = $state<Service[]>(loadJson(KEY, seedServices));

	get(id: string): Service | undefined {
		return this.items.find((s) => s.id === id);
	}

	add(draft: ServiceDraft): Service {
		const service: Service = {
			...draft,
			id: newId(),
			memberPayments: [],
			createdAt: new Date().toISOString()
		};
		this.items.push(service);
		this.#save();
		return service;
	}

	update(id: string, draft: ServiceDraft): void {
		const index = this.items.findIndex((s) => s.id === id);
		if (index < 0) return;
		const current = this.items[index];
		const memberIds = new Set(draft.members.map((m) => m.id));
		this.items[index] = {
			...current,
			...draft,
			// Payments of removed members go away with them.
			memberPayments: current.memberPayments.filter((p) => memberIds.has(p.memberId))
		};
		this.#save();
	}

	remove(id: string): void {
		this.items = this.items.filter((s) => s.id !== id);
		this.#save();
	}

	markPaid(serviceId: string, payments: Omit<MemberPayment, 'id'>[]): void {
		const service = this.get(serviceId);
		if (!service) return;
		for (const payment of payments) {
			const exists = service.memberPayments.some(
				(p) => p.memberId === payment.memberId && p.month === payment.month
			);
			if (!exists) service.memberPayments.push({ ...payment, id: newId() });
		}
		this.#save();
	}

	unmarkPaid(serviceId: string, memberId: string, month: MonthKey): void {
		const service = this.get(serviceId);
		if (!service) return;
		service.memberPayments = service.memberPayments.filter(
			(p) => !(p.memberId === memberId && p.month === month)
		);
		this.#save();
	}

	reset(): void {
		this.items = seedServices();
		this.#save();
	}

	#save(): void {
		saveJson(KEY, $state.snapshot(this.items));
	}
}

export const services = new ServicesStore();
