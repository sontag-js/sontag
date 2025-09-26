import { parseExpression, parseImport, parseExpressions, parseFunctionSignature } from '../src/parse.js';
import assert from 'node:assert';
import test from 'node:test';

test('operator: in', t => {
	assert.equal(
		parseExpression('str in array'),
		'this.array.includes(this.str)'
	);
});

test('operator: filter', t => {
	assert.equal(
		parseExpression('posts[posts.length - 1] | escape'), 
		'this[Symbol.for("sontag/filters")].escape(this.posts[this.posts.length - 1])'
	);
});

test('operator: filter (async)', t => {
	assert.equal(
		parseExpression('posts[posts.length - 1] | escape', { async: true }), 
		'await this[Symbol.for("sontag/filters")].escape(this.posts[this.posts.length - 1])'
	);

	assert.equal(
		parseExpression('posts | batch(3) | tostring', { async: true }), 
		'await this[Symbol.for("sontag/filters")].tostring(await this[Symbol.for("sontag/filters")].batch(3, this.posts))'
	);
});

test('literal context', () => {
	assert.equal(
		parseExpression('"posts| escape"'),
		'"posts| escape"'
	);

	assert.equal(
		parseExpression("'\\'2 // 3 | isOdd'"),
		"'\\'2 // 3 | isOdd'"
	);

	assert.equal(
		parseExpression("posts[`Therefore..I dunno ${post|inverse}`] | length"),
		'this[Symbol.for("sontag/filters")].length(this.posts[`Therefore..I dunno ${this[Symbol.for("sontag/filters")].inverse(this.post)}`])'
	);

	assert.equal(
		parseExpression("posts[html`Therefore..I dunno ${post|inverse}`] | length"),
		'this[Symbol.for("sontag/filters")].length(this.posts[this.html`Therefore..I dunno ${this[Symbol.for("sontag/filters")].inverse(this.post)}`])'
	);

	assert.equal(
		parseExpression("'you and me' | length"),
		`this[Symbol.for("sontag/filters")].length('you and me')`
	);

	assert.equal(
		parseExpression("/a|b/g"),
		"/a|b/g"
	);
});

test('operators', () => {
	assert.equal(
		parseExpression('a and b'),
		'this.a && this.b'
	);

	assert.equal(
		parseExpression('a or b'),
		'this.a || this.b'
	);

	assert.equal(
		parseExpression('a b-and b'),
		'this.a & this.b'
	);

	assert.equal(
		parseExpression('a b-or b'),
		'this.a | this.b'
	);

	assert.equal(
		parseExpression('a b-xor b'),
		'this.a ^ this.b'
	);

	assert.equal(
		parseExpression('a ?? b'),
		'this.a ?? this.b'
	);

	assert.equal(
		parseExpression('["post-"+ post.type, "po+st"]'),
		'["post-" + this.post.type, "po+st"]'
	);

	assert.equal(
		parseExpression('featured and not (posts | length)'),
		'this.featured && !this[Symbol.for("sontag/filters")].length(this.posts)'
	);

	assert.equal(
		parseExpression('featured and not posts | length'),
		'this[Symbol.for("sontag/filters")].length(this.featured && !this.posts)'
	);

	assert.equal(
		parseExpression('post in posts'),
		'this.posts.includes(this.post)'
	);

	assert.equal(
		parseExpression('post not in posts'),
		'!this.posts.includes(this.post)'
	);
});

test('simple expressions', t => {
	assert.equal(
		parseExpression('true'),
		'true'
	);

	assert.equal(
		parseExpression('false'),
		'false'
	);


	assert.equal(
		parseExpression('1'),
		'1'
	);

	assert.equal(
		parseExpression('"str"'),
		'"str"'
	);

	assert.equal(
		parseExpression('[]', { async: true }),
		'[]'
	);

	assert.equal(
		parseExpression('{}', { async: true }),
		'{}'
	);

	assert.equal(
		parseExpression('this', { async: true }),
		'this'
	);

	assert.equal(
		parseExpression('new Class()', { async: true }),
		'new this.Class()'
	);

	assert.equal(
		parseExpression('await promise', { async: true }),
		'await this.promise'
	);
});

test('parseFunctionSignature', () => {
	assert.deepStrictEqual(
		parseFunctionSignature('hello(who = posts | length, suffix, prefix = 10)'),
		{
			name: 'hello',
			params: [
				{
					name: 'who',
					value: 'this[Symbol.for("sontag/filters")].length(this.posts)'
				},
				{
					name: 'suffix'
				},
				{
					name: 'prefix',
					value: '10'
				}
			]
		}
	);
});

test('parseExpressions', () => {
	const expr = '["post" + type + ".son", "post.son"] | reverse with {x:{y: "z"}} only';
	assert.deepStrictEqual(
		parseExpressions(expr),
		[
			'this[Symbol.for("sontag/filters")].reverse(["post" + this.type + ".son", "post.son"])', 
			'this.with', 
			'{\n  x: {\n    y: "z"\n  }\n}', 
			'this.only' 
		]
	)
});

test('parseImport', () => {
	assert.deepStrictEqual(
		parseImport('import { x as y, z } from "my/layout"'),
		{
			source: 'my/layout',
			specifiers: [
				{ name: 'x', local: 'y' },
				{ name: 'z', local: 'z' }
			]
		}
	);

	assert.deepStrictEqual(
		parseImport('import * as layout from "my/layout"'),
		{
			source: 'my/layout',
			specifiers: [
				{ name: '*', local: 'layout' }
			]
		}
	);

		assert.deepStrictEqual(
		parseImport('import layout from "my/layout"'),
		{
			source: 'my/layout',
			specifiers: [
				{ name: '*', local: 'layout' }
			]
		}
	);
});