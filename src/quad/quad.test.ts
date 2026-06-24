import { describe, expect, it } from 'vitest';
import {
	QUADS,
	classifyQuad,
	emptyQuadDistribution,
	quadAxes,
	quadLabel,
} from './index.js';

describe('classifyQuad', () => {
	it('maps the 2x2 matrix', () => {
		expect(classifyQuad('vital', 'vital')).toBe(1);
		expect(classifyQuad('vital', 'trivial')).toBe(2);
		expect(classifyQuad('trivial', 'vital')).toBe(3);
		expect(classifyQuad('trivial', 'trivial')).toBe(4);
	});
});

describe('quadAxes', () => {
	it('is the inverse of classifyQuad', () => {
		for (const quad of QUADS) {
			const { x, y } = quadAxes(quad);
			expect(classifyQuad(x, y)).toBe(quad);
		}
	});
});

describe('helpers', () => {
	it('builds an empty distribution', () => {
		expect(emptyQuadDistribution()).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 });
	});

	it('labels quads', () => {
		expect(quadLabel(3)).toBe('Q3');
	});
});
