import tape from 'tape';
import { expression } from '../src/parse';

tape('filters', t => {
	
	let ctx = {
		__filters__: {
			lowercase: str => str.toLowerCase(),
			plus: (increment, more, no) => no + more + increment
		},
		count: 10
	};

	t.equal(
		expression("'Hello World' | lowercase").call(ctx),
		'hello world'
	);

	t.equal(
		expression("1 | plus(count, 5)").call(ctx),
		16
	);

	t.end();
});