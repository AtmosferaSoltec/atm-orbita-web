import { describe, expect, it } from 'vitest';
import { applyRate, formatMoney, parseAmount, percentOf, splitEvenly } from './money';

describe('formatMoney', () => {
	it('formats with symbol, thousands and two decimals', () => {
		expect(formatMoney(124580)).toBe('S/ 1,245.80');
		expect(formatMoney(25000, 'USD')).toBe('US$ 250.00');
		expect(formatMoney(5)).toBe('S/ 0.05');
	});

	it('uses + and the typographic minus when signed', () => {
		expect(formatMoney(350000, 'PEN', { signed: true })).toBe('+S/ 3,500.00');
		expect(formatMoney(-1850)).toBe('−S/ 18.50');
	});
});

describe('parseAmount', () => {
	it.each([
		['1245.80', 124580],
		['1245,8', 124580],
		['1,245.80', 124580],
		['1.245,80', 124580],
		['1500', 150000],
		['1,500', 150000],
		['0.5', 50]
	])('%s → %i', (input, expected) => {
		expect(parseAmount(input)).toBe(expected);
	});

	it.each(['', 'abc', '-5', '1.234.5', '12,34,567', '1.5.0', '1.234,567'])(
		'rejects %s',
		(input) => {
			expect(parseAmount(input)).toBeNull();
		}
	);

	it('reads 3 decimals after a single separator as thousands', () => {
		expect(parseAmount('12.345')).toBe(1234500);
	});
});

describe('helpers', () => {
	it('percentOf has one decimal', () => {
		expect(percentOf(1, 3)).toBe(33.3);
		expect(percentOf(5, 0)).toBe(0);
	});

	it('applyRate rounds half up', () => {
		expect(applyRate(350000, 800)).toBe(28000);
		expect(applyRate(1006, 800)).toBe(80);
	});

	it('splitEvenly adds up exactly', () => {
		expect(splitEvenly(4490, 3)).toEqual([1497, 1497, 1496]);
	});
});
