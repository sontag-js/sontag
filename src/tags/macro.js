import { Tag } from '../node.js';
import { func, expression } from '../parse.js';

/*
	Define a macro
 */
export default class MacroTag extends Tag {
	static tagNames = ['macro'];

	parseArgs(signature) {
		return func(signature);
	}

	async render(scope, children, env) {
		return '';
	}

	async bindings(scope, children, env) {
		let { name, params } = this.args();
		return {
			[name]: async function() {

				const inner_scope = {};
				for (let idx = 0; idx < params.length; idx++) {
					let param = params[idx];
					if (arguments[idx] !== undefined) {
						inner_scope[param.name] = arguments[idx];
					} else if (param.value !== undefined) {
						inner_scope[param.name] = await expression(param.value).call(scope);
					}
				}

				const function_scope = Object.assign(
					Object.create(scope),
					inner_scope
				);
				return await children(function_scope);
			}
		};
	}
}