import { Tag } from '../node.js';
import { expression } from '../parse.js';

export const WITH = /^([^]+?)?(\s+only)?$/;

export default class WithTag extends Tag {

	static tagNames = ['with'];

	parseArgs(signature) {
		let res = signature.match(WITH); // => [ str, own_scope, only ]
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			own_scope: expression(res[1]),
			only: res[2]
		};
	}

	async render(scope, children, env) {
		let { own_scope, only } = this.args();
		let inner_scope = Object.assign(
			Object.create(only ? env.global_scope : scope),
			own_scope === undefined ? {} : await own_scope.call(scope)
		);
		return await children(inner_scope);
	}
}