import Node from './node.js';

/*
	A run of static text.
 */
export default class Text extends Node {
	constructor(value) {
		super();
		this.value = value || '';
	}

	async render() {
		return this.value;
	}

	toString() {
		return `${this.constructor.name}(${this.value})`;
	}
};