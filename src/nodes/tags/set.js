import Tag from '../tag.js';
import { expression, identifier } from '../../parse.js';

/*
	The {% set %} tag allows assignments.
	It works both as a self-closing tag,
	or as a paired tag that captures its content
	into a variable name.

	Uses aliases `assign` and `capture`
	for compatibility with Liquid.
 */
export default class SetTag extends Tag {
	static tagNames = ['set'];

	singular() {
		return this.args().value !== undefined;
	}

	parseArgs(signature) {
		const idx = signature.indexOf('=');
		const id = idx > -1 ? signature.slice(0, idx) : signature;
		const expr = idx > -1 ? signature.slice(idx + 1) : undefined;

		const ident = identifier(id);
		if (!ident) {
			throw new Error(`Invalid identifier ${ident}`);
		}

		return {
			ident,
			value: expr ? expression(expr) : undefined
		};
	}

	async render(scope, children) {
		return '';
	}

	async bindings(scope, children) {
		let { ident, value } = this.args();
		return {
			[ident]: await (value?.call(scope) ?? children(Object.create(scope)))
		};
	}
}