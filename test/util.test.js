import test from 'node:test';
import assert from 'node:assert';

import { flattenPrototypes } from '../src/util.js';

test('flattenPrototypes', () => {
	const top = Object.assign(
		Object.create(null),
		{
			a: 1,
			b: 1,
			c: 1
		}
	);
	const middle = Object.assign(
		Object.create(top),
		{
			a: 2,
			b: 2
		}
	);

	const bottom = Object.assign(
		Object.create(middle),
		{
			a: 3
		}
	)

	assert.deepStrictEqual(
		flattenPrototypes(bottom),
		{
			a: 3,
			b: 2,
			c: 1
		}
	);
});