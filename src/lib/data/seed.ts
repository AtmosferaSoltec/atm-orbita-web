import type { Debtor, LoanMovement } from '#lib/domain/loans.ts';

export function seedLoans(): Debtor[] {
	const movements: LoanMovement[] = [
		{
			id: 'g-a',
			kind: 'loan',
			currency: 'PEN',
			amount: 300000,
			date: '2026-08-01',
			title: 'Celular',
			note: ''
		},
		{
			id: 'g-b',
			kind: 'loan',
			currency: 'PEN',
			amount: 200000,
			date: '2026-09-03',
			title: 'Laptop',
			note: ''
		},
		{
			id: 'g-c',
			kind: 'loan',
			currency: 'PEN',
			amount: 100000,
			date: '2026-09-12',
			title: 'Gastos personales',
			note: ''
		},
		{
			id: 'g-p1',
			kind: 'payment',
			currency: 'PEN',
			amount: 50000,
			date: '2026-09-30',
			note: 'Por Yape',
			appliedMonth: '2026-09'
		},
		{
			id: 'g-p2',
			kind: 'payment',
			currency: 'PEN',
			amount: 50000,
			date: '2026-10-15',
			note: 'Abono de quincena',
			appliedMonth: '2026-10'
		}
	];
	return [
		{
			id: 'd-gerson',
			name: 'Gerson',
			currency: 'PEN',
			movements,
			plans: [
				{ month: '2026-08', amount: 50000 },
				{ month: '2026-09', amount: 100000 },
				{ month: '2026-10', amount: 80000 },
				{ month: '2026-11', amount: 160000 },
				{ month: '2026-12', amount: 160000 },
				{ month: '2027-01', amount: 50000 }
			],
			reference: null,
			publicToken: 'demo-gerson',
			createdAt: '2026-08-01T12:00:00Z'
		},
		{
			id: 'd-diego',
			name: 'Diego Salazar',
			currency: 'USD',
			movements: [
				{
					id: 'd-a',
					kind: 'loan',
					currency: 'USD',
					amount: 120000,
					date: '2026-06-20',
					title: 'Laptop para trabajar',
					note: ''
				},
				{
					id: 'd-p',
					kind: 'payment',
					currency: 'USD',
					amount: 60000,
					date: '2026-10-01',
					note: 'Transferencia',
					appliedMonth: '2026-10'
				}
			],
			plans: [],
			reference: null,
			publicToken: 'demo-diego',
			createdAt: '2026-06-20T12:00:00Z'
		},
		{
			id: 'd-rosa',
			name: 'Rosa Huamán',
			currency: 'PEN',
			movements: [
				{
					id: 'r-a',
					kind: 'loan',
					currency: 'PEN',
					amount: 80000,
					date: '2026-01-08',
					title: 'Préstamo',
					note: ''
				},
				{
					id: 'r-p',
					kind: 'payment',
					currency: 'PEN',
					amount: 80000,
					date: '2026-05-08',
					note: '',
					appliedMonth: '2026-05'
				}
			],
			plans: [],
			reference: null,
			publicToken: 'demo-rosa',
			createdAt: '2026-01-08T12:00:00Z'
		}
	];
}
