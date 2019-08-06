import { Tag } from '../node-types';
import { expression } from '../parse';

/*
	Skip parsing template tokens.
	This is `verbatim` in Twig and `raw` in Nunjucks.
 */
export default class RawTag extends Tag {
	static tagNames = ['raw', 'verbatim'];
	static scope = 'raw';

	parseArgs(signature) {
		// todo
	}

	async render() {
		// todo
	}
}