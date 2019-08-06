import { Tag } from '../node-types';
import { expression } from '../parse';

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

	async render(ctx, env, children) {
		// todo
	}
}