import assert from 'node:assert';
import test from 'node:test';

import Sontag from '../src/index.js';

const env = new Sontag();

test('comment', () => {
	assert.deepEqual(
		env.tokenize('{# Hello World #}'),
		[]
	);
});

test('expression', () => {
	assert.deepEqual(
		env.tokenize('{{ hello }}'),
		[
			{
				type: 'expression',
				value: 'hello'
			}
		]
	);
});

test('tag', () => {
	assert.deepEqual(
		env.tokenize('{% hello %}'),
		[
			{
				type: 'tag',
				value: 'hello'
			}
		]
	);
});

test('text', () => {
	assert.deepEqual(
		env.tokenize('hello {# Hello World #} world'),
		[{
			type: 'text',
			value: 'hello  world'
		}]
	);
});

test('verbatim', () => {
	assert.deepEqual(
		env.tokenize('one {% raw   %}two {%endraw%} three'),
		[{
			type: 'text',
			value: 'one two  three'
		}]
	);

	assert.deepEqual(
		env.tokenize('{% raw %}{{ test }} {{ {% }} xxx %}{% endraw %}'),
		[{
			type: 'text',
			value: '{{ test }} {{ {% }} xxx %}'
		}]
	);
});