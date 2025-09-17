import { Tag } from '../node.js';
import { expression } from '../parse.js';

/*
	Include a template with blocks to override 
	parts of its content.
 */
export default class EmbedTag extends Tag {
	static tagNames = ['embed'];

	parseArgs(signature) {
		return {
			template: expression(signature)
		}
	}

	async render() {
		// todo
	}
}