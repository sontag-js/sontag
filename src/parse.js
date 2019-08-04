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

/*
	This way of replacing identifiers
	is inspired by @substack's falafel:
	https://github.com/substack/node-falafel/
 */
export function expression(str) {
	if (!str) {
		return undefined;
	}
	let chunks = str.split('');
	let identifiers = [];
	try {
		simple(parseExpression(str), {
			Identifier(node) {
				chunks[node.start] = `(this.${node.name})`;
				for (let i = node.start + 1; i < node.end; i++) {
					chunks[i] = '';
				}
			}
		});
	} catch(err) {
		throw new Error(`Invalid expression: ${str}`, err);
	}
	let body = chunks.join('');
	return new Function(`return ${body}`);
};

export const TAG = /^\s*([^\s]+)\s*([^]+)$/;
export const INCLUDE = /^([^]+?)(\s+ignore\s+missing)?(?:\s+with\s+([^]+?))?(\s+only)?$/;
export const SET = /^([^\s]+?)(?:\s*=[^=]*([^]+))?$/;
export const FOR = /^([^\,]+?)(?:\s*\,\s*([^\s]+?))?\s+in\s+([^]+)$/;