/**
 * Descriptive statistics helpers used to summarize a distribution of values:
 * percentiles (deciles by default), plus min/max/mean/median aggregates.
 *
 * @packageDocumentation
 * @module stats
 */

import { mean, roundTo, sum } from '../math/index.js';

/** The default percentile steps (deciles): `0, 10, 20, … 100`. */
export const DECILES: readonly number[] = [
	0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
];

/** A map of percentile (0–100) to the interpolated value at that percentile. */
export type PercentileMap = Record<number, number>;

/**
 * Options for {@link percentiles}.
 */
export interface PercentileOptions {
	/**
	 * Which percentiles to compute, each `0`–`100`.
	 *
	 * @defaultValue {@link DECILES}
	 */
	steps?: readonly number[];
	/** Decimal places to round each result to. Defaults to `4`. */
	precision?: number;
}

/**
 * Computes percentile values for a population using linear interpolation
 * between the two nearest ranks.
 *
 * @param values - The population of numbers.
 * @param options - {@link PercentileOptions} for steps and precision.
 * @returns A {@link PercentileMap}; every requested step is `0` when `values`
 * is empty.
 *
 * @example
 * ```ts
 * percentiles([1, 2, 3, 4]);            // deciles
 * percentiles(values, { steps: [50] }); // just the median
 * ```
 */
export function percentiles(
	values: readonly number[],
	options?: PercentileOptions,
): PercentileMap {
	const steps = options?.steps ?? DECILES;
	const precision = options?.precision ?? 4;

	const result: PercentileMap = {};
	if (values.length === 0) {
		for (const step of steps) result[step] = 0;
		return result;
	}

	const sorted = [...values].sort((a, b) => a - b);
	for (const step of steps) {
		const index = (step / 100) * (sorted.length - 1);
		const lowerIndex = Math.floor(index);
		const upperIndex = Math.ceil(index);
		const lower = sorted[lowerIndex] ?? 0;
		const upper = sorted[upperIndex] ?? lower;
		const value =
			lowerIndex === upperIndex
				? lower
				: lower + (upper - lower) * (index - lowerIndex);
		result[step] = roundTo(value, precision);
	}

	return result;
}

/**
 * The 50th percentile (median) of a population.
 *
 * @param values - The population of numbers.
 * @param precision - Decimal places to round to. Defaults to `4`.
 * @returns The median, or `0` for an empty population.
 */
export function median(values: readonly number[], precision = 4): number {
	return percentiles(values, { steps: [50], precision })[50] ?? 0;
}

/**
 * A compact summary of a numeric distribution.
 */
export interface Summary {
	/** Number of values. */
	count: number;
	/** Sum of all values. */
	sum: number;
	/** Smallest value (`0` when empty). */
	min: number;
	/** Largest value (`0` when empty). */
	max: number;
	/** Arithmetic mean (`0` when empty). */
	mean: number;
	/** 50th percentile (`0` when empty). */
	median: number;
}

/**
 * Produces a {@link Summary} (count, sum, min, max, mean, median) for a
 * population of values in a single pass plus one sort for the median.
 *
 * @param values - The population of numbers.
 * @param precision - Decimal places to round to. Defaults to `4`.
 * @returns The computed {@link Summary}.
 */
export function summarize(values: readonly number[], precision = 4): Summary {
	if (values.length === 0) {
		return { count: 0, sum: 0, min: 0, max: 0, mean: 0, median: 0 };
	}

	let min = values[0] ?? 0;
	let max = values[0] ?? 0;
	for (const value of values) {
		if (value < min) min = value;
		if (value > max) max = value;
	}

	return {
		count: values.length,
		sum: roundTo(sum(values), precision),
		min: roundTo(min, precision),
		max: roundTo(max, precision),
		mean: roundTo(mean(values), precision),
		median: median(values, precision),
	};
}
