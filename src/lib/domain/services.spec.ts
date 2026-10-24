import { describe, expect, it } from 'vitest';
import {
	memberStatus,
	myShare,
	nextChargeDate,
	totalSpent,
	validateService,
	type Service
} from './services';

function service(overrides: Partial<Service> = {}): Service {
	return {
		id: 's1',
		name: 'Netflix',
		color: '#E53935',
		currency: 'PEN',
		amount: 4490,
		billingDay: 10,
		startedOn: '2026-01-10',
		status: 'active',
		endedOn: null,
		note: '',
		shared: true,
		members: [{ id: 'm1', name: 'Luis', amount: 1500, since: '2026-07' }],
		memberPayments: [],
		createdAt: '2026-01-10T00:00:00Z',
		...overrides
	};
}

describe('charges', () => {
	it('computes the next charge date', () => {
		expect(nextChargeDate(service(), '2026-10-05')).toBe('2026-10-10');
		expect(nextChargeDate(service(), '2026-10-11')).toBe('2026-11-10');
		expect(nextChargeDate(service({ status: 'paused' }), '2026-10-11')).toBeNull();
	});

	it('adds every charge since the start', () => {
		expect(totalSpent(service(), '2026-10-24')).toBe(4490 * 10);
	});

	it('my share is the cost minus the members', () => {
		expect(myShare(service())).toBe(2990);
	});
});

describe('memberStatus', () => {
	it('lists owed months since the member joined', () => {
		const s = service({
			memberPayments: [
				{ id: 'p', memberId: 'm1', month: '2026-07', paidOn: '2026-07-12', amount: 1500 }
			]
		});
		const status = memberStatus(s, s.members[0], '2026-10-24');
		expect(status.owedMonths).toEqual(['2026-08', '2026-09', '2026-10']);
		expect(status.owedAmount).toBe(4500);
		expect(status.lastPayment?.month).toBe('2026-07');
	});

	it('the current month is upcoming before its charge day', () => {
		const s = service();
		const status = memberStatus(s, s.members[0], '2026-10-05');
		expect(status.months.at(-1)?.status).toBe('upcoming');
	});
});

describe('real service billing boundaries', () => {
	it('uses the last day of short months for both charges and member dues', () => {
		const s = service({
			billingDay: 31,
			startedOn: '2026-01-31',
			members: [{ id: 'm1', name: 'Ana', amount: 1500, since: '2026-01' }]
		});
		expect(nextChargeDate(s, '2026-02-01')).toBe('2026-02-28');
		expect(memberStatus(s, s.members[0], '2026-02-28').owedMonths).toEqual(['2026-01', '2026-02']);
	});
	it('does not claim a month whose charge falls after cancellation', () => {
		const s = service({
			status: 'cancelled',
			billingDay: 31,
			startedOn: '2026-01-01',
			endedOn: '2026-02-15',
			members: [{ id: 'm1', name: 'Ana', amount: 1500, since: '2026-01' }]
		});
		expect(memberStatus(s, s.members[0], '2026-10-24').owedMonths).toEqual(['2026-01']);
	});
	it('rejects shares above the total and member months before service start', () => {
		const s = service();
		expect(validateService(s)).toBeNull();
		s.members[0].amount = s.amount + 1;
		expect(validateService(s)).toContain('superar');
		s.members[0].amount = 1500;
		s.members[0].since = '2025-12';
		expect(validateService(s)).toContain('mes de inicio');
	});
});
