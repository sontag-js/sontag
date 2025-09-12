import { Tag } from '../node-types.js';
import { expression } from '../parse.js';

export const FOR = /^([^\,]+?)(?:\s*\,\s*([^\s]+?))?\s+in\s+([^]+)$/;

export default class ForTag extends Tag {
	static tagNames = ['for'];
	static insideTagNames = ['else'];

	parseArgs(signature) {
		let res = signature.match(FOR); // => [ str, key, value, expression ]
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			value: res[2] === undefined ? res[1] : res[2],
			key: res[2] === undefined ? undefined : res[1],
			collection: expression(res[3])
		}
	}

	async render(scope, children, env) {

		let { key, value, collection } = this.args();

		let obj = await collection.call(scope);
		if (key !== undefined) {
			obj = Object.entries(obj);
		}

		let len = typeof obj.size === 'function' ? obj.size() : obj.length;
		let loop = {
			index: 1,
			index0: 0,
			revindex: len - 1,
			revindex0: len,
			first: true,
			last: len === 1,
			length: len,
			parent: scope
		};

		let loop_scope = Object.assign(Object.create(scope), { loop });

		function updateLoop() {
			loop.index++;
			loop.index0++;
			loop.revindex--;
			loop.revindex0--;
			loop.first = loop.index0 === 0;
			loop.last = loop.index0 === loop.length - 1;
		}

		let res = [];

		// Use for...of loop for compatibility
		// with any iterable object
		for (let val of obj) {
			if (key !== undefined) {
				// entries
				loop_scope[key] = val[0];
				loop_scope[value] = val[1];
			} else {
				loop_scope[value] = val;
			}
			res.push(await children(loop_scope));
			updateLoop();
		}

		return res.join('');
	}
}