// Sample data for the modules that are still mockups (loans), around October 2026.

import type { Loan, LoanPayment } from '#lib/domain/loans.ts';

const CREATED = '2026-01-01T12:00:00.000Z';

function payments(entries: [string, number][]): LoanPayment[] {
	return entries.map(([date, amount], i) => ({ id: `lp-${date}-${i}`, date, amount, note: '' }));
}

export function seedLoans(): Loan[] {
	return [
		{
			id: 'l-adriel',
			borrower: { name: 'Adriel Ramos', phone: '987 654 321' },
			currency: 'PEN',
			principal: 500000,
			lentOn: '2026-09-15',
			firstDueMonth: '2027-02',
			installment: 50000,
			dueDay: 5,
			note: 'Para el inicial de su moto. Empieza a pagar en febrero.',
			publicToken: 'demo-adriel-7Qm2',
			payments: [],
			createdAt: CREATED
		},
		{
			id: 'l-carla',
			borrower: { name: 'Carla Méndez', phone: '912 345 678' },
			currency: 'PEN',
			principal: 240000,
			lentOn: '2026-03-01',
			firstDueMonth: '2026-04',
			installment: 40000,
			dueDay: 10,
			note: 'Curso de inglés.',
			publicToken: 'demo-carla-k3Pz',
			payments: payments([
				['2026-04-10', 40000],
				['2026-05-12', 40000],
				['2026-06-10', 40000],
				['2026-07-15', 40000],
				['2026-09-02', 40000]
			]),
			createdAt: CREATED
		},
		{
			id: 'l-diego',
			borrower: { name: 'Diego Salazar', phone: '' },
			currency: 'USD',
			principal: 120000,
			lentOn: '2026-06-20',
			firstDueMonth: '2026-07',
			installment: 20000,
			dueDay: 25,
			note: 'Laptop para trabajar.',
			publicToken: 'demo-diego-W8nx',
			payments: payments([
				['2026-07-25', 20000],
				['2026-08-24', 20000],
				['2026-09-25', 20000]
			]),
			createdAt: CREATED
		},
		{
			id: 'l-rosa',
			borrower: { name: 'Rosa Huamán', phone: '' },
			currency: 'PEN',
			principal: 80000,
			lentOn: '2026-01-08',
			firstDueMonth: '2026-02',
			installment: 20000,
			dueDay: 8,
			note: '',
			publicToken: 'demo-rosa-b1Lc',
			payments: payments([
				['2026-02-08', 20000],
				['2026-03-08', 20000],
				['2026-04-09', 20000],
				['2026-05-08', 20000]
			]),
			createdAt: CREATED
		}
	];
}
