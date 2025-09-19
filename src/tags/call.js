import { Tag } from '../node.js';
import { expression, wrapAwait } from '../parse.js';

export default class CallTag extends Tag {
	static tagNames = ['call'];

	parseArgs(signature) {
		return {
			expr: expression(signature)
		};
	}

	async render(scope, children, env) {
		const { expr } = this.parseArgs(this.signature);
		const context = Object.assign(
			Object.create(scope),
			{
				caller: async () => await children(scope)
			}
		);
		return await expr.call(context);
	}
}