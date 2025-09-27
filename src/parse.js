import { Parser, tokTypes, TokenType } from 'acorn';
import { ancestor } from 'acorn-walk';
import { replace } from 'estraverse';
import { generate } from 'astring';

/*
	Regular expression from: 
	https://github.com/tc39/proposal-regexp-unicode-property-escapes
*/

const IDENTIFIER_REGEX = /[$_\p{ID_Start}][$\u200C\u200D\p{ID_Continue}]*/u;

// Source: https://262.ecma-international.org/14.0/#sec-keywords-and-reserved-words
const RESERVED_KEYWORDS = 'await break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield';
const FUTURE_RESERVED_KEYWORDS = 'implements interface package private protected public';

const REPLACEMENT_CHAR = '\uFFFD';
const SENTINEL_CODE = 0xfffe;
const SENTINEL_CHAR = '\uFFFE';

const DEFAULT_OPTS = {
	async: false,
	identifierScope: 'this',
	filterScope: 'this[Symbol.for("sontag/filters")]'
};

const PARSER_OPTS = {
	allowReserved: true,
	ecmaVersion: '2022',
	allowAwaitOutsideFunction: true,
	allowSuperOutsideMethod: true,
	allowImportExportEverywhere: true,
	locations: true,
	sourceType: 'module'
};

function binop(prec) {
	return {
		beforeExpr: true,
		binop: prec
	};
}

/*
	Sontag syntax extensions to JavaScript
	--------------------------------------
*/
const SONTAG_SYNTAX = [
	/*
		Filter operator: a | b

		Takes over from the bitwise-or operator,
		which is available as the bitor(a, b) built-in function.
	*/
	{
		match: /(?<!\|)(\|)(?!\|)/g,
		original: '|',
		token: binop(0.2),
		replacement: (node, opts) => {
			let { left, right } = node;

			if (right.type === 'CallExpression') {
				// We have a function on the right-hand side,
				// add left-hand side to the list of arguments
				right.callee.__is_filter__ = true;
				let replacement = {
					...right,
					arguments: right.arguments.concat(left)
				};
				return opts.async ? {
					type: "AwaitExpression",
					argument: replacement
				} : replacement;
			} else if (right.type === 'Identifier') {
				// We have an identifier on the right-hand side,
				// make it a function that calls the left-hand side
				right.__is_filter__ = true;
				let replacement = {
					type: 'CallExpression',
					callee: right,
					arguments: [ left ]
				};
				return opts.async ? {
					type: "AwaitExpression",
					argument: replacement
				} : replacement;
			}
		}
	},

	// a and b
	{ 
		match: /\band\b/g, 
		original: 'and',
		token: binop(2),
		replacement: (node, opts) => {
			node.operator = '&&';
			return node;
		}
	},

	// a or b
	{ 
		match: /\bor\b/g, 
		original: 'or',
		token: binop(1),
		replacement: (node, opts) => {
			node.operator = '||';
			return node;
		}
	},

	// not a
	{ 
		match: /\bnot\b/g, 
		original: 'not',
		token: {
			beforeExpr: true, 
			prefix: true, 
			startsExpr: true
		},
		replacement: (node, opts) => {
			node.operator = '!';
			return node;
		}
	}
].map((it, idx) => {
	return {
		...it,
		// Use non-characters for sentinel markers
		marker: String.fromCodePoint(idx + 0xfdd0)
	};
});

function putback(str) {
	SONTAG_SYNTAX.forEach(it => {
		str = str.replaceAll(SENTINEL_CHAR + it.marker, it.original);
	});
	return str;
}

class SontagParser extends Parser {
	constructor(...args) {
		super(...args);
		
		/* 
			Allow `with` as identifier, needed for Sontag syntax.
		*/
		this.keywords = new RegExp(
			this.keywords.source.replace(/\bwith\b/, ''), 
			this.keywords.flags
		);

		SONTAG_SYNTAX.forEach(it => {
			if (it.token) {
				const key = 'sontag_' + it.marker;
				tokTypes[key] = new TokenType(key, it.token);
			}
		});
	}

	readToken(code) {
		if (code === SENTINEL_CODE) {
			const next = this.input.charAt(this.pos + 1);
			const it = SONTAG_SYNTAX.find(it => it.marker === next);
			if (it) {
				return this.finishOp(tokTypes['sontag_' + it.marker], 2);
			}
		}
		return super.readToken(code);
	}
}

function prepareInput(str = '') {
	/*
		We split the string into an Array based on Unicode codepoints,
		rather than iterating on the string itself. 
	 */
	str = Array.from(str.replace(/\f|\r\n?/g, '\n')).map(char => {
		const c = char.codePointAt(0);
		/* 
			Replace null, surrogate code points, and the non-character sentinels 
			used for Sontag with the `U+FFFD REPLACEMENT CHARACTER`.

			See: https://corp.unicode.org/~asmus/proposed_faq/private_use.html
		*/
		if (!c || (c >= 0xd800 && c <= 0xdfff) || c === SENTINEL_CODE || (c >= 0xfdd0 && c <= 0xfdef)) {
			return REPLACEMENT_CHAR;
		}
		return char;
	}).join('');

	SONTAG_SYNTAX.forEach(it => {
		str = str.replaceAll(it.match, SENTINEL_CHAR + it.marker);
	});
	return str;
}

