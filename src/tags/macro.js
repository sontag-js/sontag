import { Tag } from '../node-types.js';
import { expression } from '../parse.js';

/*
	Define a macro
 */
export default class MacroTag extends Tag {
	static tagNames = ['macro'];

	parseArgs(signature) {
		// todo
	}

	async render(scope, env, children) {
		// todo
	}
}