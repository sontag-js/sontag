import { expression } from '../src/parse.js';
import assert from 'node:assert';
import test from 'node:test';

test('filters', async t => {
	
	let ctx = {
		[Symbol.for('sontag/filters')]: {
			lowercase: str => str.toLowerCase(),
			add: (increment, more, no = 7) => no + more + increment,
			async_add: async (increment, no) => no + increment,
		},
		count: 10
	};

	assert.equal(
		await expression("'Hello World' | lowercase").call(ctx),
		'hello world'
	);

	assert.equal(
		await expression("1 | add(count, 5)").call(ctx),
		16
	);

	assert.equal(
		await expression("1 | async_add(5)").call(ctx),
		6
	);

	assert.equal(
		await expression("1 | async_add(5) | add(1)").call(ctx),
		14
	);
});