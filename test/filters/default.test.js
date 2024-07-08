import { _default } from '../../src/filters.js';
import assert from 'node:assert';
import test from 'node:test';

test('default', t => {
	let fb = 10;
	assert.equal(_default(fb, false), fb);
	assert.equal(_default(fb, null), fb);
	assert.equal(_default(fb, undefined), fb);
	let empty_array = [];
	let empty_obj = {};
	assert.equal(_default(fb, empty_array), empty_array);
	assert.equal(_default(fb, empty_obj), empty_obj);
	assert.equal(_default(fb, true), true);
})