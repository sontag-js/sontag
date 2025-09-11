import { Tag } from '../node-types.js';
import { expression } from '../parse.js';

export default class IfTag extends Tag {
	static tagNames = ['if'];
	static insideTagNames = ['elseif', 'else'];

	parseArgs(signature) {
		return { 
			expression: expression(signature)
		};
	}

	async render(scope, env, children) {
		if (this.tagName === 'if') {
			let { expression } = this.args();
			let condition = await expression.call(scope);
			return children(scope, condition);
		} else if (this.tagName === 'elseif') {
			let { expression } = this.args();
			return async contition => !contition && await expression.call(scope) ? children(scope) : '';
		} else if (this.tagName === 'else') {
			return async condition => !condition ? children(scope) : '';
		}
	}
}