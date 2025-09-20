import Tag from '../tag.js';
import { identifier } from '../../parse.js';

const BLOCK = /^([^\s]+)(?:\s+([^]+))?$/;

/*

	Block
	-----

	Syntax:

		{% block <identifier> scoped? required? %}

		{% endblock <identifier>? %}

*/

export default class BlockTag extends Tag {
	static tagNames = ['block'];

	parseArgs(signature) {
		const items = signature.split(/\s+/).filter(Boolean);
		const name = items.shift();
		if (!identifier(name)) {
			throw new Error('Expected block name');
		}
		const ret = { 
			name,
			scoped: false,
			required: false
		};
		items.forEach(it => {
			if (it === 'scoped') {
				ret.scoped = true;
			} else if (it === 'required') {
				ret.required = true;
			} else {
				throw new Error(`Unexpected block attribute: ${it}`);
			}
		});
		return ret;
	}

	async render(scope, children, env) {
		const { name, scoped, required } = this.args();
		const inner_scope = Object.assign(
			Object.create(scope),
			{
				[Symbol.for('sontag/extends')]: false
			}
		);
		const own_content = await children(inner_scope);
		if (scope[Symbol.for('sontag/extends')]) {
			return { name, scoped, required, content: own_content };
		}
		const content = scope[Symbol.for('sontag/blocks')]?.find(it => it.name === name)?.content;
		return content ?? own_content;
	}

	async blocks(scope, children, env) {
		// todo: scoped, required
		const { name, scoped, required } = this.args();
		const context = Object.assign(
			Object.create(scope),
			{ 
				super: async () => {
					// todo
				}
			}
		);
		return {
			[name]: await children(context)
		};
	}
}