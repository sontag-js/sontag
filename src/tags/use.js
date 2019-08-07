import { Tag } from '../node-types';
import { expression } from '../parse';

export default class UseTag extends Tag {
	static tagNames = ['use'];

	parseArgs(signature) {
		// todo
	}

	async render(scope, env, children) {
		// todo
	}
}