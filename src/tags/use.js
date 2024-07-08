import { Tag } from '../node-types.js';
import { expression } from '../parse.js';

export default class UseTag extends Tag {
	static tagNames = ['use'];

	parseArgs(signature) {
		// todo
	}

	async render(scope, env, children) {
		// todo
	}
}