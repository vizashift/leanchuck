/**
 * Quad classification: cross an X-axis Pareto class with a Y-axis Pareto class
 * to place a data point into one of four quadrants.
 *
 * @packageDocumentation
 * @module quad
 */

import { type ParetoClass } from '../pareto/index.js';

/**
 * Quadrant identifier.
 *
 * | Quad | X axis  | Y axis  |
 * | ---- | ------- | ------- |
 * | `1`  | vital   | vital   |
 * | `2`  | vital   | trivial |
 * | `3`  | trivial | vital   |
 * | `4`  | trivial | trivial |
 */
export type Quad = 1 | 2 | 3 | 4;

/** Every quad value, useful for iteration and building distributions. */
export const QUADS: readonly Quad[] = [1, 2, 3, 4];

/**
 * Determines the {@link Quad} for a point from its X and Y Pareto classes.
 *
 * @param x - The X-axis Pareto class.
 * @param y - The Y-axis Pareto class.
 * @returns The quadrant `1`–`4`.
 *
 * @example
 * ```ts
 * classifyQuad('vital', 'vital');     // 1
 * classifyQuad('vital', 'trivial');   // 2
 * classifyQuad('trivial', 'vital');   // 3
 * classifyQuad('trivial', 'trivial'); // 4
 * ```
 */
export function classifyQuad(x: ParetoClass, y: ParetoClass): Quad {
	if (x === 'vital' && y === 'vital') return 1;
	if (x === 'vital' && y === 'trivial') return 2;
	if (x === 'trivial' && y === 'vital') return 3;
	return 4;
}

/**
 * Decomposes a {@link Quad} back into its X/Y Pareto classes.
 *
 * @param quad - The quadrant to decompose.
 * @returns The `{ x, y }` Pareto classes that produce this quad.
 */
export function quadAxes(quad: Quad): { x: ParetoClass; y: ParetoClass } {
	switch (quad) {
		case 1:
			return { x: 'vital', y: 'vital' };
		case 2:
			return { x: 'vital', y: 'trivial' };
		case 3:
			return { x: 'trivial', y: 'vital' };
		default:
			return { x: 'trivial', y: 'trivial' };
	}
}

/** A zero-filled record keyed by every {@link Quad}. */
export type QuadDistribution = Record<Quad, number>;

/**
 * Creates a {@link QuadDistribution} with every quad initialized to `0`.
 *
 * @returns A fresh `{ 1: 0, 2: 0, 3: 0, 4: 0 }`.
 */
export function emptyQuadDistribution(): QuadDistribution {
	return { 1: 0, 2: 0, 3: 0, 4: 0 };
}

/**
 * Short display label for a quad, e.g. `"Q1"`.
 *
 * @param quad - The quadrant.
 * @returns The label string.
 */
export function quadLabel(quad: Quad): string {
	return `Q${quad}`;
}
