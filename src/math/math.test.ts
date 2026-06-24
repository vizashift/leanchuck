import { describe, expect, it } from 'vitest';
import {
	clamp,
	mean,
	roundTo,
	safeDivide,
	sum,
	sumBy,
	toPercentString,
	toPercentage,
} from './index.js';

describe('roundTo', () => {
	it('rounds to the given precision', () => {
		expect(roundTo(0.123456)).toBe(0.1235);
		expect(roundTo(0.123456, 2)).toBe(0.12);
		expect(roundTo(10)).toBe(10);
	});

	it('passes through non-finite values', () => {
		expect(roundTo(Infinity)).toBe(Infinity);
		expect(Number.isNaN(roundTo(NaN))).toBe(true);
	});
});

describe('toPercentage', () => {
	it('rounds ratios and guards non-finite', () => {
		expect(toPercentage(1 / 3)).toBe(0.3333);
		expect(toPercentage(Infinity)).toBe(0);
	});
});

describe('toPercentString', () => {
	it('formats as a percent string', () => {
		expect(toPercentString(0.2525)).toBe('25.3%');
		expect(toPercentString(0.2525, 2)).toBe('25.25%');
		expect(toPercentString(Infinity)).toBe('0.0%');
	});
});

describe('safeDivide', () => {
	it('returns the quotient when finite', () => {
		expect(safeDivide(10, 2)).toBe(5);
	});

	it('returns fallback when not finite', () => {
		expect(safeDivide(10, 0)).toBe(0);
		expect(safeDivide(10, 0, null)).toBeNull();
	});
});

describe('sum / sumBy / mean', () => {
	it('sums numbers', () => {
		expect(sum([1, 2, 3])).toBe(6);
		expect(sum([])).toBe(0);
	});

	it('sums by selector', () => {
		expect(sumBy([{ v: 1 }, { v: 2 }], (x) => x.v)).toBe(3);
	});

	it('averages numbers', () => {
		expect(mean([2, 4, 6])).toBe(4);
		expect(mean([])).toBe(0);
	});
});

describe('clamp', () => {
	it('clamps into range', () => {
		expect(clamp(5, 0, 10)).toBe(5);
		expect(clamp(-1, 0, 10)).toBe(0);
		expect(clamp(11, 0, 10)).toBe(10);
	});
});
