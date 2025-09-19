import { Tag } from '../node.js';
import { expression } from '../parse.js';

/*
	Extends
	-------

	Syntax:

		{% extend <expression> %}

	Usage notes:
		
		Must be first tag present in the template.
		Any content before template is printed literally.

 */
export default class ExtendsTag extends Tag {
	static tagNames = ['extends'];
	static singular = true;

	parseArgs(signature) {
		return {
			expression: expression(signature)
		};
	}

	async render(scope, children, env) {
		// todo
	}
}