import Tag from '../tag.js';
import { expression } from '../../parse.js';

/*
	Applies a Filter to its content.
	This is `apply` in Twig and `filter` in Nunjucks.
 */
export default class ApplyTag extends Tag {
	static tagNames = ['apply', 'filter'];
	
	parseArgs(signature) {
		return {
			expression: expression(`__sentinel__ | ${signature}`)
		}
	}

	async render(scope, children, env) {
		return this.args().expression.call({
			...scope,
			__sentinel__: await children(scope)
		});
	}
}