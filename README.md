# @leanchuck/core

A generic, configurable **80/20 (Pareto) analytics engine**. Point it at any
dataset, map your fields to an **X / Y** comparison and a **value** to rank by,
and it classifies every data point into **quads** and **quartiles** — the same
methodology used for customer × product analysis, generalized for _any_ two
dimensions.

- **Generic** — works with any record shape via field-name or function accessors.
- **Configurable** — the Pareto split defaults to an exact `0.8`, with an
  optional buffer for "the 80% plus one more" style rules.
- **Tree-shakeable** — pure ESM with `sideEffects: false`; import only what you
  use, either from the root or from focused subpaths.
- **Dual module format** — ships ESM + CommonJS with full TypeScript types.
- **Tiny & dependency-free** — no runtime dependencies.

## Documentation

Full API reference and guides: **[docs.leanchuck.com](https://docs.leanchuck.com)**

## Installation

```bash
npm install @leanchuck/core
```

## Quick start

```ts
import { analyze } from '@leanchuck/core';

const invoices = [
	{ customer: 'Acme', product: 'Widget', revenue: 500, cost: 300 },
	{ customer: 'Acme', product: 'Gadget', revenue: 100, cost: 80 },
	{ customer: 'Globex', product: 'Widget', revenue: 250, cost: 150 },
	// ...
];

const result = analyze(invoices, {
	x: 'customer', // the X dimension
	y: 'product', // the Y dimension
	value: 'revenue', // what to rank by gmail
	metrics: { cost: 'cost' }, // extra sums to carry along
	pareto: { threshold: 0.8 }, // exact 80/20 (the default)
	quartile: 'rank', // 'rank' (NTILE) or 'value' (distribution)
});

result.x.entries[0]; // top customer, fully classified (class, quartile, share…)
result.quadCounts[1]; // # of rows where both axes are "vital" (Q1)
result.quadValues[4]; // summed revenue of the "trivial/trivial" quad (Q4)
result.points; // every row tagged with its quad
```

Accessors can be **field names** or **functions**, so nothing about your data's
shape is assumed:

```ts
analyze(rows, {
	x: (r) => `${r.region}/${r.rep}`,
	y: 'sku',
	value: (r) => r.units * r.price,
});
```

## Concepts

| Term          | Meaning                                                                           |
| ------------- | --------------------------------------------------------------------------------- |
| **Pareto**    | Sort contributors high→low, walk the cumulative share, split `vital` / `trivial`. |
| **Vital few** | Contributors within the threshold (the classic top ~80%).                         |
| **Quad**      | Cross the X-axis class with the Y-axis class → quadrant `1`–`4`.                  |
| **Quartile**  | Four equal groups, by rank (NTILE) or by where a value sits in the distribution.  |

Quad matrix:

| Quad | X axis  | Y axis  |
| ---- | ------- | ------- |
| `1`  | vital   | vital   |
| `2`  | vital   | trivial |
| `3`  | trivial | vital   |
| `4`  | trivial | trivial |

## Configuring the Pareto split

The split is fully configurable. The default is an **exact `0.8`** cutoff with
no buffer. Add a buffer to nudge the boundary (e.g. "80% plus one more"):

```ts
analyze(rows, {
	x: 'customer',
	y: 'product',
	value: 'revenue',
	pareto: {
		threshold: 0.8, // base cutoff (0–1)
		buffer: 0.005, // effective cutoff becomes 0.805
		alwaysIncludeTop: true, // largest contributor is always "vital"
	},
});
```

## Subpath imports

Everything is re-exported from the package root, but each module is also
available as a focused, tree-shakeable subpath:

```ts
import { pareto, classifyPareto } from '@leanchuck/core/pareto';
import { classifyQuad } from '@leanchuck/core/quad';
import { quartileByRank } from '@leanchuck/core/quartile';
import { rollup } from '@leanchuck/core/rollup';
import { percentiles, summarize } from '@leanchuck/core/stats';
import { roundTo, sumBy } from '@leanchuck/core/math';
```

| Subpath                    | Contents                                             |
| -------------------------- | ---------------------------------------------------- |
| `@leanchuck/core`          | Everything, incl. the high-level `analyze`.          |
| `@leanchuck/core/pareto`   | Cumulative share + 80/20 classification.             |
| `@leanchuck/core/quad`     | 2×2 quadrant classification.                         |
| `@leanchuck/core/quartile` | Rank-based and value-based quartiles.                |
| `@leanchuck/core/rollup`   | Aggregate a flat dataset into per-dimension entries. |
| `@leanchuck/core/stats`    | Percentiles, median, summaries.                      |
| `@leanchuck/core/math`     | Rounding, percentages, sums, means.                  |

## Building blocks

Prefer to compose it yourself? The primitives are exported directly:

```ts
import { rollup, pareto, classifyQuad } from '@leanchuck/core';

const customers = rollup(invoices, { by: 'customer', value: 'revenue' });
const ranked = pareto(customers, (c) => c.value, { threshold: 0.8 });

const top = ranked.items.filter((i) => i.class === 'vital');
```

## Scripts

| Script               | Description                         |
| -------------------- | ----------------------------------- |
| `npm run build`      | Build ESM + CJS + types via `tsup`. |
| `npm test`           | Run the `vitest` suite.             |
| `npm run typecheck`  | Type-check without emitting.        |
| `npm run docs`       | Generate API docs via `typedoc`.    |
| `npm run docs:serve` | Serve the generated docs locally.   |

## License

MIT
