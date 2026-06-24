import { describe, expect, it } from 'vitest';
import { rollup } from './index.js';

const rows = [
	{ customer: 'Acme', revenue: 100, cost: 60 },
	{ customer: 'Acme', revenue: 50, cost: 20 },
	{ customer: 'Globex', revenue: 200, cost: 120 },
];

describe('rollup', () => {
	it('groups, sums, counts and averages', () => {
		const result = rollup(rows, { by: 'customer', value: 'revenue' });
		expect(result).toHaveLength(2);

		const acme = result.find((r) => r.key === 'Acme');
		expect(acme?.value).toBe(150);
		expect(acme?.count).toBe(2);
		expect(acme?.average).toBe(75);
		expect(acme?.items).toHaveLength(2);
	});

	it('sums extra named metrics', () => {
		const result = rollup(rows, {
			by: 'customer',
			value: 'revenue',
			metrics: { cost: 'cost', profit: (r) => r.revenue - r.cost },
		});
		const acme = result.find((r) => r.key === 'Acme');
		expect(acme?.metrics.cost).toBe(80);
		expect(acme?.metrics.profit).toBe(70);
	});

	it('preserves first-seen order', () => {
		const result = rollup(rows, { by: 'customer', value: 'revenue' });
		expect(result.map((r) => r.key)).toEqual(['Acme', 'Globex']);
	});

	it('supports function keys', () => {
		const result = rollup(rows, {
			by: (r) => r.customer.toLowerCase(),
			value: 'revenue',
		});
		expect(result.map((r) => r.key)).toEqual(['acme', 'globex']);
	});
});
