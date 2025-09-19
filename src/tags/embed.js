import IncludeTag from './include.js';
import { expression } from '../parse.js';

/*
	Include a template with blocks to override 
	parts of its content.
 */
export default class EmbedTag extends IncludeTag {
	static tagNames = ['embed'];
	static singular = false;

	// todo
	async render(scope, children, env) {
		
	}
}