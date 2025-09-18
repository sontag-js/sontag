import assert from 'node:assert';
import test from 'node:test';

import { func } from '../src/parse.js';

test('macro', () => {
	assert.deepStrictEqual(
		func('hello(who = world | length, prefix)'),
		{
			name: 'hello',
			params: [
				{ name: 'who', value: 'await this[Symbol.for("sontag/filters")].length(this.world)' },
				{ name: 'prefix' }
			]
		}
	);
});