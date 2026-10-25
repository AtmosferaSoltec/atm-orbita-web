import { isIsoDate, todayIso, type IsoDate, type MonthKey } from '#lib/domain/dates.ts';
import { percentOf, type Cents, type Currency } from '#lib/domain/money.ts';

export const LOAN_CURRENCIES: Currency[] = ['PEN', 'USD'];
export type MovementKind = 'loan' | 'payment';
export interface PlannedAmount {
	month: MonthKey;
	amount: Cents;
}
export interface LoanMovement {
	id: string;
	kind: MovementKind;
	currency: Currency;
	amount: Cents;
	date: IsoDate;
	note: string;
	title?: string;
	plan?: PlannedAmount[];
	appliedMonth?: MonthKey | null;
}
export type MovementDraft = Omit<LoanMovement, 'id'>;
/** Retained only to display the month of an older local mockup reference. */
export interface PaymentReference {
	date: IsoDate | '';
	amount: Cents | null;
	currency: Currency;
}
export interface Debtor {
	id: string;
	name: string;
	currency: Currency;
	movements: LoanMovement[];
	reference: PaymentReference | null;
	publicToken: string;
	createdAt: string;
}
export interface CurrencyBalance {
	currency: Currency;
	lent: Cents;
	paid: Cents;
	balance: Cents;
	progressPercent: number;
	loanCount: number;
	paymentCount: number;
}
export function balancesOf(debtor: Debtor): CurrencyBalance[] {
	return LOAN_CURRENCIES.filter((currency) =>
		debtor.movements.some((m) => m.currency === currency)
	).map((currency) => {
		const entries = debtor.movements.filter((m) => m.currency === currency);
		const lent = entries.filter((m) => m.kind === 'loan').reduce((sum, m) => sum + m.amount, 0);
		const paid = entries.filter((m) => m.kind === 'payment').reduce((sum, m) => sum + m.amount, 0);
		return {
			currency,
			lent,
			paid,
			balance: lent - paid,
			progressPercent: percentOf(paid, lent),
			loanCount: entries.filter((m) => m.kind === 'loan').length,
			paymentCount: entries.filter((m) => m.kind === 'payment').length
		};
	});
}
export function hasDebt(debtor: Debtor): boolean {
	return balancesOf(debtor).some((b) => b.balance > 0);
}
export function sortedMovements(debtor: Debtor): LoanMovement[] {
	return debtor.movements.toReversed().sort((a, b) => b.date.localeCompare(a.date));
}
export function validateDebtorName(name: string): string | null {
	if (!name.trim()) return 'Escribe el nombre de la persona.';
	if (name.trim().length > 60) return 'El nombre puede tener hasta 60 caracteres.';
	return null;
}
/** Check balances in date order; a correction cannot leave a payment without its advance. */
export function validateLedger(movements: LoanMovement[]): string | null {
	for (const currency of LOAN_CURRENCIES) {
		let lent = 0;
		let paid = 0;
		const entries = movements
			.filter((m) => m.currency === currency)
			.toSorted(
				(a, b) =>
					a.date.localeCompare(b.date) || (a.kind === b.kind ? 0 : a.kind === 'loan' ? -1 : 1)
			);
		for (const m of entries) {
			if (m.kind === 'loan') lent += m.amount;
			else paid += m.amount;
			const balance = lent - paid;
			if (!Number.isSafeInteger(lent) || !Number.isSafeInteger(paid))
				return 'El total supera el monto permitido.';
			if (balance < 0) return 'Los abonos no pueden superar lo prestado en esa moneda y fecha.';
		}
	}
	return null;
}
export function validateMovement(
	debtor: Debtor,
	draft: MovementDraft,
	editingId?: string,
	today = todayIso()
): string | null {
	if (!Number.isSafeInteger(draft.amount) || draft.amount <= 0)
		return 'Ingresa un monto mayor que cero.';
	if (draft.currency !== debtor.currency) return 'El movimiento debe usar la moneda del deudor.';
	if (!isIsoDate(draft.date) || draft.date > today) return 'Elige una fecha válida, hasta hoy.';
	if ((draft.title?.length ?? 0) > 100) return 'El concepto puede tener hasta 100 caracteres.';
	if (draft.kind === 'payment' && (!draft.appliedMonth || !isLoanMonth(draft.appliedMonth)))
		return 'Elige a qué mes corresponde el abono.';
	if (draft.kind === 'loan') {
		const planError = validatePlan(draft.amount, draft.plan ?? []);
		if (planError) return planError;
	}
	if (draft.note.length > 500) return 'La nota puede tener hasta 500 caracteres.';
	return validateLedger([
		...debtor.movements.filter((m) => m.id !== editingId),
		{ ...draft, id: editingId ?? 'new' }
	]);
}
// Preserve earlier local mockup records without retaining phones or installment schedules.
interface LegacyLoan {
	id: string;
	borrower: { name: string };
	currency: Currency;
	principal: Cents;
	lentOn: IsoDate;
	note: string;
	publicToken: string;
	createdAt: string;
	payments: { id: string; date: IsoDate; amount: Cents; note: string }[];
}
export function migrateLegacyLoans(records: LegacyLoan[]): Debtor[] {
	const result: Debtor[] = [];
	for (const loan of records) {
		const key = loan.borrower.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-PE');
		let debtor = result.find(
			(d) => d.name.toLocaleLowerCase('es-PE') === key && d.currency === loan.currency
		);
		if (!debtor) {
			debtor = {
				id: result.some((d) => d.id === loan.id)
					? `${loan.id}-${loan.currency.toLowerCase()}`
					: loan.id,
				currency: loan.currency,
				name: loan.borrower.name.trim().replace(/\s+/g, ' '),
				movements: [],
				reference: null,
				publicToken: loan.publicToken,
				createdAt: loan.createdAt
			};
			result.push(debtor);
		}
		debtor.movements.push({
			id: `advance-${loan.id}`,
			kind: 'loan',
			currency: loan.currency,
			amount: loan.principal,
			date: loan.lentOn,
			note: loan.note
		});
		debtor.movements.push(
			...loan.payments.map((p) => ({
				...p,
				id: `${loan.id}-${p.id}`,
				kind: 'payment' as const,
				currency: loan.currency
			}))
		);
	}
	return result;
}

