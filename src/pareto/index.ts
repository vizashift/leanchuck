/**
 * The Pareto (80/20) engine: sort contributors from largest to smallest, walk
 * the cumulative share of the total, and split them into the "vital few" and
 * the "trivial many" at a configurable threshold.
 *
 * @packageDocumentation
 * @module pareto
 */

import { type NumberAccessor, toNumberFn } from '../accessor/index.js';
import { roundTo, sumBy } from '../math/index.js';

/**
 * Binary Pareto classification.
 *
 * - `vital` — the "vital few": contributors whose cumulative share falls within
 *   the threshold (the classic top ~80%).
 * - `trivial` — the "trivial many": everything beyond the threshold.
 */
export type ParetoClass = 'vital' | 'trivial';

/**
 * Canonical 80/20 labels mapped to {@link ParetoClass}, for callers who prefer
 * the familiar wording.
 */
export const PARETO_LABELS: Record<ParetoClass, '80' | '20'> = {
	vital: '80',
	trivial: '20',
};

/**
 * Options controlling how the Pareto split is computed.
 */
export interface ParetoOptions {
	/**
	 * The cumulative-share cutoff on a 0–1 scale. Contributors at or below this
	 * point are classified `vital`.
	 *
	 * @defaultValue 0.8
	 */
	threshold?: number;
	/**
	 * Extra slack added to {@link ParetoOptions.threshold} when classifying.
	 * Some methodologies take "the 80% plus one more" — e.g. use `0.005` buffer
	 * to make the effective cutoff `0.805`. Defaults to no buffer for an exact split.
	 * Negative values shift the cutoff down.
	 *
	 * @defaultValue 0
	 */
	buffer?: number;
	/**
	 * Always classify the single largest contributor as `vital`, even if it
	 * alone exceeds the cutoff. Prevents a dominant outlier from being labelled
	 * `trivial`.
	 *
	 * @defaultValue true
	 */
	alwaysIncludeTop?: boolean;
	/**
	 * Decimal places used when rounding the stored cumulative share.
	 *
	 * @defaultValue 4
	 */
	precision?: number;
}

/** Resolved {@link ParetoOptions} with every field present. */
export type ResolvedParetoOptions = Required<ParetoOptions>;

/** Default Pareto options — an exact `0.8` split with no buffer. */
export const DEFAULT_PARETO_OPTIONS: ResolvedParetoOptions = {
	threshold: 0.8,
	buffer: 0,
	alwaysIncludeTop: true,
	precision: 4,
};

/**
 * Merges user options over {@link DEFAULT_PARETO_OPTIONS}.
 *
 * @param options - Partial options to apply.
 * @returns A fully-resolved options object.
 */
export function resolveParetoOptions(
	options?: ParetoOptions,
): ResolvedParetoOptions {
	return { ...DEFAULT_PARETO_OPTIONS, ...options };
}

/**
 * The effective cutoff used for classification: `threshold + buffer`.
 *
 * @param options - Pareto options.
 * @returns The cutoff on a 0–1 scale.
 */
export function paretoCutoff(options?: ParetoOptions): number {
	const { threshold, buffer } = resolveParetoOptions(options);
	return threshold + buffer;
}

/**
 * Classifies a single cumulative share against the cutoff.
 *
 * @param cumulativeShare - Running share of the total on a 0–1 scale.
 * @param options - Pareto options (only the cutoff is used here).
 * @returns `'vital'` if at/below the cutoff, otherwise `'trivial'`.
 *
 * @example
 * ```ts
 * classifyPareto(0.62);              // 'vital'
 * classifyPareto(0.91);              // 'trivial'
 * classifyPareto(0.83, { buffer: 0.05 }); // 'vital' (cutoff 0.85)
 * ```
 */
export function classifyPareto(
	cumulativeShare: number,
	options?: ParetoOptions,
): ParetoClass {
	return cumulativeShare <= paretoCutoff(options) ? 'vital' : 'trivial';
}

/**
 * A single contributor after Pareto analysis.
 *
 * @typeParam T - The shape of the source item.
 */
export interface ParetoItem<T> {
	/** The original item. */
	item: T;
	/** The numeric value used for ranking. */
	value: number;
	/** 1-based position after sorting largest → smallest. */
	rank: number;
	/** Running sum of `value` from the largest item through this one. */
	cumulative: number;
	/** {@link ParetoItem.cumulative} divided by the grand total (0–1 scale). */
	cumulativeShare: number;
	/** This item's own share of the grand total (0–1 scale). */
	share: number;
	/** Pareto classification for this contributor. */
	class: ParetoClass;
}

/**
 * The full result of a Pareto pass.
 *
 * @typeParam T - The shape of the source item.
 */
export interface ParetoResult<T> {
	/** Contributors sorted largest → smallest, each fully classified. */
	items: ParetoItem<T>[];
	/** Sum of every contributor's value. */
	total: number;
	/** Count of `vital` contributors. */
	vitalCount: number;
	/** Count of `trivial` contributors. */
	trivialCount: number;
	/** The effective cutoff (`threshold + buffer`) that was applied. */
	cutoff: number;
}

/**
 * Runs a full Pareto (80/20) analysis over a list of items.
 *
 * Steps: project each item to a number → sort descending → accumulate the
 * cumulative share → classify each contributor as `vital` or `trivial`.
 *
 * @param items - The contributors to analyze (e.g. customers, products, rows).
 * @param value - How to read the ranking number from each item.
 * @param options - {@link ParetoOptions} controlling the split.
 * @returns A {@link ParetoResult} with per-item classification and totals.
 *
 * @remarks
 * The input array is not mutated; items are copied before sorting.
 *
 * @example
 * ```ts
 * const result = pareto(customers, (c) => c.revenue);
 * const topCustomers = result.items.filter((i) => i.class === 'vital');
 * ```
 */
export function pareto<T>(
	items: readonly T[],
	value: NumberAccessor<T>,
	options?: ParetoOptions,
): ParetoResult<T> {
	const resolved = resolveParetoOptions(options);
	const cutoff = resolved.threshold + resolved.buffer;
	const getValue = toNumberFn(value);

	const total = sumBy(items, getValue);

	const sorted = [...items].sort((a, b) => getValue(b) - getValue(a));

	let cumulative = 0;
	let vitalCount = 0;
	let trivialCount = 0;

	const result: ParetoItem<T>[] = sorted.map((item, index) => {
		const itemValue = getValue(item);
		cumulative += itemValue;

		const cumulativeShare =
			total === 0 ? 0 : roundTo(cumulative / total, resolved.precision);
		const share =
			total === 0 ? 0 : roundTo(itemValue / total, resolved.precision);

		let paretoClass: ParetoClass =
			cumulativeShare <= cutoff ? 'vital' : 'trivial';

		// Keep the single largest contributor in the vital bucket even if it
		// alone exceeds the cutoff.
		if (index === 0 && resolved.alwaysIncludeTop) paretoClass = 'vital';

		if (paretoClass === 'vital') vitalCount++;
		else trivialCount++;

		return {
			item,
			value: itemValue,
			rank: index + 1,
			cumulative,
			cumulativeShare,
			share,
			class: paretoClass,
		};
	});

	return { items: result, total, vitalCount, trivialCount, cutoff };
}
