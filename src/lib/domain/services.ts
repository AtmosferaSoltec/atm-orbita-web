// Monthly services (subscriptions). A shared service splits its cost: each member owes a fixed
// amount every month, from the month they joined, once that month's charge day has arrived.

import { sum, type Cents, type Currency } from './money';
import {
	addMonths,
	daysBetween,
	dateInMonth,
	monthRange,
	toMonthKey,
	todayIso,
	type IsoDate,
	type MonthKey
} from './dates';

export const UPCOMING_DAYS = 7;
export const HISTORY_MONTHS = 12;

export type ServiceStatus = 'active' | 'paused' | 'cancelled';

export interface ServiceMember {
	id: string;
	name: string;
	amount: Cents;
	/** First month this person owes. */
	since: MonthKey;
}

export interface MemberPayment {
	id: string;
	memberId: string;
	month: MonthKey;
	paidOn: IsoDate;
	amount: Cents;
}

export interface Service {
	id: string;
	name: string;
	category: string;
	color: string;
	currency: Currency;
	amount: Cents;
	/** Day of the month it is charged (1–31; short months use their last day). */
	billingDay: number;
	startedOn: IsoDate;
	status: ServiceStatus;
	/** Last month charged when cancelled. */
	endedOn: IsoDate | null;
	note: string;
	shared: boolean;
	members: ServiceMember[];
	memberPayments: MemberPayment[];
	createdAt: string;
}

export type ServiceDraft = Omit<Service, 'id' | 'memberPayments' | 'createdAt'>;

export type MonthStatus = 'paid' | 'owed' | 'upcoming';

export interface MemberMonth {
	month: MonthKey;
	dueDate: IsoDate;
	status: MonthStatus;
	payment: MemberPayment | null;
}

export interface MemberStatus {
	member: ServiceMember;
	months: MemberMonth[];
	owedMonths: MonthKey[];
	owedAmount: Cents;
	lastPayment: MemberPayment | null;
	paidTotal: Cents;
}

export const SERVICE_COLORS = [
	'#1D4ED8',
	'#0E7490',
	'#B45309',
	'#BE185D',
	'#7C3AED',
	'#0B7A5A',
	'#E53935',
	'#0E1A2B',
	'#64748B'
];

export const SERVICE_CATEGORIES = [
	'Software',
	'Inteligencia artificial',
	'Entretenimiento',
	'Música',
	'Nube y hosting',
	'Hogar',
	'Otros'
];

/** The month the service stops being charged, or the current month while it is active. */
function lastChargedMonth(service: Service, today: IsoDate): MonthKey {
	if (service.status === 'cancelled' && service.endedOn) return toMonthKey(service.endedOn);
	return toMonthKey(today);
}

export function nextChargeDate(service: Service, today: IsoDate = todayIso()): IsoDate | null {
	if (service.status !== 'active') return null;
	let month = toMonthKey(today);
	if (month < toMonthKey(service.startedOn)) month = toMonthKey(service.startedOn);
	let date = dateInMonth(month, service.billingDay);
	if (date < today || date < service.startedOn)
		date = dateInMonth(addMonths(month, 1), service.billingDay);
	return date;
}

/** Charge dates from the start until today (or until it was cancelled). */
export function chargeDates(service: Service, today: IsoDate = todayIso()): IsoDate[] {
	const until = service.status === 'cancelled' && service.endedOn ? service.endedOn : today;
	return monthRange(toMonthKey(service.startedOn), toMonthKey(until))
		.map((month) => dateInMonth(month, service.billingDay))
		.filter((date) => date >= service.startedOn && date <= until);
}

export function totalSpent(service: Service, today: IsoDate = todayIso()): Cents {
	return chargeDates(service, today).length * service.amount;
}

export function lastChargeDate(service: Service, today: IsoDate = todayIso()): IsoDate | null {
	return chargeDates(service, today).at(-1) ?? null;
}

