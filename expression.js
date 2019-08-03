import { parse } from 'acorn';
import { simple } from 'acorn-walk';

/*
	This way of replacing identifiers
	is inspired by @substack's falafel:
	https://github.com/substack/node-falafel/
 */
export default (str, ctx) => {
	let chunks = str.split('');
	let identifiers = [];
	simple(parse(str), {
		Identifier(node) {
			chunks[node.start] = `(__feuille__ctx__.${node.name})`;
			for (let i = node.start + 1; i < node.end; i++) {
				chunks[i] = '';
			}
		}
	});
	let body = chunks.join('');
	return new Function('__feuille__ctx__', `return ${body}`);
}