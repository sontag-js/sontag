import { Tag } from '../node-types';
import { expression } from '../parse';

export const FOR = /^([^\,]+?)(?:\s*\,\s*([^\s]+?))?\s+in\s+([^]+)$/;

export default class ForTag extends Tag {
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