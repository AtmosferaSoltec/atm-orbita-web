import { describe, expect, it } from 'vitest';
import {
	balancesOf,
	hasDebt,
	migrateLegacyLoans,
	migrateDebtorCurrencies,
	validateDebtorName,
	validateLedger,
	validateMovement,
	validatePlan,
	monthlyLoanSummary,
	unplannedAmount,
	unassignedPayments,
	type Debtor,
	type LoanMovement,
	type MovementDraft
} from './loans';
function entry(
	amount: number,
	kind: 'loan' | 'payment' = 'loan',
	currency: 'PEN' | 'USD' = 'PEN',
	date = '2026-10-01'
): LoanMovement {
	return {
		id: `${kind}-${amount}-${currency}-${date}`,
		kind,
		currency,
		amount,
		date,
		note: '',
		appliedMonth: kind === 'payment' ? date.slice(0, 7) : undefined
	};
}
function debtor(movements: LoanMovement[] = []): Debtor {
	return {
		id: 'g',
		name: 'Gerson',
		currency: movements[0]?.currency ?? 'PEN',
		movements,
		reference: null,
		publicToken: 'preview',
		createdAt: '2026-01-01'
	};
}
describe('flexible debtor ledger', () => {
	it('creates a person before any money is lent', () => {
		expect(balancesOf(debtor())).toEqual([]);
		expect(hasDebt(debtor())).toBe(false);
		expect(validateDebtorName(' Gerson ')).toBeNull();
		expect(validateDebtorName(' ')).toBeTruthy();
	});
	it('combines three advances and arbitrary repayments without installments', () => {
		const person = debtor([
			entry(300000),
			entry(200000),
			entry(100000),
			entry(50000, 'payment'),
			entry(50000, 'payment'),
			entry(100000, 'payment')
		]);
		expect(balancesOf(person)[0]).toMatchObject({
			lent: 600000,
			paid: 200000,
			balance: 400000,
			loanCount: 3,
			paymentCount: 3
		});
		expect(hasDebt(person)).toBe(true);
	});
	it('requires all advances and payments to use the debtor currency', () => {
		const pen = debtor([entry(300000)]);
		const usd = debtor([entry(20000, 'loan', 'USD')]);
		expect(balancesOf(pen)[0].balance).toBe(300000);
		expect(balancesOf(usd)[0].balance).toBe(20000);
		for (const kind of ['loan', 'payment'] as const) {
			expect(validateMovement(pen, entry(10000, kind, 'USD'), undefined, '2026-10-24')).toContain(
				'moneda del deudor'
			);
		}
	});
	it('accepts full settlement and a new advance after settlement', () => {
		const person = debtor([entry(300000), entry(300000, 'payment')]);
		expect(hasDebt(person)).toBe(false);
		person.movements.push(entry(200000, 'loan', 'PEN', '2026-10-02'));
		expect(balancesOf(person)[0].balance).toBe(200000);
	});
	it('rejects a backdated repayment before the advance', () => {
		expect(
			validateMovement(
				debtor([entry(100000)]),
				entry(50000, 'payment', 'PEN', '2026-09-30'),
				undefined,
				'2026-10-24'
			)
		).toBeTruthy();
	});
	it('prevents deleting or reducing advances already covering payments', () => {
		const advance = entry(100000);
		const payment = entry(70000, 'payment');
		expect(validateLedger([payment])).toBeTruthy();
		expect(
			validateMovement(
				debtor([advance, payment]),
				{ ...advance, amount: 60000 },
				advance.id,
				'2026-10-24'
			)
		).toBeTruthy();
		expect(validateLedger([advance])).toBeNull();
	});
	it('validates dates, positive cents and safe totals', () => {
		const base: MovementDraft = entry(100000);
		for (const change of [
			{ amount: 0 },
			{ amount: 1.5 },
			{ date: '2026-02-30' },
			{ date: '2026-10-25' },
			{ amount: Number.MAX_SAFE_INTEGER + 1 }
		])
			expect(
				validateMovement(debtor(), { ...base, ...change }, undefined, '2026-10-24')
			).toBeTruthy();
		expect(validateLedger([entry(Number.MAX_SAFE_INTEGER), entry(1)])).toBeTruthy();
		expect(
			validateLedger([
				entry(Number.MAX_SAFE_INTEGER, 'loan', 'PEN', '2026-10-01'),
				entry(Number.MAX_SAFE_INTEGER, 'payment', 'PEN', '2026-10-02'),
				entry(1, 'loan', 'PEN', '2026-10-03')
			])
		).toBeTruthy();
	});
	it('splits previous mixed-currency mockups and preserves the reference without converting money', () => {
		const person = debtor([entry(300000), entry(50000, 'payment'), entry(20000, 'loan', 'USD')]);
		person.reference = { date: '2026-11-01', amount: 10000, currency: 'USD' };
		const people = migrateDebtorCurrencies([person]);
		expect(people.map((p) => p.currency)).toEqual(['PEN', 'USD']);
		expect(people.map((p) => p.id)).toEqual(['g', 'g-usd']);
		expect(people.map((p) => balancesOf(p)[0].balance)).toEqual([250000, 20000]);
		expect(people[0].reference).toBeNull();
		expect(people[1].reference).toEqual(person.reference);
		expect(people[1].publicToken).not.toBe(people[0].publicToken);
		expect(migrateDebtorCurrencies([debtor()])[0].currency).toBe('PEN');
	});
	it('migrates older local records by person, retaining money and dates', () => {
		const old = {
			id: 'one',
			borrower: { name: ' Gerson ' },
			currency: 'PEN' as const,
			principal: 300000,
			lentOn: '2026-09-01',
			note: 'Celular',
			publicToken: 'old',
			createdAt: '2026-09-01',
			payments: [{ id: 'p', date: '2026-10-01', amount: 50000, note: 'Yape' }]
		};
		const people = migrateLegacyLoans([
			old,
			{ ...old, id: 'two', borrower: { name: 'gerson' }, principal: 200000, payments: [] },
			{ ...old, id: 'three', currency: 'USD', principal: 10000, payments: [] }
		]);
		expect(people).toHaveLength(2);
		expect(people.map((p) => p.currency)).toEqual(['PEN', 'USD']);
		expect(people[0].reference).toBeNull();
		expect(balancesOf(people[0])[0]).toMatchObject({ lent: 500000, paid: 50000, balance: 450000 });
		expect(people[0].movements[1]).toMatchObject({ date: '2026-10-01', note: 'Yape' });
	});
});

