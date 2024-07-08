import assert from 'node:assert';
import test from 'node:test';
import load from '../src/fs.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('fs loader', async t => {
	let res = await load(['basic/__missing__.html', 'basic/basic.html'], 'test/fixtures');
	let expected = readFileSync('test/fixtures/basic/basic.html', 'utf8');
	assert.equal(res, expected, 'basic/basic.html');
});