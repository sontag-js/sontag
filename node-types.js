import expr from './expression';

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

	eval(ctx) {
		return '';
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

	eval(ctx) {
		if (!this.__fn) {
			this.__fn = expr(this.__signature);
		}
		return this.__fn(ctx);
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

	eval() {
		return this.value;
	}

	toString() {
		return `${this.constructor.name}(${this.value})`;
	}
};

/*
	Represents a tag, e.g.:
	{% include 'components/note.feu' %}
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
}

/*
	Include a template.
 */
export class IncludeTag extends Tag {
	static tagNames = ['include'];
	static singular = true;

	get args() {
		if (!this.__args) {
			// parse signature:
			// "expression"
			// "expression ignore missing"
			// "expression only"
			// "expression with expression only"
			// Note: expression can be an array
			let re = /^(expression)(\s+ignore\s+missing)?(?:\s+with\s+(expression))?(\s+only)?$/;
			// => [str, template, ignore missing, data, only ] 
			let res = this.__signature.match(re);
			if (res) {
				this.__args = {
					template: expr(res[1]),
					ignore_missing: Boolean(res[2]),
					data: expr(res[3]),
					only: Boolean(res[4])
				};
			} else {
				throw new Error(`${this}: Syntax error`);
			}
		}
		return this.__args;
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
	static singular = true;
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
					collection: expr(res[3])
				}; 
			} else {
				throw new Error(`${this}: Syntax error`);
			}
		}
		return this.__args;
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