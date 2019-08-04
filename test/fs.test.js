import tape from 'tape';
import load from '../src/fs';
import { readFileSync } from 'fs';
import { join } from 'path';

tape('fs loader', async t => {
	t.plan(1);
	
	let res = await load(['basic/__missing__.html', 'basic/basic.html'], 'test/fixtures');
	let expected = readFileSync('test/fixtures/basic/basic.html', 'utf8');
	t.equal(res, expected, 'basic/basic.html');

	t.end();
});