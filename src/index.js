import SymbolTree from 'symbol-tree';
import { Root, Text, Expression, $tag_start, $tag_end, $tag_inside } from './node-types.js';
import fsLoader from './fs.js';

// Functions
import BlockFunction from './functions/block.js';
import DumpFunction from './functions/dump.js';
import IncludeFunction from './functions/include.js';
import ParentFunction from './functions/parent.js';
import SuperFunction from './functions/parent.js';
import SourceFunction from './functions/source.js';

// Filters
import BatchFilter from './filters/batch.js';
import DefaultFilter from './filters/default.js';

// Tags
import ApplyTag from './tags/apply.js';
import BlockTag from './tags/block.js';
import CallTag from './tags/call.js';
import EmbedTag from './tags/embed.js';
import ExtendsTag from './tags/extends.js';
import ForTag from './tags/for.js';
import IfTag from './tags/if.js';
import ImportTag from './tags/import.js';
import IncludeTag from './tags/include.js';
import MacroTag from './tags/macro.js';
import RawTag from './tags/raw.js';
import SetTag from './tags/set.js';
import UseTag from './tags/use.js';
import WithTag from './tags/with.js';

export const TAG_PARTS = /^\s*([^\s]+)\s*([^]+)$/;

const Tokens = {
	TSTART: '{%',
	TEND: '%}',
	ESTART: '{{',
	EEND: '}}',
	CSTART: '{#',
	CEND: '#}'
};

class Sontag {

	constructor(cwd, options = {}) {
		this.cwd = cwd;

		this.options = {
			loader: fsLoader,
			...options
		};

		/*
			Default scope
		 */
		this.global_scope = {
			// Built-in functions	
			block: BlockFunction.bind(this),
			dump: DumpFunction.bind(this),
			include: IncludeFunction.bind(this),
			parent: ParentFunction.bind(this),
			super: SuperFunction.bind(this),
			source: SourceFunction.bind(this),

			//  Built-in filters
			__filters__: {
				batch: BatchFilter.bind(this),
				default: DefaultFilter.bind(this)
			}
		};

		// Built-in tags
		this.tags = {};
		this.addTag(ApplyTag);
		this.addTag(BlockTag);
		this.addTag(CallTag);
		this.addTag(EmbedTag);
		this.addTag(ExtendsTag);
		this.addTag(ForTag);
		this.addTag(IfTag);
		this.addTag(ImportTag);
		this.addTag(IncludeTag);
		this.addTag(MacroTag);
		this.addTag(RawTag);
		this.addTag(SetTag);
		this.addTag(UseTag);
		this.addTag(WithTag);
	}

