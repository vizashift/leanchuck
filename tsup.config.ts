import { defineConfig } from 'tsup';

/**
 * Each entry below becomes both a tree-shakeable subpath export
 * (e.g. `@leanchuck/core/pareto`) and part of the root barrel.
 */
export default defineConfig({
	entry: {
		index: 'src/index.ts',
		'math/index': 'src/math/index.ts',
		'pareto/index': 'src/pareto/index.ts',
		'quad/index': 'src/quad/index.ts',
		'quartile/index': 'src/quartile/index.ts',
		'rollup/index': 'src/rollup/index.ts',
		'stats/index': 'src/stats/index.ts',
	},
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
	treeshake: true,
	splitting: true,
	minify: false,
	outExtension({ format }) {
		return { js: format === 'esm' ? '.js' : '.cjs' };
	},
});
