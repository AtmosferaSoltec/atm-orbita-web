import { describe, expect, it } from 'vitest';
import { summarizeYear, validateReceipt, type Receipt, type ReceiptDraft } from './receipts';

function receipt(overrides: Partial<Receipt>): Receipt {
	return {
		id: crypto.randomUUID(),
		series: 'E001',
		number: '1',
		issueDate: '2026-03-01',
		client: { name: 'Andes Digital S.A.C.', docType: 'RUC', docNumber: '20601234567' },
		description: '',
		gross: 350000,
		withholding: 28000,
		collectedOn: null,
		source: 'manual',
		documents: [],
		createdAt: '',
		...overrides
	};
}

describe('summarizeYear', () => {
	it('measures the cap on gross amounts of that year only', () => {
		const receipts = [
			receipt({ number: '1', gross: 2000000, withholding: 160000 }),
			receipt({ number: '2', gross: 2100000, withholding: 0, issueDate: '2026-05-02' }),
			receipt({ number: '3', issueDate: '2025-12-30' })
		];
		const summary = summarizeYear(receipts, 2026, 5000000);
		expect(summary.count).toBe(2);
		expect(summary.gross).toBe(4100000);
		expect(summary.net).toBe(3940000);
		expect(summary.usedPercent).toBe(82);
		expect(summary.level).toBe('warning');
		expect(summary.remaining).toBe(900000);
		expect(summary.byMonth[2]).toMatchObject({
			gross: 2000000,
			grossWithheld: 2000000,
			grossNotWithheld: 0
		});
		expect(summary.byMonth[4]).toMatchObject({ grossWithheld: 0, grossNotWithheld: 2100000 });
		expect(summary.byClient).toHaveLength(1);
	});
});

describe('validateReceipt', () => {
	const draft: ReceiptDraft = {
		series: 'E001',
		number: '9',
		issueDate: '2026-03-01',
		client: { name: 'Cliente', docType: 'RUC', docNumber: '20601234567' },
		description: '',
		gross: 100000,
		withholding: 0,
		collectedOn: null,
		source: 'manual'
	};

	it('accepts a valid draft', () => {
		expect(validateReceipt(draft, [], undefined, '2026-10-24')).toBeNull();
	});

	it('detects duplicates and a bad RUC', () => {
		expect(validateReceipt(draft, [receipt({ number: '9' })], undefined, '2026-10-24')).toBe(
			'Ya registraste un recibo con esa serie y número.'
		);
		expect(
			validateReceipt(
				{ ...draft, client: { ...draft.client, docNumber: '123' } },
				[],
				undefined,
				'2026-10-24'
			)
		).toBe('El RUC debe tener 11 dígitos.');
	});
});
