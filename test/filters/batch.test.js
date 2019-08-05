import { batch } from '../../src/filters';
import tape from 'tape';

tape('batch', t => {
	let arr = ['a', 'b', 'c', 'd'];
	t.deepEqual(
		batch(3, arr),
		[['a', 'b', 'c'], ['d']]
	);

	t.deepEqual(
		batch(0, arr),
		arr
	)

	t.deepEqual(
		batch(1, arr),
		[['a'],['b'],['c'],['d']]
	);
	t.end();
})