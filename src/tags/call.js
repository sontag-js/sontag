import { Tag } from '../node-types';
import { expression } from '../parse';

export default class CallTag extends Tag {
	static tagNames = ['call'];

	parseArgs(signature) {
		// todo
	}

	async render(scope, env, children) {
		// todo
	}
}