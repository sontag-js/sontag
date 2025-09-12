import { Tag } from '../node-types.js';
import { expression } from '../parse.js';

export default class CallTag extends Tag {
	static tagNames = ['call'];

	parseArgs(signature) {
		// todo
	}

	async render(scope, children, env) {
		// todo
	}
}