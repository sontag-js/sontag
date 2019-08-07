import { Tag } from '../node-types';
import { expression } from '../parse';

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