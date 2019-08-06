import tape from 'tape';
import { expression } from '../src/parse';

tape('filters', async t => {

	t.plan(3);
	
	let ctx = {
		__filters__: {
			lowercase: str => str.toLowerCase(),
			plus: (increment, more, no) => no + more + increment,
			async_add: async (increment, no) => no + increment,
		},
		count: 10
	};

	t.equal(
		await expression("'Hello World' | lowercase").call(ctx),
		'hello world'
	);

	t.equal(
		await expression("1 | plus(count, 5)").call(ctx),
		16
	);

	t.equal(
		await expression("1 | async_add(5)").call(ctx),
		6
	);

	t.end();
});