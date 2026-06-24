/**
 * Accessors are how leanchuck stays generic: instead of assuming your data
 * looks a certain way, you tell it which property (or computed value) maps to
 * each input the calculations need.
 *
 * @packageDocumentation
 * @module accessor
 */

/**
 * Resolves to a numeric value for a given item. Either the key of a numeric
 * property, or a function that derives the number.
 *
 * @example
 * ```ts
 * const byRevenue: NumberAccessor<Row> = 'revenue';
 * const byProfit: NumberAccessor<Row> = (r) => r.revenue - r.cost;
 * ```
 */
export type NumberAccessor<T> = keyof T | ((item: T) => number);

/**
 * Resolves to a grouping key for a given item. Either the key of a property,
 * or a function that derives the key. Returned values are coerced to strings
 * when used for grouping.
 *
 * @example
 * ```ts
 * const byCustomer: KeyAccessor<Row> = 'customer';
 * const byRegion: KeyAccessor<Row> = (r) => `${r.country}/${r.state}`;
 * ```
 */
export type KeyAccessor<T> = keyof T | ((item: T) => string | number);

/**
 * Normalizes a {@link NumberAccessor} into a function.
 *
 * @param accessor - A property key or selector function.
 * @returns A function that returns the numeric value for an item.
 */
export function toNumberFn<T>(
	accessor: NumberAccessor<T>,
): (item: T) => number {
	if (typeof accessor === 'function') return accessor;
	return (item: T) => {
		const value = item[accessor];
		const num = typeof value === 'number' ? value : Number(value);
		return Number.isFinite(num) ? num : 0;
	};
}

/**
 * Normalizes a {@link KeyAccessor} into a function that always returns a string.
 *
 * @param accessor - A property key or selector function.
 * @returns A function that returns the string grouping key for an item.
 */
export function toKeyFn<T>(accessor: KeyAccessor<T>): (item: T) => string {
	if (typeof accessor === 'function') {
		return (item: T) => String(accessor(item));
	}
	return (item: T) => String(item[accessor]);
}
