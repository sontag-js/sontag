import { parseExpression } from './expression';

/*
	The Node base class
	-------------------

	Represents an item in the AST,
	all other types extend this class.
 */
export class Node {

	toString() {
		return `${this.constructor.name}`;
	}

	async render(ctx, env, children) {
		return await children(ctx);
	}
};

/*
	The Root is the topmost node in the AST.
 */
export class Root extends Node {};

/*
	Represents an expression, e.g.
	{{ post.title }}
 */
export class Expression extends Node {
	constructor(signature) {
		super();
		this.__signature = signature;
	}

	async render(ctx, env) {
		if (!this.__fn) {
			this.__fn = parseExpression(this.__signature);
		}
		return this.__fn.call(ctx);
	}
};

/*
	Represents a comment block, e.g.
	{# Note: See below #}
 */
export class Comment extends Node {
	constructor() {
		super();
		this.value = '';
	}

	toString() {
		return `${this.constructor.name}(${this.value})`;
	}
};

/*
	Represents a run of static text.
 */
export class Text extends Node {
	constructor(value) {
		super();
		this.value = value || '';
	}

	async render() {
		return this.value;
	}

	toString() {
		return `${this.constructor.name}(${this.value})`;
	}
};

/*
	Represents a tag, e.g.:
	{% include 'components/note.eml' %}
 */
export class Tag extends Node {
	
	constructor(tagName, type, signature) {
		super();
		this.tagName = tagName;
		this.$$typeof = type;
		this.__signature = signature;
	}

	toString() {
		return `${this.constructor.name}(${this.tagName})`;
	}

	/*
		Some tags such as {% set %} work either 
		as singular tags or paired tags, and we only know 
		at run-time whether a particular tag is self-closing or not. 

		So by default, return the static property defined on the tag, 
		but allow individual tags to override the logic.
	 */
	get singular() {
		return this.constructor.singular;
	}
};

/*
	Built-in tags
	-------------
 */

/*
	Applies a Filter to its content.
	This is `apply` in Twig and `filter` in Nunjucks.
 */
export class ApplyTag extends Tag {
	static tagNames = ['apply', 'filter'];
}

/*
	Include a template with blocks to override 
	parts of its content.
 */
export class EmbedTag extends Tag {
	static tagNames = ['embed'];
}

/*
	Extend a template.
 */
export class ExtendsTag extends Tag {
	static tagNames = ['extends'];
	static singular = true;

	get args() {
		if (!this.__args) {
			this.__args = {
				expression: parseExpression(this.__signature)
			};
		}
		return this.__args;
	}
}

/*
	Include a template.
 */
export class IncludeTag extends Tag {
	static tagNames = ['include'];
	static singular = true;

	get args() {
		if (!this.__args) {
			let re = /^(.+?)(\s+ignore\s+missing)?(?:\s+with\s+(.+?))?(\s+only)?$/;
			// => [str, template, ignore missing, context, only ] 
			let res = this.__signature.match(re);
			if (res) {
				this.__args = {
					template: parseExpression(res[1]),
					ignore_missing: Boolean(res[2]),
					context: parseExpression(res[3]),
					only: Boolean(res[4])
				};
			} else {
				throw new Error(`${this}: Syntax error`);
			}
		}
		return this.__args;
	}

	async render(ctx, env) {
		let { template, context, only, ignore_missing } = this.args;
		if (!only) {
			context.prototype = ctx;
		}
		return env.render(this.args.template, context, ignore_missing);
	}
}

/*
	Import macros and other exports from a template.
 */
export class ImportTag extends Tag {
	static tagNames = ['import'];
	static singular = true;
}

/*
	Define a macro
 */
export class MacroTag extends Tag {
	static tagNames = ['macro'];
}

export class UseTag extends Tag {
	static tagNames = ['use'];
}

export class SetTag extends Tag {
	static tagNames = ['set'];

	get singular() {
		return this.args.value !== undefined;
	}

	get args() {
		if (!this.__args) {
			let re = /^([^\s]+?)(?:\s*=[^=]*(.+))?$/;
			let res = this.__signature.match(re);
			// => [str, identifier, expression]
			if (!res) {
				throw new Error(`${this}: Syntax error in signature: ${this.__signature}`);
			}
			this.__args = {
				identifier: res[1],
				value: res[2] ? parseExpression(res[2]) : undefined
			};
		}
		return this.__args;
	}

	async render(ctx, env, children) {
		await children(ctx);
		return '';
	}

	context(outer_context) {
		let { identifier, value } = this.args;
		return {
			// todo
			[identifier]: value || null 
		};
	}
}

export class BlockTag extends Tag {
	static tagNames = ['block'];
}

export class ForTag extends Tag {
	static tagNames = ['for'];
	static insideTagNames = ['else'];
	get args() {
		if (!this.__args) {
			// "item in expression"
			// "key, value in expression"
			let re = /^([^\,]+?)(?:\s*\,\s*([^\s]+?))?\s+in\s+(.+)$/;
			// => [ str, key, value, expression ]
			let res = this.__signature.match(re);
			if (res) {
				this.__args = {
					value: res[2] === undefined ? res[1] : res[2],
					key: res[2] === undefined ? undefined : res[1],
					collection: parseExpression(res[3])
				}; 
			} else {
				throw new Error(`${this}: Syntax error`);
			}
		}
		return this.__args;
	}

	async render(ctx, env, children) {
		let { key, value, collection } = this.args;
		let col = Object.entries(await collection(ctx));
		
	}
}

export class IfTag extends Tag {
	static tagNames = ['if'];
	static insideTagNames = ['elseif', 'else'];
}

/*
	Skip parsing template tokens.
	This is `verbatim` in Twig and `raw` in Nunjucks.
 */
export class RawTag extends Tag {
	static tagNames = ['raw', 'verbatim'];
	static scope = 'raw';
}

export class CallTag extends Tag {
	static tagNames = ['call'];
}

export class WithTag extends Tag {
	static tagNames = ['with'];
}

/*
	Symbols to distinguish opening from closing tags
	in paired tags, e.g. `block` vs. `endblock`
 */
export const $tag_start = Symbol('tag/start');
export const $tag_inside = Symbol('tag/inside');
export const $tag_end = Symbol('tag/end');