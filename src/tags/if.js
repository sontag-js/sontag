import { Tag } from '../node-types';
import { expression } from '../parse';

export default class IfTag extends Tag {
	static tagNames = ['if'];
	static insideTagNames = ['elseif', 'else'];

	parseArgs(signature) {
		// todo
	}

	async render() {
		// todo
	}
}