export type PreviousDebtor = Omit<Debtor, 'currency'>;
export function migrateDebtorCurrencies(records: PreviousDebtor[]): Debtor[] {
	return records.flatMap((debtor) => {
		const currencies = LOAN_CURRENCIES.filter(
			(currency) =>
				debtor.movements.some((m) => m.currency === currency) ||
				debtor.reference?.currency === currency
		);
		if (!currencies.length) currencies.push('PEN');
		return currencies.map((currency, index) => ({
			...debtor,
			id: index === 0 ? debtor.id : `${debtor.id}-${currency.toLowerCase()}`,
			publicToken:
				index === 0 ? debtor.publicToken : `${debtor.publicToken}-${currency.toLowerCase()}`,
			currency,
			movements: debtor.movements.filter((m) => m.currency === currency),
			reference: debtor.reference?.currency === currency ? debtor.reference : null
		}));
	});
}

export function isLoanMonth(month: string): boolean {
	return /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && month >= '2000-01' && month <= '2100-12';
}
export function validatePlan(principal: Cents, plan: PlannedAmount[]): string | null {
	const seen = new Set<MonthKey>();
	let total = 0;
	for (const item of plan) {
		if (!isLoanMonth(item.month)) return 'Elige un mes y año válidos.';
		if (seen.has(item.month)) return 'Cada mes puede aparecer una sola vez en este préstamo.';
		if (!Number.isSafeInteger(item.amount) || item.amount <= 0)
			return 'Cada monto mensual debe ser mayor que cero.';
		seen.add(item.month);
		total += item.amount;
	}
	if (!Number.isSafeInteger(total) || total > principal)
		return 'El reparto no puede superar el total de este préstamo.';
	return null;
}
export interface MonthlyLoanSummary {
	month: MonthKey;
	expected: Cents;
	paid: Cents;
	remaining: Cents;
	surplus: Cents;
}
export function monthlyLoanSummary(debtor: Debtor): MonthlyLoanSummary[] {
	const months = new Map<MonthKey, { expected: Cents; paid: Cents }>();
	const get = (month: MonthKey) => {
		let item = months.get(month);
		if (!item) {
			item = { expected: 0, paid: 0 };
			months.set(month, item);
		}
		return item;
	};
	for (const movement of debtor.movements) {
		if (movement.kind === 'loan') {
			for (const item of movement.plan ?? []) get(item.month).expected += item.amount;
		} else if (movement.appliedMonth) get(movement.appliedMonth).paid += movement.amount;
	}
	return [...months]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([month, item]) => ({
			month,
			...item,
			remaining: Math.max(0, item.expected - item.paid),
			surplus: Math.max(0, item.paid - item.expected)
		}));
}
export function unplannedAmount(debtor: Debtor): Cents {
	return debtor.movements
		.filter((m) => m.kind === 'loan')
		.reduce(
			(total, m) => total + m.amount - (m.plan ?? []).reduce((sum, p) => sum + p.amount, 0),
			0
		);
}
export function unassignedPayments(debtor: Debtor): Cents {
	return debtor.movements
		.filter((m) => m.kind === 'payment' && !m.appliedMonth)
		.reduce((total, m) => total + m.amount, 0);
}
