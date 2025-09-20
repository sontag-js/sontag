import IncludeTag from './include.js';
import { expression } from '../../parse.js';
import { flattenPrototypes } from '../../util.js';

/*
	Embed
	-----

	Renders the contents of the referenced template, 
	with the ability to define the contents of blocks.

	Signature is identical to Include, so Embed is implemented as a subclass.

	Syntax:

		{% embed <expession> [with <expression> [only]?]? %}
			{% block <identifier> %}
				...
			{% endblock <identifier>? %}
		{% endembed %} 

	Usage notes:

		
 */
	
export default class EmbedTag extends IncludeTag {
	static tagNames = ['embed'];
	static singular = false;

	async render(scope, children, env) {
		const { template, own_scope, only, ignore_missing } = this.args();
		const block_scope = Object.assign(
			Object.create(scope),
			{
				[Symbol.for('sontag/extends')]: true
			}
		);

		const blocks = await children(block_scope);

		let inner_scope = Object.assign(
			Object.create(only ? env.global_scope : scope),
			own_scope === undefined ? {} : await own_scope.call(scope),
			{
				[Symbol.for('sontag/blocks')]: blocks
			}
		);
		/*
			Rendering uses only inner_scope’s own enumerable properties
			and discards its prototype chain. In order to render another file correctly,
			we must flatten the prototype chain into a simple object.
		*/
		const context = flattenPrototypes(inner_scope, env.global_scope);
		const candidates = await template.call(scope);
		const ret = await env.render(candidates, context);
		if (ret === null && !ignore_missing) {
			throw new Error(`Can’t find any of: ${ candidates }`);
		}
		return ret ?? '';
	}
}