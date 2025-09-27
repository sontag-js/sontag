import SymbolTree from 'symbol-tree';
import fsLoader from './loaders/fs.js';

// Functions
import DumpFunction from './functions/dump.js';
import BitorFunction from './functions/bitor.js';

// Filters
import BatchFilter from './filters/batch.js';

// Nodes
import Root from './nodes/root.js'
import Text from './nodes/text.js'
import Expression from './nodes/expression.js';
import ApplyTag from './nodes/tags/apply.js';
import BlockTag from './nodes/tags/block.js';
import CallTag from './nodes/tags/call.js';
import EmbedTag from './nodes/tags/embed.js';
import ExtendsTag from './nodes/tags/extends.js';
import ForTag from './nodes/tags/for.js';
import IfTag from './nodes/tags/if.js';
import ImportTag from './nodes/tags/import.js';
import IncludeTag from './nodes/tags/include.js';
import MacroTag from './nodes/tags/macro.js';
import SetTag from './nodes/tags/set.js';
import UseTag from './nodes/tags/use.js';
import WithTag from './nodes/tags/with.js';

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
		this.global_scope = Object.assign(
			Object.create(null),
			{
				// Built-in functions
				dump: DumpFunction.bind(this),
				bitor: BitorFunction.bind(this),
				
				/* 
					Standard built-in objects
					See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects 
				*/
				Infinity,
				NaN,
				undefined,
	   			Number,
	   			Math,
	   			Date,
	   			Intl,
	   			JSON,

	   			/*
	   				Host objects
	   			*/
	   			URL,

				// Built-in filters
				[Symbol.for('sontag/filters')]: {
					batch: BatchFilter.bind(this)
				}
			}
		);

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
		const renderChildren = async (inner_scope) => {
			const texts = [];
			const blocks = [];
			const is_extending = inner_scope[Symbol.for('sontag/extends')];
			for (let $childNode of tree.childrenToArray($node)) {
				const text = await this.renderTree(tree, $childNode, inner_scope);
				if (is_extending) {
					if (typeof text === 'object') {
						blocks.push(text);
					}
				} else {
					texts.push(text);
				}
			}
			return is_extending ? blocks : texts.join('');
		};

		if ($node.bindings) {
			Object.assign(
				scope,
				await $node.bindings(scope, renderChildren, this)
			);
		}

		const result = $node.render(scope, renderChildren, this);
		return result;
	}

	/*	
		
	*/
	async import(source, context) {
		let contents = await this.options.loader(source, this.cwd);
		if (contents === null) {
			throw new Error(`Couldn’t find: ${source}`);
		}
		let { tree, $root } = this.parse(contents);
		const exports = {};

		const children = tree.childrenToArray($root);

		let scope = Object.assign(Object.create(this.global_scope), context);
		
		for (let i = 0; i < children.length; i++) {
			const $node = children[i];
			const renderChildren = async (inner_scope) => {
				const texts = [];
				for (let $childNode of tree.childrenToArray($node)) {
					texts.push(
						await this.renderTree(tree, $childNode, inner_scope)
					);
				}
				return texts.join('');
			};

			if ($node.bindings) {
				const bindings = await $node.bindings(scope, renderChildren, this);
				Object.assign(exports, bindings);
				Object.assign(scope, bindings);
			}
		}

		return Object.fromEntries(
			Object.entries(exports).filter(entry => entry[0][0] !== '_')
		);
	}

	async render(candidates, context) {
		let contents = await this.options.loader(candidates, this.cwd);
		if (contents === null) {
			return null;
		}
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