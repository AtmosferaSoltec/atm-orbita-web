import { describe, expect, it } from 'vitest';
import { buildSchedule, summarizeLoan, validatePayment, type Loan } from './loans';

function loan(overrides: Partial<Loan> = {}): Loan {
	return {
		id: 'l1',
		borrower: { name: 'Adriel', phone: '' },
		currency: 'PEN',
		principal: 500000,
		lentOn: '2026-01-10',
		firstDueMonth: '2026-02',
		installment: 50000,
		dueDay: 15,
		note: '',
		publicToken: 't',
		payments: [],
		createdAt: '2026-01-10T00:00:00Z',
		...overrides
	};
}

describe('buildSchedule', () => {
	it('creates fixed installments and a smaller last one', () => {
		const schedule = buildSchedule(loan({ principal: 520000 }), '2026-01-20');
		expect(schedule).toHaveLength(11);
		expect(schedule[0]).toMatchObject({ month: '2026-02', dueDate: '2026-02-15', amount: 50000 });
		expect(schedule.at(-1)?.amount).toBe(20000);
	});

	it('uses the last day of short months', () => {
		const schedule = buildSchedule(loan({ dueDay: 31 }), '2026-01-20');
		expect(schedule[0].dueDate).toBe('2026-02-28');
	});

	it('applies payments oldest installment first', () => {
		const payments = [
			{ id: 'p1', date: '2026-02-15', amount: 50000, note: '' },
			{ id: 'p2', date: '2026-03-20', amount: 70000, note: '' }
		];
		const schedule = buildSchedule(loan({ payments }), '2026-05-01');
		expect(schedule.map((i) => i.status).slice(0, 5)).toEqual([
			'paid',
			'paid',
			'overdue',
			'upcoming',
			'upcoming'
		]);
		expect(schedule[2].covered).toBe(20000);
	});
});

describe('summarizeLoan', () => {
	it('reports balance, overdue and status', () => {
		const summary = summarizeLoan(
			loan({ payments: [{ id: 'p1', date: '2026-02-15', amount: 50000, note: '' }] }),
			'2026-04-20'
		);
		expect(summary.paid).toBe(50000);
		expect(summary.balance).toBe(450000);
		expect(summary.overdueCount).toBe(2);
		expect(summary.overdueAmount).toBe(100000);
		expect(summary.status).toBe('overdue');
	});

	it('is not started before the first due date', () => {
		expect(summarizeLoan(loan(), '2026-01-20').status).toBe('not-started');
	});

	it('is completed when fully paid', () => {
		const payments = [{ id: 'p1', date: '2026-02-01', amount: 500000, note: '' }];
		expect(summarizeLoan(loan({ payments }), '2026-02-02').status).toBe('completed');
	});
});

describe('validatePayment', () => {
	it('rejects more than the balance and future dates', () => {
		expect(validatePayment({ amount: 600, date: '2026-01-01', note: '' }, 500, '2026-02-01')).toBe(
			'El pago no puede ser mayor que lo que falta pagar.'
		);
		expect(validatePayment({ amount: 100, date: '2026-03-01', note: '' }, 500, '2026-02-01')).toBe(
			'La fecha no puede ser posterior a hoy.'
		);
	});
});
