// Sample data for the modules that are still mockups (loans and services), around October 2026.

import type { Loan, LoanPayment } from '#lib/domain/loans.ts';
import type { MemberPayment, Service } from '#lib/domain/services.ts';

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

function monthlyPayments(
	memberId: string,
	months: string[],
	amount: number,
	day = 12
): MemberPayment[] {
	return months.map((month) => ({
		id: `mp-${memberId}-${month}`,
		memberId,
		month,
		paidOn: `${month}-${day}`,
		amount
	}));
}

function service(fields: Partial<Service> & Pick<Service, 'id' | 'name'>): Service {
	return {
		category: 'Software',
		color: '#1D4ED8',
		currency: 'USD',
		amount: 0,
		billingDay: 1,
		startedOn: '2026-01-01',
		status: 'active',
		endedOn: null,
		note: '',
		shared: false,
		members: [],
		memberPayments: [],
		createdAt: CREATED,
		...fields
	};
}

export function seedServices(): Service[] {
	return [
		service({
			id: 's-netflix',
			name: 'Netflix Premium',
			category: 'Entretenimiento',
			color: '#E53935',
			currency: 'PEN',
			amount: 4490,
			billingDay: 10,
			startedOn: '2025-08-10',
			shared: true,
			note: 'Plan compartido con mis hermanos.',
			members: [
				{ id: 'm-luis', name: 'Luis', amount: 1500, since: '2026-03' },
				{ id: 'm-ana', name: 'Ana', amount: 1500, since: '2026-03' }
			],
			memberPayments: [
				...monthlyPayments('m-luis', ['2026-03', '2026-04', '2026-05', '2026-06'], 1500),
				...monthlyPayments(
					'm-ana',
					['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'],
					1500,
					11
				)
			]
		}),
		service({
			id: 's-spotify',
			name: 'Spotify Familiar',
			category: 'Música',
			color: '#0B7A5A',
			currency: 'PEN',
			amount: 3290,
			billingDay: 27,
			startedOn: '2024-05-27',
			shared: true,
			members: [{ id: 'm-mama', name: 'Mamá', amount: 1100, since: '2026-01' }],
			memberPayments: monthlyPayments(
				'm-mama',
				[
					'2026-01',
					'2026-02',
					'2026-03',
					'2026-04',
					'2026-05',
					'2026-06',
					'2026-07',
					'2026-08',
					'2026-09'
				],
				1100,
				28
			)
		}),
		service({
			id: 's-claude',
			name: 'Claude Pro',
			category: 'Inteligencia artificial',
			color: '#B45309',
			amount: 2000,
			billingDay: 12,
			startedOn: '2025-06-12'
		}),
		service({
			id: 's-github',
			name: 'GitHub Pro',
			category: 'Software',
			color: '#0E1A2B',
			amount: 400,
			billingDay: 3,
			startedOn: '2025-02-03'
		}),
		service({
			id: 's-vercel',
			name: 'Vercel Pro',
			category: 'Nube y hosting',
			color: '#0E1A2B',
			amount: 2000,
			billingDay: 28,
			startedOn: '2026-04-28'
		}),
		service({
			id: 's-icloud',
			name: 'iCloud+ 200 GB',
			category: 'Nube y hosting',
			color: '#0E7490',
			amount: 299,
			billingDay: 26,
			startedOn: '2023-09-26'
		}),
		service({
			id: 's-disney',
			name: 'Disney+',
			category: 'Entretenimiento',
			color: '#7C3AED',
			currency: 'PEN',
			amount: 2790,
			billingDay: 5,
			startedOn: '2025-11-05',
			status: 'cancelled',
			endedOn: '2026-05-05'
		})
	];
}
