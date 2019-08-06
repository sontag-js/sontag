import tape from 'tape';
import { expression } from '../src/parse';

tape('filters', async t => {

	t.plan(4);
	
	let ctx = {
		__filters__: {
			lowercase: str => str.toLowerCase(),
			add: (increment, more, no = 7) => no + more + increment,
			async_add: async (increment, no) => no + increment,
		},
		count: 10
	};

	t.equal(
		await expression("'Hello World' | lowercase").call(ctx),
		'hello world'
	);

	t.equal(
		await expression("1 | add(count, 5)").call(ctx),
		16
	);

	t.equal(
		await expression("1 | async_add(5)").call(ctx),
		6
	);

	t.equal(
		await expression("1 | async_add(5) | add(1)").call(ctx),
		14
	);

	t.end();
});