import { Tag } from '../node-types.js';
import { expression } from '../parse.js';

export const INCLUDE = /^([^]+?)(\s+ignore\s+missing)?(?:\s+with\s+([^]+?))?(\s+only)?$/;

/*
	Include a template.
 */
export default class IncludeTag extends Tag {
	static tagNames = ['include'];
	static singular = true;

	parseArgs(signature) {
		let res = signature.match(INCLUDE); 
		// => [str, template, ignore missing, own_scope, only ] 
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			template: expression(res[1]),
			ignore_missing: Boolean(res[2]),
			own_scope: expression(res[3]),
			only: Boolean(res[4])
		};
	}

	async render(scope, env) {
		let { template, own_scope, only, ignore_missing } = this.args;
		let inner_scope = Object.assign(
			Object.create(only ? env.global_scope : scope),
			own_scope === undefined ? {} : await own_scope.call(scope)
		);
		return env.render(await template.call(scope), inner_scope, ignore_missing);
	}
}