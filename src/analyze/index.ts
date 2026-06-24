/**
 * The high-level entry point. Give {@link analyze} a dataset and tell it which
 * fields map to your X dimension, Y dimension, and the value to rank by. It
 * returns a full 80/20 breakdown: Pareto classes and quartiles per dimension,
 * plus a quad for every data point.
 *
 * @packageDocumentation
 * @module analyze
 */

import {
	type KeyAccessor,
	type NumberAccessor,
	toKeyFn,
	toNumberFn,
} from '../accessor/index.js';
import { roundTo } from '../math/index.js';
import {
	type ParetoClass,
	type ParetoOptions,
	type ResolvedParetoOptions,
	pareto,
	resolveParetoOptions,
} from '../pareto/index.js';
import {
	type Quad,
	type QuadDistribution,
	classifyQuad,
	emptyQuadDistribution,
} from '../quad/index.js';
import {
	type Quartile,
	quartileByRank,
	quartileByValue,
} from '../quartile/index.js';
import { type RollupEntry, rollup } from '../rollup/index.js';

/** Strategy for assigning quartiles to dimension entries. */
export type QuartileStrategy = 'rank' | 'value';

/**
 * Configuration describing how to map your dataset onto the 80/20 model.
 *
 * @typeParam T - The shape of each row in your dataset.
 */
export interface AnalyzeConfig<T> {
	/** Field/selector for the X dimension (e.g. customer). */
	x: KeyAccessor<T>;
	/** Field/selector for the Y dimension (e.g. product). */
	y: KeyAccessor<T>;
	/** Field/selector for the value to rank by (e.g. revenue). */
	value: NumberAccessor<T>;
	/**
	 * Extra numeric metrics to sum into each dimension entry (e.g. cost, units).
	 */
	metrics?: Record<string, NumberAccessor<T>>;
	/** {@link ParetoOptions} controlling the 80/20 split (threshold, buffer). */
	pareto?: ParetoOptions;
	/**
	 * How to assign quartiles.
	 * - `'rank'` — equal-sized groups by sorted position (NTILE).
	 * - `'value'` — by where the value sits in the distribution.
	 *
	 * @defaultValue 'rank'
	 */
	quartile?: QuartileStrategy;
	/** Decimal places for rounded outputs. Defaults to `4`. */
	precision?: number;
	/** Optional human-readable labels echoed back on each dimension result. */
	labels?: { x?: string; y?: string };
}

/**
 * One classified dimension value (e.g. a single customer or product).
 *
 * @typeParam T - The shape of each source row.
 */
export interface DimensionEntry<T> {
	/** The grouping key. */
	key: string;
	/** Summed ranking value. */
	value: number;
	/** Number of source rows in this group. */
	count: number;
	/** `value / count`. */
	average: number;
	/** Summed extra metrics. */
	metrics: Record<string, number>;
	/** 1-based rank, largest value first. */
	rank: number;
	/** This entry's share of the dimension total (0–1). */
	share: number;
	/** Cumulative share through this entry (0–1). */
	cumulativeShare: number;
	/** Pareto class (`vital`/`trivial`). */
	class: ParetoClass;
	/** Assigned quartile (`1`–`4`). */
	quartile: Quartile;
	/** Source rows belonging to this entry. */
	items: T[];
}

/**
 * The analyzed result for one dimension (the X axis or the Y axis).
 *
 * @typeParam T - The shape of each source row.
 */
export interface DimensionResult<T> {
	/** Human-readable label (from config, or `"x"`/`"y"`). */
	label: string;
	/** Sum of every entry's value. */
	total: number;
	/** Entries sorted largest → smallest. */
	entries: DimensionEntry<T>[];
	/** Lookup of entry by key. */
	byKey: Map<string, DimensionEntry<T>>;
	/** Count of `vital` entries. */
	vitalCount: number;
	/** Count of `trivial` entries. */
	trivialCount: number;
}

/**
 * A single source row placed into a quad via its X and Y classifications.
 *
 * @typeParam T - The shape of the source row.
 */
export interface PointResult<T> {
	/** The original row. */
	item: T;
	/** Resolved X key. */
	x: string;
	/** Resolved Y key. */
	y: string;
	/** The row's ranking value. */
	value: number;
	/** X dimension Pareto class. */
	xClass: ParetoClass;
	/** Y dimension Pareto class. */
	yClass: ParetoClass;
	/** The resulting quadrant. */
	quad: Quad;
}

/**
 * The complete output of {@link analyze}.
 *
 * @typeParam T - The shape of each source row.
 */
