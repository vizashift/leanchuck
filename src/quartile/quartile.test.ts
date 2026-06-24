import { describe, expect, it } from 'vitest';
import {
	emptyQuartileDistribution,
	quartileByFraction,
	quartileByRank,
	quartileByValue,
} from './index.js';

describe('quartileByFraction', () => {
	it('splits inclusive of max, exclusive of min', () => {
		expect(quartileByFraction(0)).toBe(1);
		expect(quartileByFraction(0.25)).toBe(1);
		expect(quartileByFraction(0.2501)).toBe(2);
		expect(quartileByFraction(0.5)).toBe(2);
		expect(quartileByFraction(0.75)).toBe(3);
		expect(quartileByFraction(0.9)).toBe(4);
		expect(quartileByFraction(1)).toBe(4);
	});
});

describe('quartileByRank', () => {
	it('assigns NTILE(4) by rank', () => {
		expect(quartileByRank(1, 100)).toBe(1);
		expect(quartileByRank(25, 100)).toBe(1);
		expect(quartileByRank(26, 100)).toBe(2);
		expect(quartileByRank(75, 100)).toBe(3);
		expect(quartileByRank(76, 100)).toBe(4);
	});

	it('guards against zero count', () => {
		expect(quartileByRank(1, 0)).toBe(1);
	});
});

describe('quartileByValue', () => {
	const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

	it('places larger values in quartile 1', () => {
		expect(quartileByValue(100, values)).toBe(1);
		expect(quartileByValue(10, values)).toBe(4);
	});

	it('handles empty population', () => {
		expect(quartileByValue(5, [])).toBe(1);
	});
});

describe('emptyQuartileDistribution', () => {
	it('builds zeroed distribution', () => {
		expect(emptyQuartileDistribution()).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 });
	});
});
