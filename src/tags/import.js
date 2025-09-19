import { Tag } from '../node.js';
import { expression, importStatement } from '../parse.js';

/*
	Import macros and other exports from a template.

	Syntax:

		{% import <imports> from <expression> %}

	See also:

	
 */
export default class ImportTag extends Tag {
	static tagNames = ['import'];
	static singular = true;

	parseArgs(signature) {
		return importStatement(`import ${signature}`);
	}

	async bindings(scope, children, env) {
		let { source, specifiers } = this.args();
		let exp = await env.import(source);
		return specifiers.reduce((ret, specifier) => {
			ret[specifier.local] = specifier.name === '*' ? exp : exp[specifier.name];
			return ret;
		}, {});
	}

	async render(scope, children, env) {
		return '';
	}
}