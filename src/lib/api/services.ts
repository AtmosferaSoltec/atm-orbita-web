import { api, apiWithMeta } from './client';
import { parseAmount, toInputValue } from '#lib/domain/money.ts';
import type { MemberPayment, Service, ServiceDraft } from '#lib/domain/services.ts';

interface ServiceDto {
	id: string;
	name: string;
	color: string;
	currency: Service['currency'];
	amount: string;
	billing_day: number;
	started_on: string;
	status: Service['status'];
	ended_on: string | null;
	note: string;
	shared: boolean;
	created_at: string;
	members: { id: string; name: string; amount: string; since: string }[];
	member_payments: {
		id: string;
		member_id: string;
		month: string;
		paid_on: string;
		amount: string;
	}[];
}
function fromDto(s: ServiceDto): Service {
	return {
		id: s.id,
		name: s.name,
		color: s.color,
		currency: s.currency,
		amount: parseAmount(s.amount) ?? 0,
		billingDay: s.billing_day,
		startedOn: s.started_on,
		status: s.status,
		endedOn: s.ended_on,
		note: s.note,
		shared: s.shared,
		createdAt: s.created_at,
		members: s.members.map((m) => ({ ...m, amount: parseAmount(m.amount) ?? 0 })),
		memberPayments: s.member_payments.map((p) => ({
			id: p.id,
			memberId: p.member_id,
			month: p.month,
			paidOn: p.paid_on,
			amount: parseAmount(p.amount) ?? 0
		}))
	};
}
function toBody(s: ServiceDraft) {
	return {
		name: s.name,
		color: s.color,
		currency: s.currency,
		amount: toInputValue(s.amount),
		billing_day: s.billingDay,
		started_on: s.startedOn,
		status: s.status,
		ended_on: s.endedOn,
		note: s.note,
		shared: s.shared,
		members: s.members.map((m) => ({ ...m, amount: toInputValue(m.amount) }))
	};
}
export async function listServices(): Promise<{ items: Service[]; today: string }> {
	const result = await apiWithMeta<ServiceDto[], { today: string }>('/services');
	return { items: result.data.map(fromDto), today: result.meta.today };
}
export async function createService(id: string, draft: ServiceDraft): Promise<Service> {
	return fromDto(
		await api<ServiceDto>('/services', { method: 'POST', body: { id, ...toBody(draft) } })
	);
}
export async function updateService(id: string, draft: ServiceDraft): Promise<Service> {
	return fromDto(
		await api<ServiceDto>(`/services/${id}`, { method: 'PATCH', body: toBody(draft) })
	);
}
export function deleteService(id: string): Promise<void> {
	return api(`/services/${id}`, { method: 'DELETE' });
}
export async function markPaid(
	id: string,
	payments: Omit<MemberPayment, 'id'>[]
): Promise<Service> {
	return fromDto(
		await api<ServiceDto>(`/services/${id}/payments`, {
			method: 'PUT',
			body: {
				payments: payments.map((p) => ({
					member_id: p.memberId,
					month: p.month,
					paid_on: p.paidOn
				}))
			}
		})
	);
}
export async function unmarkPaid(id: string, memberId: string, month: string): Promise<Service> {
	return fromDto(
		await api<ServiceDto>(`/services/${id}/members/${memberId}/payments/${month}`, {
			method: 'DELETE'
		})
	);
}
