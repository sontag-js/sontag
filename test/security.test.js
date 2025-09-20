import assert from 'node:assert';
import test from 'node:test';

import Sontag from '../src/index.js';

let env = new Sontag();

test('toString', async () => {
	assert.equal(
		await env.renderString('{{ val }}', {
			val: {
				toString() {
					// console.log(globalThis);
					// console.log(global);
					return 'hello';
				}
			}
		}),
		'hello'
	);

	assert.equal(
		await env.renderString('{{ val }}', {
			val: 'new Function("console.log(`here`)")()'
		}),
		''
	);
});