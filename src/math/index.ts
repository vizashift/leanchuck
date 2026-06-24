/**
 * Low-level numeric primitives shared across every leanchuck module.
 *
 * These are intentionally tiny and dependency-free so they tree-shake cleanly
 * and can be reused (or replaced) by consumers who need different precision
 * behavior.
 *
 * @packageDocumentation
 * @module math
 */

/**
 * Rounds a number to a fixed number of decimal places.
 *
 * Uses `toFixed` + `parseFloat` rather than `Math.round(x * 10 ** n) / 10 ** n`
 * because it is consistently fast across JS engines and avoids most floating
 * point drift for the magnitudes used in analytics.
 *
 * @param value - The number to round.
 * @param places - Decimal places to keep. Defaults to `4`.
 * @returns The rounded number.
 *
 * @example
 * ```ts
 * roundTo(0.123456);      // 0.1235
 * roundTo(0.123456, 2);   // 0.12
 * ```
 */
export function roundTo(value: number, places = 4): number {
	if (!Number.isFinite(value)) return value;
	return Number.parseFloat(value.toFixed(places));
}

/**
 * Normalizes a ratio into a percentage value rounded to a fixed precision.
 *
 * The value is kept on a 0–1 scale (i.e. `0.2525` represents 25.25%) so it
 * stays composable with other math; use {@link toPercentString} for display.
 *
 * @param value - A ratio, typically between 0 and 1.
 * @param places - Decimal places to keep. Defaults to `4`.
 * @returns The rounded ratio, or `0` when the input is not finite.
 *
 * @example
 * ```ts
 * toPercentage(1 / 3);    // 0.3333
 * ```
 */
export function toPercentage(value: number, places = 4): number {
	if (!Number.isFinite(value)) return 0;
	return roundTo(value, places);
}

/**
 * Formats a ratio (0–1 scale) as a human-readable percent string.
 *
 * @param value - A ratio, typically between 0 and 1.
 * @param places - Decimal places to keep in the output. Defaults to `1`.
 * @returns A string such as `"25.3%"`.
 *
 * @example
 * ```ts
 * toPercentString(0.2525);    // "25.3%"
 * toPercentString(0.2525, 2); // "25.25%"
 * ```
 */
export function toPercentString(value: number, places = 1): string {
	const safe = Number.isFinite(value) ? value : 0;
	return `${(safe * 100).toFixed(places)}%`;
}

/**
 * Safely divides two numbers, returning a fallback instead of `Infinity`/`NaN`.
 *
 * @param numerator - The dividend.
 * @param denominator - The divisor.
 * @param fallback - Value returned when the result is not finite. Defaults to `0`.
 * @returns The quotient, or `fallback` when undefined/non-finite.
 *
 * @example
 * ```ts
 * safeDivide(10, 0);        // 0
 * safeDivide(10, 0, null);  // null
 * ```
 */
export function safeDivide<F = number>(
	numerator: number,
	denominator: number,
	fallback: F = 0 as unknown as F,
): number | F {
	const result = numerator / denominator;
	return Number.isFinite(result) ? result : fallback;
}

/**
 * Sums a list of numbers.
 *
 * @param values - The numbers to add together.
 * @returns The total. Returns `0` for an empty list.
 */
export function sum(values: readonly number[]): number {
	let total = 0;
	for (const value of values) total += value;
	return total;
}

/**
 * Sums a list of items by projecting each to a number.
 *
 * @param items - The items to reduce.
 * @param select - Maps each item to the number to add.
 * @returns The total. Returns `0` for an empty list.
 *
 * @example
 * ```ts
 * sumBy(rows, (r) => r.revenue);
 * ```
 */
export function sumBy<T>(
	items: readonly T[],
	select: (item: T) => number,
): number {
	let total = 0;
	for (const item of items) total += select(item);
	return total;
}

/**
 * Computes the arithmetic mean of a list of numbers.
 *
 * @param values - The numbers to average.
 * @returns The mean, or `0` for an empty list.
 */
export function mean(values: readonly number[]): number {
	if (values.length === 0) return 0;
	return sum(values) / values.length;
}

/**
 * Clamps a number into the inclusive `[min, max]` range.
 *
 * @param value - The number to clamp.
 * @param min - Lower bound.
 * @param max - Upper bound.
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}