function prepareResult(ast, opts) {
	const replacements = new Map();

	function replaceNode(node) {
		const it = SONTAG_SYNTAX.find(it => 
			node.operator === SENTINEL_CHAR + it.marker && it.replacement
		);
		if (it) {
			replacements.set(node, it.replacement(node, opts));
		}
	};

	ancestor(ast, {

		Identifier(node, ancestors) {
			node.__replace_name__ = true;
		},

		TemplateElement(node) {
			// TODO should we treat the two differently?
			node.value.raw = putback(node.value.raw);
			node.value.cooked = putback(node.value.cooked);
		},

		Literal(node) {
			// String literals
			if (typeof node.value === 'string') {
				// TODO should we treat the two differently?
				node.value = putback(node.value);
				node.raw = putback(node.raw);
				return;
			}

			// Regular expression literals
			if (node.regex) {
				node.regex.pattern = putback(node.regex.pattern);
				node.raw = putback(node.raw);
				try {
					node.value = new RegExp(node.regex.pattern, node.regex.flags);
				} catch(err) {
					node.value = null;
				}
				return;
			}
		},

		BinaryExpression: replaceNode,
		UnaryExpression: replaceNode
	});

	return replace(ast, {
		enter(node) {
			if (replacements.has(node)) {
				return replacements.get(node);
			} else if (node.__replace_name__) {
				return {
					...node,
					name: node.__is_filter__ ? 
						`${opts.filterScope}.${node.name}` :
						`${opts.identifierScope}.${node.name}`
				};
			}
		}
	});
}

export function parseExpressions(str, opts = {}) {

	str = prepareInput(str);

	opts = {
		...DEFAULT_OPTS,
		...opts
	};

	/*
		Append one space character at the end of the string 
		to make sure Acorn parses the last expression as well.
		(Haven’t investigated what’s going on.)
	*/
	str += ' ';
	let parser = new SontagParser(PARSER_OPTS, str);
	parser.nextToken();

	const res = [];

	while (parser.pos < str.length) {
		let ast = prepareResult(
			parser.parseExpression(),
			opts
		);

		const result = generate(ast);
		if (result.indexOf(SENTINEL_CHAR) > -1) {
			throw new Error('Unexpected sentinel character, please report an issue');
		}
		res.push(result);
	}

	return res;
}

export function parseExpression(str, opts = {}) {

	str = prepareInput(str);

	opts = {
		...DEFAULT_OPTS,
		...opts
	};

	let parser = new SontagParser(PARSER_OPTS, str);
	parser.nextToken();
	
	let ast = prepareResult(
		parser.parseExpression(),
		opts
	);

	const result = generate(ast);
	if (result.indexOf(SENTINEL_CHAR) > -1) {
		throw new Error('Unexpected sentinel character, please report an issue');
	}
	return result;
}

export function parseImport(str, opts = {}) {

	opts = {
		...DEFAULT_OPTS,
		...opts
	};

	let parser = new SontagParser(
		PARSER_OPTS, 
		str
	);
	
	let ast = prepareResult(
		parser.parse(),
		opts
	);

	let declaration = ast.body[0];
	
	return {
		source: declaration.source.value,
		specifiers: declaration.specifiers.map(el => {
			const name = el.type === 'ImportSpecifier' ? el.imported.name : '*';
			return {
				name,
				local: el.local.name
			};
		})
	};
}

export function parseFunctionSignature(str, opts = {}) {

	str = prepareInput(str);

	opts = {
		...DEFAULT_OPTS,
		...opts
	};

	let parser = new SontagParser(
		PARSER_OPTS, 
		`function ${str} {}`
	);
	parser.nextToken();
	
	let ast = prepareResult(
		parser.parseExpression(),
		opts
	);

	if (generate(ast).indexOf(SENTINEL_CHAR) > -1) {
		throw new Error('Unexpected sentinel character, please report an issue');
	}
	
	return {
		name: ast.id.name,
		params: ast.params.map(param => {
			if (param.type === 'Identifier') {
				return {
					name: param.name
				}
			}
			if (param.type === 'AssignmentPattern') {
				return {
					name: generate(param.left),
					value: generate(param.right)
				}
			}
		})
	};
}

/* 
	Parses a Sontag-flavored expression 
	and returns a function that can evaluate it
	when it has its `this` attached to a context.
*/

// The AsyncFunction constructor is not a global object,
// so we need to pick it off an anonymous async function.
let AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

/*
	Parses the string `str` into an async function.
	The function then needs to be call()-ed with a certain scope.
 */
export function expression(str) {
	return wrapAsync(parseExpression(str, { async: true }));
}

export function wrapAsync(str, ...args) {
	return new AsyncFunction(
		...args,
		`return ${ str }`
	);
}

export function func(str) {
	return parseFunctionSignature(str, { async: true });
};

export function expressions(str) {
	return parseExpressions(str, { async: true });
}

export function importStatement(str) {
	return parseImport(str);
}

export function identifier(str) {
	return str?.trim().match(IDENTIFIER_REGEX)?.[0] ?? null;
}