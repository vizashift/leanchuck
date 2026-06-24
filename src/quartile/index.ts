/**
 * Quartile classification. Two flavors are provided:
 *
 * - **rank-based** ({@link quartileByRank}) — split contributors into four equal
 *   groups by their position in the sorted list (an NTILE(4)).
 * - **value-based** ({@link quartileByValue}) — split by where a value falls
 *   within the data's statistical distribution.
 *
 * @packageDocumentation
 * @module quartile
 */

/** Quartile identifier, `1` (top) through `4` (bottom). */
export type Quartile = 1 | 2 | 3 | 4;

/** Every quartile value, useful for iteration and building distributions. */
export const QUARTILES: readonly Quartile[] = [1, 2, 3, 4];

/**
 * Quartile cutoffs on a 0–1 scale. Treated as inclusive of the max and
 * exclusive of the min, i.e. quartile 1 is `(0, 0.25]`.
 */
export const QUARTILE_RANGES = {
	1: 0.25,
	2: 0.5,
	3: 0.75,
	4: 1,
} as const;

/**
 * Maps a fractional position (0–1) to a {@link Quartile}.
 *
 * Boundaries are inclusive of the max, exclusive of the min:
 * `(0, .25] → 1`, `(.25, .5] → 2`, `(.5, .75] → 3`, `(.75, 1] → 4`.
 *
 * @param fraction - Position on a 0–1 scale (e.g. `rank / count`).
 * @returns The quartile `1`–`4`.
 *
 * @example
 * ```ts
 * quartileByFraction(0.1);  // 1
 * quartileByFraction(0.5);  // 2
 * quartileByFraction(0.9);  // 4
 * ```
 */
export function quartileByFraction(fraction: number): Quartile {
	if (fraction <= QUARTILE_RANGES[1]) return 1;
	if (fraction <= QUARTILE_RANGES[2]) return 2;
	if (fraction <= QUARTILE_RANGES[3]) return 3;
	return 4;
}

/**
 * Assigns a quartile by rank within a sorted list (NTILE(4)).
 *
 * Rank `1` is the largest/first contributor. With this convention quartile `1`
 * is the top quarter of the list.
 *
 * @param rank - 1-based position in the sorted list.
 * @param count - Total number of contributors.
 * @returns The quartile `1`–`4`.
 *
 * @example
 * ```ts
 * quartileByRank(1, 100);   // 1
 * quartileByRank(60, 100);  // 3
 * ```
 */
export function quartileByRank(rank: number, count: number): Quartile {
	if (count <= 0) return 1;
	return quartileByFraction(rank / count);
}

/**
 * Assigns a quartile by where a value sits within the full dataset's range of
 * values (value-based, distribution-aware).
 *
 * Larger values map to quartile `1`. Internally the values are sorted and the
 * 25th/50th/75th percentile cut points are derived via linear interpolation.
 *
 * @param value - The value to classify.
 * @param values - The full population of values to compare against.
 * @returns The quartile `1`–`4`.
 *
 * @example
 * ```ts
 * const revenues = rows.map((r) => r.revenue);
 * quartileByValue(row.revenue, revenues);
 * ```
 */
export function quartileByValue(
	value: number,
	values: readonly number[],
): Quartile {
	if (values.length === 0) return 1;

	const sorted = [...values].sort((a, b) => a - b);
	const q1 = percentileCut(sorted, 0.25);
	const q2 = percentileCut(sorted, 0.5);
	const q3 = percentileCut(sorted, 0.75);

	// Larger values are "better" → quartile 1.
	if (value >= q3) return 1;
	if (value >= q2) return 2;
	if (value >= q1) return 3;
	return 4;
}

/**
 * Linear-interpolated percentile cut point for an already-sorted ascending list.
 *
 * @internal
 */
function percentileCut(sorted: readonly number[], p: number): number {
	const index = p * (sorted.length - 1);
	const lowerIndex = Math.floor(index);
	const upperIndex = Math.ceil(index);
	const lower = sorted[lowerIndex] ?? 0;
	const upper = sorted[upperIndex] ?? lower;
	if (lowerIndex === upperIndex) return lower;
	return lower + (upper - lower) * (index - lowerIndex);
}

/** A zero-filled record keyed by every {@link Quartile}. */
export type QuartileDistribution = Record<Quartile, number>;

/**
 * Creates a {@link QuartileDistribution} with every quartile initialized to `0`.
 *
 * @returns A fresh `{ 1: 0, 2: 0, 3: 0, 4: 0 }`.
 */
export function emptyQuartileDistribution(): QuartileDistribution {
	return { 1: 0, 2: 0, 3: 0, 4: 0 };
}
