import Sontag from '../src/index.js';
import fg from 'fast-glob';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert';
import test from 'node:test';

let cwd = 'test/fixtures';
let fixtures = fg.sync('*/*.html', { cwd, ignore: ['*/_*.html'] });
let env = new Sontag(cwd);

// strip trailing newlines
const trim = str => str.replace(/(^\n*|\n$)/g, '');

test('fixtures', async t => {
	await Promise.all(fixtures.map(async template => {
		let [ input, context, expected ] = readFileSync(join(cwd, template), 'utf8').split('---');
		context = new Function(`return ${context.trim()}`)();
		input = trim(input);
		expected = trim(expected);
		try {
			let res = await env.renderString(input, context);
			assert.equal(trim(res), expected, template);
		} catch(err) {
			assert.equal(err.toString(), expected, template);
		}
	}));
});
