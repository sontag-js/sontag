import Sontag from '../src/index';
import { sync } from 'fast-glob';
import tape from 'tape';
import { readFileSync } from 'fs';
import { join } from 'path';

let cwd = 'test/fixtures';
let fixtures = sync('*/*.html', { cwd, ignore: ['*/_*.html'] });
let env = new Sontag(cwd);

// strip trailing newlines
const trim = str => str.replace(/(^\n*|\n$)/g, '');

tape('fixtures', async t => {
	t.plan(fixtures.length);
	await Promise.all(fixtures.map(async template => {
		let [ input, context, expected ] = readFileSync(join(cwd, template), 'utf8').split('---');
		context = JSON.parse(context);
		input = trim(input);
		expected = trim(expected);
		try {
			let res = await env.renderString(input, context);
			t.equal(trim(res), expected, template);
		} catch(err) {
			t.equal(err.toString(), expected, template);
		}
	}));
	t.end();
});
