import { 
	expression,
	INCLUDE, 
	SET, 
	FOR,
	WITH
} from './parse';

import { Tag } from './node-types';

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
	
	parseArgs(signature) {
		return {
			expression: expression(`__sentinel__ | ${signature}`)
		}
	}

	async render(ctx, env, children) {
		return this.args.expression.call({
			...ctx,
			__sentinel__: await children(ctx)
		});
	}
}

/*
	Include a template with blocks to override 
	parts of its content.
 */
export class EmbedTag extends Tag {
	static tagNames = ['embed'];

	parseArgs(signature) {
		return {
			template: expression(this.__signature)
		}
	}

	async render() {
		// todo
	}
}

/*
	Extend a template.
 */
export class ExtendsTag extends Tag {
	static tagNames = ['extends'];
	static singular = true;

	parseArgs(signature) {
		return {
			expression: expression(signature)
		};
	}

	async render(ctx, env, children) {
		// todo
	}
}

/*
	Include a template.
 */
export class IncludeTag extends Tag {
	static tagNames = ['include'];
	static singular = true;

	parseArgs(signature) {
		let res = signature.match(INCLUDE); 
		// => [str, template, ignore missing, context, only ] 
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			template: expression(res[1]),
			ignore_missing: Boolean(res[2]),
			context: expression(res[3]),
			only: Boolean(res[4])
		};
	}

	async render(ctx, env) {
		let { template, context, only, ignore_missing } = this.args;
		let inner_context = Object.assign(
			Object.create(only ? env.__ctx : ctx),
			context === undefined ? {} : context.call(ctx)
		);
		return env.render(template.call(ctx), inner_context, ignore_missing);
	}
}

/*
	Import macros and other exports from a template.
 */
export class ImportTag extends Tag {
	static tagNames = ['import'];
	static singular = true;

	parseArgs(signature) {
		// todo
	}

	async render(ctx, env, children) {
		// todo
	}
}

/*
	Define a macro
 */
export class MacroTag extends Tag {
	static tagNames = ['macro'];

	parseArgs(signature) {
		// todo
	}

	async render(ctx, env, children) {
		// todo
	}
}

export class UseTag extends Tag {
	static tagNames = ['use'];

	parseArgs(signature) {
		// todo
	}

	async render(ctx, env, children) {
		// todo
	}
}

/*

	The {% set %} tag allows assignments.
	It works both as a self-closing tag,
	or as a paired tag that captures its content
	into a variable name.

	Uses aliases `assign` and `capture`
	for compatibility with Liquid.
 */
export class SetTag extends Tag {
	static tagNames = ['set', 'assign', 'capture'];

	get singular() {
		return this.args.value !== undefined;
	}

	parseArgs(signature) {
		let res = signature.match(SET); // => [str, identifier, expression]
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			identifier: res[1],
			value: res[2] ? expression(res[2]) : undefined
		};
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

	parseArgs(signature) {
		return {
			name: expression(signature),
			// todo
			expression: undefined
		};
	}

	async render(ctx, env, children) {
		return '';
	}

	async slots() {
		return {
			[this.args.name]: await children(ctx)
		};
	}

	get singular() {
		return this.args.expression !== undefined;
	}
}

export class ForTag extends Tag {
	static tagNames = ['for'];
	static insideTagNames = ['else'];

	parseArgs(signature) {
		let res = signature.match(FOR); // => [ str, key, value, expression ]
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			value: res[2] === undefined ? res[1] : res[2],
			key: res[2] === undefined ? undefined : res[1],
			collection: expression(res[3])
		}
	}

	async render(ctx, env, children) {
		let { key, value, collection } = this.args;
		let col = Object.entries(await collection(ctx));
		
	}
}

export class IfTag extends Tag {
	static tagNames = ['if'];
	static insideTagNames = ['elseif', 'else'];

	parseArgs(signature) {
		// todo
	}

	async render() {
		// todo
	}
}

/*
	Skip parsing template tokens.
	This is `verbatim` in Twig and `raw` in Nunjucks.
 */
export class RawTag extends Tag {
	static tagNames = ['raw', 'verbatim'];
	static scope = 'raw';

	parseArgs(signature) {
		// todo
	}

	async render() {
		// todo
	}
}

export class CallTag extends Tag {
	static tagNames = ['call'];

	parseArgs(signature) {
		// todo
	}

	async render(ctx, env, children) {
		// todo
	}
}

export class WithTag extends Tag {

	static tagNames = ['with'];

	parseArgs(signature) {
		let res = signature.match(WITH); // => [ str, context, only ]
		if (!res) throw new Error(`${this}: Syntax error`);
		return {
			context: expression(res[1]),
			only: res[2]
		};
	}

	async render(ctx, env, children) {
		let { context, only } = this.args;
		let inner_context = Object.assign(
			Object.create(only ? env.__ctx : ctx),
			context === undefined ? {} : context.call(ctx)
		);
		return children(inner_context);
	}
}