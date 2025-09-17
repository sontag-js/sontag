import { Tag } from '../node.js';
import { expression } from '../parse.js';

export default class IfTag extends Tag {
	static tagNames = ['if'];
	static insideTagNames = ['elseif', 'else'];

	parseArgs(signature) {
		return { 
			expression: expression(signature)
		};
	}

	async condition(scope) {
		// If previous case was matched, don’t match current case
		if (await this.related?.condition(scope)) {
			return false;
		}
		if (this.tagName === 'else') {
			return true;
		}
		return this.args().expression.call(scope);
	}

	async render(scope, children) {
		if (await this.condition(scope)) {
			return children(scope);
		}
		return '';
	}
}