describe('manually planned months', () => {
	it('adds different purchases for each month and records a partial payment in the chosen month', () => {
		const person = debtor([
			{
				...entry(300000),
				plan: [
					{ month: '2026-10', amount: 50000 },
					{ month: '2026-11', amount: 50000 }
				]
			},
			{ ...entry(200000), plan: [{ month: '2026-10', amount: 20000 }] },
			{ ...entry(100000), plan: [{ month: '2026-10', amount: 10000 }] },
			{ ...entry(50000, 'payment'), appliedMonth: '2026-10' }
		]);
		expect(monthlyLoanSummary(person)).toEqual([
			{ month: '2026-10', expected: 80000, paid: 50000, remaining: 30000, surplus: 0 },
			{ month: '2026-11', expected: 50000, paid: 0, remaining: 50000, surplus: 0 }
		]);
		expect(unplannedAmount(person)).toBe(470000);
		expect(balancesOf(person)[0].balance).toBe(550000);
	});
	it('keeps an excess payment in the selected month instead of moving it to another month', () => {
		const person = debtor([
			{
				...entry(200000),
				plan: [
					{ month: '2026-10', amount: 80000 },
					{ month: '2026-11', amount: 120000 }
				]
			},
			{ ...entry(100000, 'payment', 'PEN', '2026-10-24'), appliedMonth: '2026-10' }
		]);
		expect(monthlyLoanSummary(person)).toEqual([
			{ month: '2026-10', expected: 80000, paid: 100000, remaining: 0, surplus: 20000 },
			{ month: '2026-11', expected: 120000, paid: 0, remaining: 120000, surplus: 0 }
		]);
		expect(balancesOf(person)[0].balance).toBe(100000);
	});
	it('uses the applied month even when the received date is in another month or year', () => {
		const person = debtor([entry(100000), { ...entry(10000, 'payment'), appliedMonth: '2027-01' }]);
		expect(monthlyLoanSummary(person)[0]).toMatchObject({
			month: '2027-01',
			paid: 10000,
			surplus: 10000
		});
	});
	it('leaves legacy payments unassigned but still reduces the overall balance', () => {
		const person = debtor([entry(100000), { ...entry(10000, 'payment'), appliedMonth: undefined }]);
		expect(unassignedPayments(person)).toBe(10000);
		expect(monthlyLoanSummary(person)).toEqual([]);
		expect(balancesOf(person)[0].balance).toBe(90000);
	});
	it('requires a month for new payments and rejects duplicate, invalid and excessive distributions', () => {
		expect(
			validateMovement(
				debtor([entry(100000)]),
				{ ...entry(10000, 'payment'), appliedMonth: undefined },
				undefined,
				'2026-10-24'
			)
		).toContain('mes');
		expect(validatePlan(100000, [{ month: '2026-13', amount: 10000 }])).toBeTruthy();
		expect(
			validatePlan(100000, [
				{ month: '2026-10', amount: 10000 },
				{ month: '2026-10', amount: 10000 }
			])
		).toBeTruthy();
		expect(validatePlan(100000, [{ month: '2026-10', amount: 100001 }])).toBeTruthy();
		expect(validatePlan(100000, [{ month: '2026-10', amount: 0 }])).toBeTruthy();
		expect(validatePlan(100000, [{ month: '2026-10', amount: 1.5 }])).toBeTruthy();
		expect(validatePlan(100000, [{ month: '2026-10', amount: 50000 }])).toBeNull();
		expect(validatePlan(100000, [])).toBeNull();
	});
	it('prevents reducing an advance below its existing monthly plan', () => {
		const advance = { ...entry(100000), plan: [{ month: '2026-10', amount: 100000 }] };
		expect(
			validateMovement(debtor([advance]), { ...advance, amount: 50000 }, advance.id, '2026-10-24')
		).toContain('reparto');
	});
});
