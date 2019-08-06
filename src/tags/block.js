import { Tag } from '../node-types';
import { expression } from '../parse';

export default class BlockTag extends Tag {
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