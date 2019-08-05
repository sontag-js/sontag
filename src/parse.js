import { Parser } from 'acorn';
import { simple } from 'acorn-walk';

const parseExpression = str => {
	let parser = new Parser({
	    allowReserved: true
	}, str);	
	/*
		Disable ECMAScript keywords so that Acorn
		parses `class`, `var`, `function`, etc.
		as identifiers instead of throwing syntax error.
	 */
	parser.keywords = /[^\s\S]/g;
	parser.nextToken();
	return parser.parseExpression();
}

const operators = {
	' and ': '&&',
	' or ': '||',
	' b-or ': '|',
	' b-and ': '&',
	' b-xor ': '^',
	'~': '+' 
};

const unsupported_operators = [
	'\\.{2}',  // ..
	'\\/\\/',  // //
	'\\?\\:', // ?:
	'\\?\\?', // ??
	' starts with ', 
	' ends with ', 
	' matches ', 
	' in ', 
	' is ', 
	' not '
];

const operators_re = new RegExp(Object.keys(operators).join('|'), 'g');
const unsupported_re = new RegExp(unsupported_operators.join('|'), 'g');

// Matches | character when not in an OR || operator
const filter_re = /[^\|]\|(?!\|)/g;

export function args(str) {
	return function() {
		return expression(`extract_args(${str})`, undefined, ['extract_args']).call(this, function() {
			return Array.from(arguments);
		});
	};
}

export function filter(str) {
	str = str.trim();
	let res = str.match(/^([^(]+)\s*\(([^]+)\)$/);
	if (res) {
		let [ str, id, partial_args ] = res;
		let filter = expression(id, 'this.__filters__');
		let partial = args(partial_args);
		return function() {
			let ctx = this;
			return function() {
				let fn = filter.call(ctx);
				let pargs = partial.call(ctx);
				return fn.apply(ctx, pargs.concat(Array.from(arguments)));
			}
		};
	}
	return expression(str, 'this.__filters__');
}

export function expression(str, scope = 'this', args = []) {
	if (!str) {
		return undefined;
	}

	// Throw on unsupported operators
	let bummer = str.match(unsupported_re);
	if (bummer) {
		throw new Error(`These operators are not yet supported: ${ bummer.join(', ') }`)
	}
	
	// Find filter calls
	let parts = str.split(filter_re);
	if (parts.length > 1) {

		let value = expression(parts[0]);
		let filters = parts.slice(1)
			.map(filter);

		// Chain the filters on the initial expression
		return function() {
			return filters.reduce((res, f) => f.call(this)(res), value.call(this));
		};
	}

	// Replace operators
	str = str.replace(operators_re, matched => operators[matched]);
	/*
		Parse & replace identifiers with scoped versions

		This way of replacing identifiers
		is inspired by @substack's falafel:
		https://github.com/substack/node-falafel/
	 */
	let chunks = str.split('');
	let skip = Object.fromEntries(args.map(a => [a, true]));
	try {
		simple(parseExpression(str), {
			Identifier(node) {
				if (skip[node.name]) return;
				chunks[node.start] = `(${scope}.${node.name})`;
				for (let i = node.start + 1; i < node.end; i++) {
					chunks[i] = '';
				}
			}
		});
	} catch(err) {
		console.error(err);
		throw new Error(`Invalid expression: ${str}`);
	}
	let body = chunks.join('');
	return new Function(...args, `return ${body}`);
};

export const TAG = /^\s*([^\s]+)\s*([^]+)$/;
export const INCLUDE = /^([^]+?)(\s+ignore\s+missing)?(?:\s+with\s+([^]+?))?(\s+only)?$/;
export const SET = /^([^\s]+?)(?:\s*=[^=]*([^]+))?$/;
export const FOR = /^([^\,]+?)(?:\s*\,\s*([^\s]+?))?\s+in\s+([^]+)$/;