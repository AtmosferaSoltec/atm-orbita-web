import { api, apiWithMeta } from './client';
import { parseAmount, toInputValue, type Currency } from '#lib/domain/money.ts';
import type { Debtor, MovementDraft, PlannedAmount } from '#lib/domain/loans.ts';
interface DebtorDto {
	id: string;
	name: string;
	currency: Currency;
	share_token?: string | null;
	created_at: string;
	movements: {
		id: string;
		kind: 'loan' | 'payment';
		amount: string;
		date: string;
		applied_month: string | null;
		title: string;
		note: string;
		plan: { month: string; amount: string }[];
	}[];
}
function fromDto(d: DebtorDto): Debtor {
	return {
		id: d.id,
		name: d.name,
		currency: d.currency,
		publicToken: d.share_token ?? '',
		reference: null,
		createdAt: d.created_at,
		movements: d.movements.map((m) => ({
			id: m.id,
			kind: m.kind,
			currency: d.currency,
			amount: parseAmount(m.amount) ?? 0,
			date: m.date,
			appliedMonth: m.applied_month,
			title: m.title,
			note: m.note,
			plan: m.plan.map((p) => ({ month: p.month, amount: parseAmount(p.amount) ?? 0 }))
		}))
	};
}
function planBody(plan: PlannedAmount[]) {
	return plan.map((p) => ({ month: p.month, amount: toInputValue(p.amount) }));
}
function movementBody(d: MovementDraft) {
	return {
		kind: d.kind,
		amount: toInputValue(d.amount),
		date: d.date,
		applied_month: d.kind === 'payment' ? d.appliedMonth : null,
		title: d.title ?? '',
		note: d.note,
		plan: d.kind === 'loan' ? planBody(d.plan ?? []) : []
	};
}
export async function listDebtors(): Promise<{ items: Debtor[]; today: string }> {
	const result = await apiWithMeta<DebtorDto[], { today: string }>('/loan-debtors');
	return { items: result.data.map(fromDto), today: result.meta.today };
}
export async function createDebtor(id: string, name: string, currency: Currency): Promise<Debtor> {
	return fromDto(
		await api<DebtorDto>('/loan-debtors', { method: 'POST', body: { id, name, currency } })
	);
}
export async function renameDebtor(id: string, name: string): Promise<Debtor> {
	return fromDto(await api<DebtorDto>(`/loan-debtors/${id}`, { method: 'PATCH', body: { name } }));
}
export function deleteDebtor(id: string): Promise<void> {
	return api(`/loan-debtors/${id}`, { method: 'DELETE' });
}
export async function saveMovement(
	id: string,
	movementId: string,
	draft: MovementDraft,
	editing: boolean
): Promise<Debtor> {
	return fromDto(
		await api<DebtorDto>(`/loan-debtors/${id}/movements${editing ? `/${movementId}` : ''}`, {
			method: editing ? 'PATCH' : 'POST',
			body: { id: movementId, ...movementBody(draft) }
		})
	);
}
export async function removeMovement(id: string, movementId: string): Promise<Debtor> {
	return fromDto(
		await api<DebtorDto>(`/loan-debtors/${id}/movements/${movementId}`, { method: 'DELETE' })
	);
}
export async function setPlan(
	id: string,
	movementId: string,
	plan: PlannedAmount[]
): Promise<Debtor> {
	return fromDto(
		await api<DebtorDto>(`/loan-debtors/${id}/movements/${movementId}/plan`, {
			method: 'PUT',
			body: { plan: planBody(plan) }
		})
	);
}
export async function setShare(id: string, enabled: boolean): Promise<Debtor> {
	return fromDto(
		await api<DebtorDto>(`/loan-debtors/${id}/share`, { method: enabled ? 'PUT' : 'DELETE' })
	);
}
export async function sharedDebtor(token: string): Promise<Debtor> {
	return fromDto(
		await api<DebtorDto>(`/shared/loan-debtors/${encodeURIComponent(token)}`, { auth: false })
	);
}