	parse(contents, f = '(String)') {

		// Basic error logging
		let line = 1, line_count = 0, loc = () => `[${f}:${line - line_count}]`;

		/* 
			Split the input by relevant tokens.
		*/
		let regex = new RegExp(`(${Object.values(Tokens).join('|')})`, 'g');
		let tokens = contents.split(regex);
		let tok;
		let rawmode = false;

		/*
			The AST tree
		 */
		let tree = new SymbolTree();

		/* 
			Root of the AST tree.
		*/
		let $root = new Root();

		/*
			The current insertion point.
			This is initially the root of the tree,
			but changes when we enter tags that have
			opening / closing statements.
		 */
		let $head = $root;

		while (tokens.length) {

			tok = tokens.shift();

			line_count = (tok.match(/\n/g) || []).length;
			line += line_count;

			// Consume a comment

			if (!rawmode && tok === Tokens.CSTART) {
				while (tokens.length && tokens[0] !== Tokens.CEND) {
					tok = tokens.shift();
				}
				if (!tokens.length) {
					throw new Error(`${loc()} Unterminated comment`);
				}
				tok = tokens.shift(); // consume CEND
				continue;
			}

			// Consume an expression

			if (!rawmode && tok === Tokens.ESTART) {
				while (tokens.length && tokens[0] !== Tokens.EEND) {
					tok = tokens.shift();
					tree.appendChild($head, new Expression(tok));
				}
				if (!tokens.length) {
					throw new Error(`${loc()} Unterminated expression`);
				}
				tok = tokens.shift(); // consume EEND
				continue;
			}

			// Consume a tag

			if (tok === Tokens.TSTART) {

				let start_node = new Text(tok);
				if (rawmode) {
					tree.appendChild($head, start_node);
				}

				while (tokens.length && tokens[0] !== Tokens.TEND) {
					tok = tokens.shift();
					const [_, tagName, signature] = tok.match(TAG_PARTS) ?? [];
					const tag = this.tag(tagName); 

					if (rawmode) {
						if (tag?.constructor.raw && tag?.type === $tag_end) {
							tree.remove(start_node);
							rawmode = false;
						} else {
							// consume tag as plain text
							tree.appendChild($head, new Text(tok));
						}
					} else {

						if (!tag) {
							throw new Error(`${loc()} Unknown tag ${tagName}`);
						}

						if (tag.constructor.raw && tag.type === $tag_start) {
							rawmode = true;
							// consume TEND so it doesn’t get appended as plain text
							tok = tokens.shift();
						} else {
							let node = new tag.constructor(tagName, tag.type, signature.trim());
							if (tag.type === $tag_start) {
								tree.appendChild($head, node);
								if (!node.singular()) {
									$head = node;
								}
							} else if (tag.type === $tag_end) {
								let parent = tree.parent($head);
								if ($head.constructor !== tag.constructor || !parent) {
									throw new Error(`${loc()} Can't close ${$head} with ${node}`);
								}
								if ($head.$typeof === $tag_start) {
									$head = parent;
								} else if ($head.$typeof === $tag_inside) {
									$head =  tree.parent(parent);
								}
							} else if (tag.type === $tag_inside) {
								let parent = tree.parent($head);
								if ($head.constructor !== tag.constructor || !parent) {
									throw new Error(`${loc()} Can't include ${node} in ${$head}`);
								}
								tree.appendChild($head, node);
								$head = node;
							}
						}
					}
				}
				if (tokens.length) {
					// consume TEND
					tok = tokens.shift();
					if (rawmode) {
						tree.appendChild($head, new Text(tok));
					}
				} else if (!rawmode) {
					throw new Error(`${loc()} Unterminated tag`);
				}
				continue;
			}

			// Consume static content

			tree.appendChild($head, new Text(tok));
		};

		if ($head !== $root) {
			throw new Error(`${$head} left unclosed`);
		}

		return {
			tree,
			$root
		};
	} 

	/*
		Apply the `scope` to the `$node` node of `tree`.
	*/
	async apply(tree, $node, scope, condition) {
		const renderChildren = async (outer_scope, condition) => {
			const texts = await Promise.all(
				tree.childrenToArray($node).map(
					async $it => await this.apply(tree, $it, outer_scope, condition)
				)
			);
			return texts.join('');
		}
		const res = await $node.render(scope, this, renderChildren);
		return typeof res === 'function' ? res(condition) : res;
	}

	async render(template, context) {
		let contents = await this.options.loader(template, this.cwd);
		return this.renderString(contents, context);
	}

	async renderString(contents, context) {
		let scope = Object.assign(Object.create(this.global_scope), context);
		let { tree, $root } = this.parse(contents);
		return this.apply(tree, $root, scope);
	}

	tag(tagName) {
		return this.tags[tagName];
	}

	addTag(TagClass) {
		TagClass.tagNames.forEach(tagName => {
			this.tags[tagName] = {
				constructor: TagClass, 
				type: $tag_start
			};
			if (!TagClass.singular) {
				this.tags[`end${tagName}`] = {
					constructor: TagClass, 
					type: $tag_end
				};
			}
		});

		(TagClass.insideTagNames || []).forEach(tagName => {
			this.tags[tagName] = {
				constructor: TagClass, 
				type: $tag_inside
			};
		});
	}

	addFilter(name, fn) {
		this.global_scope.__filters__[name] = fn;
	}
}

export default Sontag;
export * as types from './node-types.js';