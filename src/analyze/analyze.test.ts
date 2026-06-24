import { describe, expect, it } from 'vitest';
import { analyze } from './index.js';

interface Invoice {
	customer: string;
	product: string;
	revenue: number;
	cost: number;
}

const invoices: Invoice[] = [
	{ customer: 'Acme', product: 'Widget', revenue: 500, cost: 300 },
	{ customer: 'Acme', product: 'Gadget', revenue: 100, cost: 80 },
	{ customer: 'Globex', product: 'Widget', revenue: 250, cost: 150 },
	{ customer: 'Initech', product: 'Gizmo', revenue: 100, cost: 90 },
	{ customer: 'Umbrella', product: 'Gizmo', revenue: 50, cost: 45 },
];

describe('analyze', () => {
	it('classifies both dimensions and every point into a quad', () => {
		const result = analyze(invoices, {
			x: 'customer',
			y: 'product',
			value: 'revenue',
			metrics: { cost: 'cost' },
		});

		expect(result.x.total).toBe(1000);
		expect(result.y.total).toBe(1000);
		expect(result.points).toHaveLength(invoices.length);

		// Top customer is Acme (600), classified vital.
		expect(result.x.entries[0]?.key).toBe('Acme');
		expect(result.x.entries[0]?.class).toBe('vital');
		expect(result.x.entries[0]?.metrics.cost).toBe(380);

		// Quad counts and values sum back to the totals.
		const totalCount =
			result.quadCounts[1] +
			result.quadCounts[2] +
			result.quadCounts[3] +
			result.quadCounts[4];
		expect(totalCount).toBe(invoices.length);

		const totalValue =
			result.quadValues[1] +
			result.quadValues[2] +
			result.quadValues[3] +
			result.quadValues[4];
		expect(totalValue).toBe(1000);
	});

	it('respects a configurable threshold and buffer', () => {
		const exact = analyze(invoices, {
			x: 'customer',
			y: 'product',
			value: 'revenue',
			pareto: { threshold: 0.8 },
		});
		const buffered = analyze(invoices, {
			x: 'customer',
			y: 'product',
			value: 'revenue',
			pareto: { threshold: 0.8, buffer: 0.1 },
		});

		expect(buffered.x.vitalCount).toBeGreaterThanOrEqual(exact.x.vitalCount);
		expect(buffered.options.pareto.buffer).toBe(0.1);
	});

	it('supports computed accessors and custom labels', () => {
		const result = analyze(invoices, {
			x: (i) => i.customer,
			y: (i) => i.product,
			value: (i) => i.revenue - i.cost,
			labels: { x: 'customer', y: 'product' },
			quartile: 'value',
		});

		expect(result.x.label).toBe('customer');
		expect(result.options.quartile).toBe('value');
		expect(result.x.entries.every((e) => e.quartile >= 1)).toBe(true);
	});

	it('assigns quartiles to every entry', () => {
		const result = analyze(invoices, {
			x: 'customer',
			y: 'product',
			value: 'revenue',
		});
		for (const entry of result.x.entries) {
			expect([1, 2, 3, 4]).toContain(entry.quartile);
		}
	});
});
