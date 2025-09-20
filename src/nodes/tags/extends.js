import Tag from '../tag.js';
import { expression } from '../../parse.js';

/*
	Extends
	-------

	Syntax:

		{% extend <expression> %}

	Usage notes:
		
		Can appear anywhere in the template.

 */
export default class ExtendsTag extends Tag {
	static tagNames = ['extends'];
	static singular = true;

	parseArgs(signature) {
		return {
			candidates: expression(signature)
		};
	}

	async render(scope, children, env) {
		const { candidates } = this.args();
		/*
			TODO: read block definitions from child template
			and send them when rendering the parent template.

			TODO: Render `ret` INSTEAD of child template contents,
			not inline as it does now.
		*/
		const context = {};
		const ret = env.render(await candidates.call(scope), context);
		if (ret === null) {
			throw new Error(`Can’t find any of: ${ candidates }`);
		}
		return ret;
	}
}