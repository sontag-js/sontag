import memo from 'memoize-one';

import Node from './node.js';
import { expression } from '../parse.js';

/*
	An expression, e.g. {{ post.title }}
 */
export default class Expression extends Node {
	constructor(signature) {
		super();
		this.signature = signature;
		this.parse = memo(v => expression(v));
	}

	async render(scope) {
		return this.parse(this.signature).call(scope);
	}
};