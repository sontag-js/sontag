import { Tag } from '../node-types';
import { expression } from '../parse';

/*
	Import macros and other exports from a template.
 */
export default class ImportTag extends Tag {
	static tagNames = ['import'];
	static singular = true;

	parseArgs(signature) {
		// todo
	}

	async render(scope, env, children) {
		// todo
	}
}