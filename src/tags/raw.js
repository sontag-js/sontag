import { Tag } from '../node-types.js';
import { expression } from '../parse.js';

/*
	Skip parsing template tokens.
	This is `verbatim` in Twig and `raw` in Nunjucks.
 */
export default class RawTag extends Tag {
	static tagNames = ['raw', 'verbatim'];
	static raw = true;
}