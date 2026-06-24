/**
 * `@leanchuck/core` — a generic, configurable 80/20 (Pareto) analytics engine.
 *
 * Map any dataset's fields to an X/Y comparison and classify every data point
 * into quads and quartiles. Everything is exported from this root barrel; the
 * same modules are also available as tree-shakeable subpaths
 * (`@leanchuck/core/pareto`, `/quad`, `/quartile`, `/rollup`, `/stats`,
 * `/math`).
 *
 * @packageDocumentation
 */

export * from './accessor/index.js';
export * from './math/index.js';
export * from './pareto/index.js';
export * from './quad/index.js';
export * from './quartile/index.js';
export * from './rollup/index.js';
export * from './stats/index.js';
export * from './analyze/index.js';
