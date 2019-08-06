import { Tag } from '../node-types';
import { expression } from '../parse';

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

	async render(ctx, env, children) {
		return this.args.expression.call({
			...ctx,
			__sentinel__: await children(ctx)
		});
	}
}