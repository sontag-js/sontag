import { readFileSync, globSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert';
import test from 'node:test';

import Sontag from '../src/index.js';

let cwd = 'test/fixtures';
let fixtures = globSync('*/*.html', { cwd, exclude: ['*/_*.html'] });
let env = new Sontag(cwd);

// strip trailing newlines
const trim = str => str.replace(/(^\n*|\n$)/g, '');

fixtures.forEach(template => {
	test(template, { 
		skip: /\bskip\b/.test(template) 
	}, async () => {
		let [ input, context, expected ] = readFileSync(
			join(cwd, template), 
			'utf8'
		).split('---');
		context = new Function(`return ${context.trim()}`)();
		input = trim(input);
		expected = trim(expected);
		let res;
		try {
			res = trim(await env.renderString(input, context));
		} catch(err) {
			res = err.toString();
		}
		assert.equal(trim(res), expected);	
	});
});