export interface AnalysisResult<T> {
	/** X dimension breakdown. */
	x: DimensionResult<T>;
	/** Y dimension breakdown. */
	y: DimensionResult<T>;
	/** Every source row, classified into a quad. */
	points: PointResult<T>[];
	/** Count of rows in each quad. */
	quadCounts: QuadDistribution;
	/** Summed value of rows in each quad. */
	quadValues: QuadDistribution;
	/** The resolved options actually used. */
	options: {
		pareto: ResolvedParetoOptions;
		quartile: QuartileStrategy;
		precision: number;
	};
}

/**
 * Builds a {@link DimensionResult} by rolling up the data on one axis and
 * running Pareto + quartile classification over the resulting entries.
 *
 * @internal
 */
function analyzeDimension<T>(
	items: readonly T[],
	by: KeyAccessor<T>,
	value: NumberAccessor<T>,
	metrics: Record<string, NumberAccessor<T>> | undefined,
	paretoOptions: ParetoOptions,
	quartileStrategy: QuartileStrategy,
	precision: number,
	label: string,
): DimensionResult<T> {
	const rolled = rollup(items, { by, value, metrics, precision });
	const result = pareto(rolled, (entry: RollupEntry<T>) => entry.value, {
		...paretoOptions,
		precision,
	});

	const count = result.items.length;
	const values = rolled.map((entry) => entry.value);

	const byKey = new Map<string, DimensionEntry<T>>();
	const entries: DimensionEntry<T>[] = result.items.map((paretoItem) => {
		const source = paretoItem.item;
		const quartile =
			quartileStrategy === 'value'
				? quartileByValue(source.value, values)
				: quartileByRank(paretoItem.rank, count);

		const entry: DimensionEntry<T> = {
			key: source.key,
			value: source.value,
			count: source.count,
			average: source.average,
			metrics: source.metrics,
			rank: paretoItem.rank,
			share: paretoItem.share,
			cumulativeShare: paretoItem.cumulativeShare,
			class: paretoItem.class,
			quartile,
			items: source.items,
		};
		byKey.set(entry.key, entry);
		return entry;
	});

	return {
		label,
		total: roundTo(result.total, precision),
		entries,
		byKey,
		vitalCount: result.vitalCount,
		trivialCount: result.trivialCount,
	};
}

/**
 * Runs a complete, generic 80/20 analysis over any dataset.
 *
 * Pipeline: roll the data up on each axis → Pareto-classify each axis into the
 * vital few / trivial many → assign quartiles → cross every row's X and Y class
 * into a quad → tally quad distributions.
 *
 * @param data - The dataset to analyze.
 * @param config - {@link AnalyzeConfig} mapping your fields to the model.
 * @returns A fully populated {@link AnalysisResult}.
 *
 * @example
 * ```ts
 * const result = analyze(invoices, {
 *   x: 'customer',
 *   y: 'product',
 *   value: 'revenue',
 *   metrics: { cost: 'cost' },
 *   pareto: { threshold: 0.8 },   // exact 80/20
 *   quartile: 'rank',
 * });
 *
 * result.x.entries[0];      // top customer, fully classified
 * result.quadCounts[1];     // rows where both axes are "vital"
 * ```
 */
export function analyze<T>(
	data: readonly T[],
	config: AnalyzeConfig<T>,
): AnalysisResult<T> {
	const precision = config.precision ?? 4;
	const paretoOptions = resolveParetoOptions(config.pareto);
	const quartileStrategy: QuartileStrategy = config.quartile ?? 'rank';

	const x = analyzeDimension(
		data,
		config.x,
		config.value,
		config.metrics,
		paretoOptions,
		quartileStrategy,
		precision,
		config.labels?.x ?? 'x',
	);

	const y = analyzeDimension(
		data,
		config.y,
		config.value,
		config.metrics,
		paretoOptions,
		quartileStrategy,
		precision,
		config.labels?.y ?? 'y',
	);

	const getX = toKeyFn(config.x);
	const getY = toKeyFn(config.y);
	const getValue = toNumberFn(config.value);

	const quadCounts = emptyQuadDistribution();
	const quadValues = emptyQuadDistribution();

	const points: PointResult<T>[] = [];
	for (const item of data) {
		const xKey = getX(item);
		const yKey = getY(item);
		const xClass = x.byKey.get(xKey)?.class;
		const yClass = y.byKey.get(yKey)?.class;
		if (xClass == null || yClass == null) continue;

		const itemValue = getValue(item);
		const quad = classifyQuad(xClass, yClass);

		quadCounts[quad] += 1;
		quadValues[quad] = roundTo(quadValues[quad] + itemValue, precision);

		points.push({
			item,
			x: xKey,
			y: yKey,
			value: itemValue,
			xClass,
			yClass,
			quad,
		});
	}

	return {
		x,
		y,
		points,
		quadCounts,
		quadValues,
		options: {
			pareto: paretoOptions,
			quartile: quartileStrategy,
			precision,
		},
	};
}
