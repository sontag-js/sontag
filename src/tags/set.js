import { Tag } from '../node-types.js';
import { expression } from '../parse.js';

export const SET = /^([^\s]+?)(?:\s*=[^=]*([^]+))?$/;

/*
	The {% set %} tag allows assignments.
	It works both as a self-closing tag,
	or as a paired tag that captures its content
	into a variable name.

	Uses aliases `assign` and `capture`
	for compatibility with Liquid.
 */
export default class SetTag extends Tag {
	static tagNames = ['set', 'assign', 'capture'];

	singular() {
		return this.args().value !== undefined;
	}

	parseArgs(signature) {
		let res = signature.match(SET); // => [str, identifier, expression]
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			identifier: res[1],
			value: res[2] ? expression(res[2]) : undefined
		};
	}

	async render(scope) {
		await children(scope);
		return '';
	}

	async context(parent_scope) {
		let { identifier, value } = this.args();
		return {
			// todo
			[identifier]: await value.call(parent_scope) || null 
		};
	}
}