import { Tag } from '../node-types';
import { expression } from '../parse';

export const WITH = /^([^]+?)?(\s+only)?$/;

export default class WithTag extends Tag {

	static tagNames = ['with'];

	parseArgs(signature) {
		let res = signature.match(WITH); // => [ str, context, only ]
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			context: expression(res[1]),
			only: res[2]
		};
	}

	async render(ctx, env, children) {
		let { context, only } = this.args;
		let inner_context = Object.assign(
			Object.create(only ? env.__ctx : ctx),
			context === undefined ? {} : context.call(ctx)
		);
		return children(inner_context);
	}
}