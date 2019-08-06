import { Tag } from '../node-types';
import { expression } from '../parse';

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

	get singular() {
		return this.args.value !== undefined;
	}

	parseArgs(signature) {
		let res = signature.match(SET); // => [str, identifier, expression]
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			identifier: res[1],
			value: res[2] ? expression(res[2]) : undefined
		};
	}

	async render(ctx, env, children) {
		await children(ctx);
		return '';
	}

	async context(outer_context) {
		let { identifier, value } = this.args;
		return {
			// todo
			[identifier]: await value.call(outer_context) || null 
		};
	}
}