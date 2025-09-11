import batch from '../../src/filters/batch.js';
import assert from 'node:assert';
import test from 'node:test';

test('batch', t => {
	let arr = ['a', 'b', 'c', 'd'];
	assert.deepEqual(
		batch(3, arr),
		[['a', 'b', 'c'], ['d']]
	);

	assert.deepEqual(
		batch(0, arr),
		arr
	)

	assert.deepEqual(
		batch(1, arr),
		[['a'],['b'],['c'],['d']]
	);
})