import { Tag } from '../node-types';
import { expression } from '../parse';

export const INCLUDE = /^([^]+?)(\s+ignore\s+missing)?(?:\s+with\s+([^]+?))?(\s+only)?$/;

/*
	Include a template.
 */
export default class IncludeTag extends Tag {
	static tagNames = ['include'];
	static singular = true;

	parseArgs(signature) {
		let res = signature.match(INCLUDE); 
		// => [str, template, ignore missing, context, only ] 
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			template: expression(res[1]),
			ignore_missing: Boolean(res[2]),
			context: expression(res[3]),
			only: Boolean(res[4])
		};
	}

	async render(ctx, env) {
		let { template, context, only, ignore_missing } = this.args;
		let inner_context = Object.assign(
			Object.create(only ? env.__ctx : ctx),
			context === undefined ? {} : await context.call(ctx)
		);
		return env.render(await template.call(ctx), inner_context, ignore_missing);
	}
}