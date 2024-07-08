import { Tag } from '../node-types.js';
import { expression } from '../parse.js';

/*
	Extend a template.
 */
export default class ExtendsTag extends Tag {
	static tagNames = ['extends'];
	static singular = true;

	parseArgs(signature) {
		return {
			expression: expression(signature)
		};
	}

	async render(scope, env, children) {
		// todo
	}
}