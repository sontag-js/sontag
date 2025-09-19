import { Tag } from '../node.js';
import { identifier } from '../parse.js';

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
		/*
			todo:

			if (is_extending) {
				return '';
			}
			return await children(scope);
		*/
		return '';
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