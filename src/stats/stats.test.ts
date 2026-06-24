import { describe, expect, it } from 'vitest';
import { DECILES, median, percentiles, summarize } from './index.js';

describe('percentiles', () => {
	it('computes deciles by default', () => {
		const result = percentiles([1, 2, 3, 4, 5]);
		expect(Object.keys(result).map(Number)).toEqual([...DECILES]);
		expect(result[0]).toBe(1);
		expect(result[50]).toBe(3);
		expect(result[100]).toBe(5);
	});

	it('interpolates between ranks', () => {
		const result = percentiles([1, 2, 3, 4], { steps: [50] });
		expect(result[50]).toBe(2.5);
	});

	it('returns zeros for empty input', () => {
		const result = percentiles([], { steps: [50] });
		expect(result[50]).toBe(0);
	});
});

describe('median', () => {
	it('returns the 50th percentile', () => {
		expect(median([1, 2, 3, 4])).toBe(2.5);
		expect(median([])).toBe(0);
	});
});

describe('summarize', () => {
	it('summarizes a distribution', () => {
		const result = summarize([2, 4, 6, 8]);
		expect(result).toEqual({
			count: 4,
			sum: 20,
			min: 2,
			max: 8,
			mean: 5,
			median: 5,
		});
	});

	it('handles empty input', () => {
		expect(summarize([])).toEqual({
			count: 0,
			sum: 0,
			min: 0,
			max: 0,
			mean: 0,
			median: 0,
		});
	});
});
