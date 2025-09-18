import SymbolTree from 'symbol-tree';
import { Root, Text, Expression } from './node.js';
import fsLoader from './loaders/fs.js';

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
import SetTag from './tags/set.js';
import UseTag from './tags/use.js';
import WithTag from './tags/with.js';

export const TAG_PARTS = /^\s*([^\s]+)\s*([^]*)$/;

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
			[Symbol.for('sontag/filters')]: {
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
		this.addTag(SetTag);
		this.addTag(UseTag);
		this.addTag(WithTag);
	}

	tokenize(str) {

		const chars = Array.from(str.replace(/\f|\r\n?/g, '\n')).map(char => {
			const c = char.codePointAt(0);
			if (!c || (c >= 0xd800 && c <= 0xdfff)) {
				return '\uFFFD';
			}
			return char;
		});
		const tokens = [];
		let token;
		let ch;
		let i = 0;
		let m;
		let verbatim;

		function is_ws(offset = 0) {
			return (
				chars[i + offset] === ' ' ||
				chars[i + offset] === '\n' ||
				chars[i + offset] === '\t'
			);
		}

		while (i < chars.length) {

			// Consume tag
			if (!verbatim && chars[i] === '{' && chars[i+1] === '%') {
				i += 2; // consume start of tag
				let value = '';
				while (i < chars.length && !(chars[i] === '%' && chars[i+1] === '}')) {
					value += chars[i];
					i++;
				}
				if (i === chars.length) {
					throw new Error('Unexpected end of input, unfinished tag');
				}
				i += 2; // consume end of tag

				if (m = value.match(/^\s*(raw|verbatim)(\s*$|\s+[^]+)/i)) {
					// Consume plain text until end of verbatim tag
					
					// if already in text mode, append to current text token,
					// otherwise create a new text token.
					if (token?.type !== 'text') {
						token = {
							type: 'text',
							value: ''
						};
						tokens.push(token);
					}
					verbatim = m[2]?.trim() ? 
						new RegExp(`^{%\\s*end${m[1]}\\s+${m[2].trim()}\\s*%}`, 'i') :
						new RegExp(`^{%\\s*end${m[1]}\\s*%}`, 'i');
				} else {
					tokens.push(token = {
						type: 'tag',
						value: value.trim()
					});
				}
				continue;
			}

			if (verbatim && chars[i] === '{' && chars[i+1] === '%' && (m = chars.slice(i).join('').match(verbatim))) {
				verbatim = null;
				i += m[0].length; // consume end of verbatim
				continue;
			}

			// Consume comment
			if (!verbatim && chars[i] === '{' && chars[i+1] === '#') {
				i += 2; // consume start of comment
				while (i < chars.length && !(chars[i] === '#' && chars[i+1] === '}')) {
					i++;
				}
				if (i === chars.length) {
					throw new Error('Unexpected end of input, unfinished comment');
				}
				i += 2; // consume end of comment
				continue;
			}

			// Consume expression
			if (!verbatim && chars[i] === '{' && chars[i+1] === '{') {
				i += 2; // consume start of expression
				token = {
					type: 'expression',
					value: ''
				};
				while (i < chars.length && !(chars[i] === '}' && chars[i+1] === '}')) {
					token.value += chars[i];
					i++;
				}
				if (i === chars.length) {
					throw new Error('Unexpected end of input, unfinished expression');
				}
				token.value = token.value.trim();
				tokens.push(token);
				i += 2; // consume end of expression
				continue;
			}

			// Consume plain text
			if (token?.type !== 'text') {
				token = {
					type: 'text',
					value: ''
				};
				tokens.push(token);
			}
			token.value += chars[i];
			i++;
		}
		return tokens;
	}

	parse(contents, f = '(String)') {

		// Basic error logging
		let line = 1, line_count = 0, loc = () => `[${f}:${line - line_count}]`;

		let tokens = this.tokenize(contents);
		let tok;
		
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

			// Consume an expression

			if (tok.type === 'expression') {
				tree.appendChild($head, new Expression(tok.value));
				continue;
			}

			// Consume a tag

			if (tok.type === 'tag') {

				const [_, tagName, signature] = tok.value.match(TAG_PARTS) ?? [];
				const tags = this.tagsFor(tagName); 

				if (!tags?.length) {
					throw new Error(`${loc()} Unknown tag ${tagName}`);
				}

				const tag = tags[0];

				if (tag.type === 'start') {
					// Start tag (e.g. `if`)
					let node = new tag.constructor(tagName, signature.trim());
					tree.appendChild($head, node);
					if (!node.singular()) {
						$head = node;
					}
				} else if (tag.type === 'end') {
					// End tag (e.g. `endif`)
					let node = new tag.constructor(tagName, signature.trim());
					const $parent = tree.parent($head);
					if ($head.constructor !== tag.constructor || $head.type === 'end' || !$parent) {
						throw new Error(`${loc()} Can’t close ${$head} with ${node}`);
					}
					// Close the tag by pointing upwards
					$head = $parent;
				} else {
					// Inside tag (e.g. `else`, `elseif`)
					const $parent = tree.parent($head);
					if ($head.type === 'end' || !$parent) {
						throw new Error(`${loc()} Can’t include ${tagName} in ${$head}`);
					}
					const insideTag = tags.find(it => it.constructor === $head.constructor);
					if (!insideTag) {
						throw new Error(`${loc()} Can’t include ${tagName} in ${$head}`);
					}
					let node = new insideTag.constructor(tagName, signature.trim());
					node.setRelated($head);
					tree.appendChild($parent, node);
					$head = node;
				}
				continue;
			}

			if (tok.type === 'text') {
				tree.appendChild($head, new Text(tok.value));
				continue;
			}

			throw new Error(`Unexpected token type ${tok.type}`);
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
	async renderTree(tree, $node, scope) {
		async function renderChildren(inner_scope) {
			const texts = [];
			for (let $childNode of tree.childrenToArray($node)) {
				texts.push(
					await this.renderTree(tree, $childNode, inner_scope)
				);
			}
			return texts.join('');
		};
		// TODO: `set`, `macro`, `import`, `from` can bring things into the outer_scope.
		return $node.render(scope, renderChildren.bind(this), this);
	}

	async render(template, context) {
		let contents = await this.options.loader(template, this.cwd);
		return this.renderString(contents, context);
	}

	async renderString(contents, context) {
		let scope = Object.assign(Object.create(this.global_scope), context);
		let { tree, $root } = this.parse(contents);
		return this.renderTree(tree, $root, scope);
	}

	tagsFor(tagName) {
		return this.tags[tagName];
	}

	addTag(TagClass) {
		TagClass.tagNames.forEach(tagName => {
			this.tags[tagName] = (this.tags[tagName] || []).concat({
				constructor: TagClass, 
				type: 'start'
			});
			if (!TagClass.singular) {
				this.tags[`end${tagName}`] = (this.tags[`end${tagName}`] || []).concat({
					constructor: TagClass, 
					type: 'end'
				});
			}
		});

		(TagClass.insideTagNames || []).forEach(tagName => {
			this.tags[tagName] = (this.tags[tagName] || []).concat({
				constructor: TagClass, 
				type: 'inside'
			});
		});
	}

	addFilter(name, fn) {
		this.global_scope[Symbol.for('sontag/filters')][name] = fn;
	}
}

export default Sontag;
export * as types from './node.js';