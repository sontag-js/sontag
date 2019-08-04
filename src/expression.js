import { parseExpressionAt } from 'acorn';
import { simple } from 'acorn-walk';

/*
	This way of replacing identifiers
	is inspired by @substack's falafel:
	https://github.com/substack/node-falafel/
 */
export function parseExpression(str) {
	let chunks = str.split('');
	let identifiers = [];
	try {
		simple(parseExpressionAt(str), {
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
	// console.log(body);
	return new Function(`return ${body}`);
};