/** What I pay myself after the members' shares. */
export function myShare(service: Pick<Service, 'amount' | 'shared' | 'members'>): Cents {
	if (!service.shared) return service.amount;
	return service.amount - sum(service.members.map((m) => m.amount));
}

export function memberStatus(
	service: Service,
	member: ServiceMember,
	today: IsoDate = todayIso()
): MemberStatus {
	const payments = service.memberPayments.filter((p) => p.memberId === member.id);
	const byMonth = new Map(payments.map((p) => [p.month, p]));
	const until = lastChargedMonth(service, today);

	const months = monthRange(member.since, until).map((month): MemberMonth => {
		const dueDate = dateInMonth(month, service.billingDay);
		const payment = byMonth.get(month) ?? null;
		let status: MonthStatus = 'upcoming';
		if (payment) status = 'paid';
		else if (dueDate <= today && service.status !== 'paused') status = 'owed';
		return { month, dueDate, status, payment };
	});

	const owedMonths = months.filter((m) => m.status === 'owed').map((m) => m.month);
	const lastPayment = [...payments].sort((a, b) => b.month.localeCompare(a.month))[0] ?? null;

	return {
		member,
		months,
		owedMonths,
		owedAmount: owedMonths.length * member.amount,
		lastPayment,
		paidTotal: sum(payments.map((p) => p.amount))
	};
}

export function membersStatus(service: Service, today: IsoDate = todayIso()): MemberStatus[] {
	if (!service.shared) return [];
	return service.members.map((m) => memberStatus(service, m, today));
}

export function owedToMe(service: Service, today: IsoDate = todayIso()): Cents {
	return sum(membersStatus(service, today).map((s) => s.owedAmount));
}

export interface UpcomingCharge {
	service: Service;
	date: IsoDate;
	inDays: number;
}

export function upcomingCharges(
	services: Service[],
	today: IsoDate = todayIso(),
	days = UPCOMING_DAYS
): UpcomingCharge[] {
	return services
		.map((service) => ({ service, date: nextChargeDate(service, today) }))
		.filter((c): c is { service: Service; date: IsoDate } => c.date !== null)
		.map((c) => ({ ...c, inDays: daysBetween(today, c.date) }))
		.filter((c) => c.inDays <= days)
		.sort((a, b) => a.date.localeCompare(b.date));
}

export function monthlyTotals(
	services: Service[]
): Record<Currency, { total: Cents; mine: Cents }> {
	const totals: Record<Currency, { total: Cents; mine: Cents }> = {
		PEN: { total: 0, mine: 0 },
		USD: { total: 0, mine: 0 }
	};
	for (const service of services.filter((s) => s.status === 'active')) {
		totals[service.currency].total += service.amount;
		totals[service.currency].mine += myShare(service);
	}
	return totals;
}

export function validateService(draft: ServiceDraft): string | null {
	if (!draft.name.trim()) return 'Escribe un nombre.';
	if (draft.name.length > 60) return 'El nombre puede tener hasta 60 caracteres.';
	if (draft.amount <= 0) return 'Escribe un monto mayor que cero.';
	if (draft.billingDay < 1 || draft.billingDay > 31) return 'Elige un día de cobro entre 1 y 31.';
	if (!draft.startedOn) return 'Elige la fecha en que empezaste a pagarlo.';
	if (draft.status === 'cancelled' && !draft.endedOn) return 'Elige la fecha en que lo cancelaste.';
	if (draft.endedOn && draft.endedOn < draft.startedOn)
		return 'La fecha de cancelación no puede ser anterior al inicio.';
	if (draft.shared) {
		if (draft.members.length === 0) return 'Agrega al menos una persona con quien lo compartes.';
		if (draft.members.some((m) => !m.name.trim())) return 'Escribe el nombre de cada persona.';
		if (draft.members.some((m) => m.amount <= 0))
			return 'Cada persona debe pagar un monto mayor que cero.';
		if (myShare(draft) < 0) return 'Lo que pagan los demás no puede superar el costo del servicio.';
	}
	if (draft.note.length > 500) return 'El texto puede tener hasta 500 caracteres.';
	return null;
}
