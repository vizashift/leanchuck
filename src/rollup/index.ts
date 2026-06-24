/**
 * Rollups collapse a flat dataset into one entry per dimension value (e.g. one
 * row per customer), summing a primary value and any extra metrics you name.
 * This is the aggregation step that feeds the Pareto / quad / quartile engines.
 *
 * @packageDocumentation
 * @module rollup
 */

import {
	type KeyAccessor,
	type NumberAccessor,
	toKeyFn,
	toNumberFn,
} from '../accessor/index.js';
import { roundTo, safeDivide } from '../math/index.js';

/**
 * Options for {@link rollup}.
 *
 * @typeParam T - The shape of the source item.
 */
export interface RollupOptions<T> {
	/** How to determine which group each item belongs to. */
	by: KeyAccessor<T>;
	/** The primary numeric value to sum (used later for Pareto ranking). */
	value: NumberAccessor<T>;
	/**
	 * Additional named numeric metrics to sum per group. Each entry becomes a
	 * key on {@link RollupEntry.metrics}.
	 *
	 * @example
	 * ```ts
	 * metrics: { cost: (r) => r.cost, units: 'quantity' }
	 * ```
	 */
	metrics?: Record<string, NumberAccessor<T>>;
	/** Decimal places for the rounded `average`. Defaults to `4`. */
	precision?: number;
}

/**
 * A single aggregated group.
 *
 * @typeParam T - The shape of the source item.
 */
export interface RollupEntry<T> {
	/** The grouping key (always a string). */
	key: string;
	/** Summed primary value across the group. */
	value: number;
	/** Number of source items in the group. */
	count: number;
	/** `value / count`, rounded to the configured precision. */
	average: number;
	/** Summed values for each metric named in {@link RollupOptions.metrics}. */
	metrics: Record<string, number>;
	/** The source items that fell into this group. */
	items: T[];
}

/**
 * Aggregates a flat dataset into one {@link RollupEntry} per distinct key.
 *
 * @param items - The dataset to aggregate.
 * @param options - {@link RollupOptions} describing how to group and sum.
 * @returns One entry per distinct grouping key, in first-seen order.
 *
 * @example
 * ```ts
 * const byCustomer = rollup(invoices, {
 *   by: 'customer',
 *   value: 'revenue',
 *   metrics: { cost: 'cost' },
 * });
 * ```
 */
export function rollup<T>(
	items: readonly T[],
	options: RollupOptions<T>,
): RollupEntry<T>[] {
	const precision = options.precision ?? 4;
	const getKey = toKeyFn(options.by);
	const getValue = toNumberFn(options.value);

	const metricEntries = Object.entries(options.metrics ?? {}).map(
		([name, accessor]) => [name, toNumberFn(accessor)] as const,
	);

	const map = new Map<string, RollupEntry<T>>();

	for (const item of items) {
		const key = getKey(item);
		let entry = map.get(key);
		if (!entry) {
			entry = {
				key,
				value: 0,
				count: 0,
				average: 0,
				metrics: Object.fromEntries(metricEntries.map(([n]) => [n, 0])),
				items: [],
			};
			map.set(key, entry);
		}

		entry.value += getValue(item);
		entry.count += 1;
		entry.items.push(item);
		for (const [name, getMetric] of metricEntries) {
			entry.metrics[name] = (entry.metrics[name] ?? 0) + getMetric(item);
		}
	}

	for (const entry of map.values()) {
		entry.value = roundTo(entry.value, precision);
		entry.average = roundTo(safeDivide(entry.value, entry.count, 0), precision);
		for (const [name] of metricEntries) {
			entry.metrics[name] = roundTo(entry.metrics[name] ?? 0, precision);
		}
	}

	return [...map.values()];
}
