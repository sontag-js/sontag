import Tag from '../tag.js';
import { expressions, wrapAsync } from '../../parse.js';
import { flattenPrototypes } from '../../util.js';

/*
	Include a template.
 */
export default class IncludeTag extends Tag {
	static tagNames = ['include'];
	static singular = true;

	parseArgs(signature) {
		let expr = expressions(signature);
		const ret = {
			template: wrapAsync(expr.shift()),
			ignore_missing: false,
			only: false
		};
		if (expr.length >= 2 && expr[0] === 'this.ignore' && expr[1] === 'this.missing') {
			ret.ignore_missing = true;
			expr.shift();
			expr.shift();
		}

		if (expr.length >=2 && expr[0] === 'this.with' && expr[1]) {
			ret.own_scope = wrapAsync(expr[1]);
			expr.shift();
			expr.shift();
		}

		if (expr.length && expr[0] === 'this.only') {
			ret.only = true;
			expr.shift();
		}

		if (expr.length) {
			throw new Error('Syntax error');
		}

		return ret;
	}

	async render(scope, children, env) {
		let { template, own_scope, only, ignore_missing } = this.args();
		let inner_scope = Object.assign(
			Object.create(only ? env.global_scope : scope),
			own_scope === undefined ? {} : await own_scope.call(scope)
		);
		/*
			Rendering uses only inner_scope’s own enumerable properties
			and discards its prototype chain. In order to render another file correctly,
			we must flatten the prototype chain into a simple object.
		*/
		const context = flattenPrototypes(inner_scope, env.global_scope);
		const candidates = await template.call(scope);
		const ret = await env.render(candidates, context);
		if (ret === null && !ignore_missing) {
			throw new Error(`Can’t find any of: ${ candidates }`);
		}
		return ret ?? '';
	}
}