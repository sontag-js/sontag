import { Tag } from '../node.js';
import { expression } from '../parse.js';

/*
	Import macros and other exports from a template.
 */
export default class ImportTag extends Tag {
	static tagNames = ['import'];
	static singular = true;

	parseArgs(signature) {
		// todo
	}

	async render(scope, children, env) {
		// todo
	}
}