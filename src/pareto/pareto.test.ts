import { describe, expect, it } from 'vitest';
import {
	classifyPareto,
	DEFAULT_PARETO_OPTIONS,
	PARETO_LABELS,
	pareto,
	paretoCutoff,
} from './index.js';

describe('defaults', () => {
	it('defaults to an exact 0.8 split with no buffer', () => {
		expect(DEFAULT_PARETO_OPTIONS.threshold).toBe(0.8);
		expect(DEFAULT_PARETO_OPTIONS.buffer).toBe(0);
		expect(paretoCutoff()).toBe(0.8);
	});

	it('applies a configurable buffer', () => {
		expect(paretoCutoff({ buffer: 0.005 })).toBeCloseTo(0.805);
		expect(paretoCutoff({ threshold: 0.7, buffer: 0.05 })).toBeCloseTo(0.75);
	});
});

describe('classifyPareto', () => {
	it('splits on the cutoff inclusively', () => {
		expect(classifyPareto(0.8)).toBe('vital');
		expect(classifyPareto(0.80001)).toBe('trivial');
		expect(classifyPareto(0.83, { buffer: 0.05 })).toBe('vital');
	});
});

describe('pareto', () => {
	const data = [
		{ name: 'a', revenue: 50 },
		{ name: 'b', revenue: 30 },
		{ name: 'c', revenue: 15 },
		{ name: 'd', revenue: 5 },
	];

	it('sorts descending and assigns ranks + cumulative share', () => {
		const result = pareto(data, 'revenue');
		expect(result.total).toBe(100);
		expect(result.items.map((i) => i.item.name)).toEqual(['a', 'b', 'c', 'd']);
		expect(result.items[0]?.rank).toBe(1);
		expect(result.items[0]?.cumulativeShare).toBe(0.5);
		expect(result.items[1]?.cumulativeShare).toBe(0.8);
		expect(result.items[2]?.cumulativeShare).toBe(0.95);
	});

	it('classifies vital vs trivial at the exact 0.8 cutoff', () => {
		const result = pareto(data, 'revenue');
		expect(result.items.map((i) => i.class)).toEqual([
			'vital',
			'vital',
			'trivial',
			'trivial',
		]);
		expect(result.vitalCount).toBe(2);
		expect(result.trivialCount).toBe(2);
	});

	it('keeps the largest contributor vital even when it exceeds the cutoff', () => {
		const dominant = [
			{ name: 'big', revenue: 90 },
			{ name: 'small', revenue: 10 },
		];
		const result = pareto(dominant, 'revenue');
		expect(result.items[0]?.class).toBe('vital');
	});

	it('can disable alwaysIncludeTop', () => {
		const dominant = [
			{ name: 'big', revenue: 90 },
			{ name: 'small', revenue: 10 },
		];
		const result = pareto(dominant, 'revenue', { alwaysIncludeTop: false });
		expect(result.items[0]?.class).toBe('trivial');
	});

	it('supports function accessors and does not mutate input', () => {
		const copy = [...data];
		const result = pareto(data, (d) => d.revenue * 2);
		expect(result.total).toBe(200);
		expect(data).toEqual(copy);
	});

	it('handles an all-zero dataset without NaN', () => {
		const result = pareto([{ v: 0 }, { v: 0 }], 'v');
		expect(result.total).toBe(0);
		expect(result.items.every((i) => i.cumulativeShare === 0)).toBe(true);
	});

	it('exposes canonical 80/20 labels', () => {
		expect(PARETO_LABELS.vital).toBe('80');
		expect(PARETO_LABELS.trivial).toBe('20');
	});
});
