import tape from 'tape';
import { expression } from '../src/parse';

const wrap = body => `async function anonymous(\n) {\n${body}\n}`

let tests = {
	'1 + 2': 'return 1 + 2',
	'a + b': 'return this.a + this.b',
	'p.type': 'return this.p.type',
	'a.b.c.d': 'return this.a.b.c.d',
	'arr[key]': 'return this.arr[this.key]',
	'a[b[c[d]]]': 'return this.a[this.b[this.c[this.d]]]',
	'[`note-${p.type}.html`, "note.html"]': 'return [`note-${this.p.type}.html`, "note.html"]',

	// Reserved keywords:
	'class': 'return this.class',
	'for': 'return this.for',
	'{ class: "my-class", for: "my-input" }': 'return {\n  class: "my-class",\n  for: "my-input"\n}',

	// Special operators
	'a..z': 'return this.__filters__.range(this.a, this.z)',
	'1 // 2': 'return Math.trunc(1 / 2)',

	// Operators
	'1 and 2': 'return 1 && 2',
	'1 or 2': 'return 1 || 2',
	'1 b-and 2': 'return 1 & 2',
	'1 b-or 2': 'return 1 | 2',
	'1 b-xor 2': 'return 1 ^ 2'
};

tape('expression', t => {
	Object.entries(tests).forEach(entry => {
		try {
			t.equal(expression(entry[0]).toString(), wrap(entry[1]), entry[0]);
		} catch (err) {
			t.equal(err.toString(), entry[1], entry[0]);
		}
	})

	t.end();
});