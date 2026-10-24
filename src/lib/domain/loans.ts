// Loans without interest: what was lent is what comes back, in fixed monthly installments.
// Payments can be of any amount; they cover the installments in order (oldest first).

import { percentOf, sum, type Cents, type Currency } from './money';
import {
	addMonths,
	daysBetween,
	dateInMonth,
	todayIso,
	type IsoDate,
	type MonthKey
} from './dates';

export const DUE_SOON_DAYS = 7;

export interface Borrower {
	name: string;
	phone: string;
}

export interface LoanPayment {
	id: string;
	date: IsoDate;
	amount: Cents;
	note: string;
}

export interface Loan {
	id: string;
	borrower: Borrower;
	currency: Currency;
	principal: Cents;
	lentOn: IsoDate;
	firstDueMonth: MonthKey;
	installment: Cents;
	/** Day of the month each installment is due (1–31; short months use their last day). */
	dueDay: number;
	note: string;
	/** Token of the read-only public link. */
	publicToken: string;
	payments: LoanPayment[];
	createdAt: string;
}

export type LoanDraft = Omit<Loan, 'id' | 'payments' | 'publicToken' | 'createdAt'>;

export type InstallmentStatus = 'paid' | 'partial' | 'overdue' | 'due-soon' | 'upcoming';

export interface Installment {
	index: number;
	month: MonthKey;
	dueDate: IsoDate;
	amount: Cents;
	covered: Cents;
	status: InstallmentStatus;
}

export type LoanStatus = 'not-started' | 'on-track' | 'overdue' | 'completed';

export interface LoanSummary {
	schedule: Installment[];
	paid: Cents;
	balance: Cents;
	overdueAmount: Cents;
	overdueCount: number;
	nextInstallment: Installment | null;
	lastPayment: LoanPayment | null;
	progressPercent: number;
	status: LoanStatus;
	endMonth: MonthKey;
}

export function installmentCount(principal: Cents, installment: Cents): number {
	if (installment <= 0) return 0;
	return Math.ceil(principal / installment);
}

export function sortedPayments(loan: Pick<Loan, 'payments'>): LoanPayment[] {
	return [...loan.payments].sort((a, b) => b.date.localeCompare(a.date));
}

export function buildSchedule(loan: Loan, today: IsoDate = todayIso()): Installment[] {
	const count = installmentCount(loan.principal, loan.installment);
	let available = sum(loan.payments.map((p) => p.amount));

	return Array.from({ length: count }, (_, index) => {
		const isLast = index === count - 1;
		const amount = isLast ? loan.principal - loan.installment * (count - 1) : loan.installment;
		const month = addMonths(loan.firstDueMonth, index);
		const dueDate = dateInMonth(month, loan.dueDay);
		const covered = Math.min(available, amount);
		available -= covered;

		let status: InstallmentStatus;
		if (covered === amount) status = 'paid';
		else if (dueDate < today) status = 'overdue';
		else if (daysBetween(today, dueDate) <= DUE_SOON_DAYS) status = 'due-soon';
		else if (covered > 0) status = 'partial';
		else status = 'upcoming';

		return { index: index + 1, month, dueDate, amount, covered, status };
	});
}

export function summarizeLoan(loan: Loan, today: IsoDate = todayIso()): LoanSummary {
	const schedule = buildSchedule(loan, today);
	const paid = Math.min(sum(loan.payments.map((p) => p.amount)), loan.principal);
	const balance = loan.principal - paid;
	const overdue = schedule.filter((i) => i.status === 'overdue');
	const overdueAmount = sum(overdue.map((i) => i.amount - i.covered));
	const nextInstallment = schedule.find((i) => i.status !== 'paid') ?? null;

	let status: LoanStatus;
	if (balance === 0) status = 'completed';
	else if (overdue.length > 0) status = 'overdue';
	else if (today < dateInMonth(loan.firstDueMonth, loan.dueDay) && paid === 0)
		status = 'not-started';
	else status = 'on-track';

	return {
		schedule,
		paid,
		balance,
		overdueAmount,
		overdueCount: overdue.length,
		nextInstallment,
		lastPayment: sortedPayments(loan)[0] ?? null,
		progressPercent: percentOf(paid, loan.principal),
		status,
		endMonth: schedule.at(-1)?.month ?? loan.firstDueMonth
	};
}

export function validateLoan(draft: LoanDraft): string | null {
	if (!draft.borrower.name.trim()) return 'Escribe el nombre de la persona.';
	if (draft.borrower.name.length > 60) return 'El nombre puede tener hasta 60 caracteres.';
	if (draft.principal <= 0) return 'Escribe un monto mayor que cero.';
	if (!draft.lentOn) return 'Elige la fecha del préstamo.';
	if (draft.installment <= 0) return 'Escribe una cuota mayor que cero.';
	if (draft.installment > draft.principal) return 'La cuota no puede ser mayor que lo prestado.';
	if (!draft.firstDueMonth) return 'Elige el mes de la primera cuota.';
	if (draft.firstDueMonth < draft.lentOn.slice(0, 7))
		return 'La primera cuota no puede ser antes del préstamo.';
	if (draft.dueDay < 1 || draft.dueDay > 31) return 'Elige un día de pago entre 1 y 31.';
	if (draft.note.length > 500) return 'El texto puede tener hasta 500 caracteres.';
	return null;
}

export function validatePayment(
	payment: Omit<LoanPayment, 'id'>,
	balance: Cents,
	today: IsoDate = todayIso()
): string | null {
	if (payment.amount <= 0) return 'Escribe un monto mayor que cero.';
	if (payment.amount > balance) return 'El pago no puede ser mayor que lo que falta pagar.';
	if (!payment.date) return 'Elige la fecha del pago.';
	if (payment.date > today) return 'La fecha no puede ser posterior a hoy.';
	if (payment.note.length > 500) return 'El texto puede tener hasta 500 caracteres.';
	return null;
}
