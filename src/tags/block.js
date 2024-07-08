import { Tag } from '../node-types.js';
import { expression } from '../parse.js';

const BLOCK = /^([^\s]+)(?:\s+([^]+))?$/;

export default class BlockTag extends Tag {
	static tagNames = ['block'];

	parseArgs(signature) {
		let res = signature.match(BLOCK);
		// => [str, name, expression] 
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			name: expression(`"${res[1]}"`)(),
			expression: res[2] ? expression(res[2]) : undefined
		};
	}

	async render(scope, env, children) {
		return '';
	}

	async slots(scope) {
		return {
			[this.args.name]: this.args.expression ?
				this.args.expression.call(scope) : 
				await children(scope)
		};
	}

	get singular() {
		return this.args.expression !== undefined;
	}
}