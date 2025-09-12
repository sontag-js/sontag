import { expression } from './parse.js';
import memo from 'memoize-one';

/*
	The Node base class
	-------------------

	Represents an item in the AST,
	all other types extend this class.
 */
export class Node {

	toString() {
		return `${this.constructor.name}`;
	}

	/* 
		Render the node to a string by applying the `scope`.
		By default a Node renders its children. 

		Since the tree structure is not available in the class,
		the function to render children comes from the outside.
	*/
	async render(scope, env, children) {
		return children(scope);
	}
};

/*
	The Root is the topmost node in the AST.
	It doesn’t do anything special at the moment.
 */
export class Root extends Node {};

/*
	An expression, e.g. {{ post.title }}
 */
export class Expression extends Node {
	constructor(signature) {
		super();
		this.signature = signature;
		this.parse = memo(v => expression(v));
	}

	async render(scope) {
		return this.parse(this.signature).call(scope);
	}
};

/*
	A comment block, e.g. {# Note #}
	This class is not used at the moment.
 */
export class Comment extends Node {
	constructor(value) {
		super();
		this.value = value || '';
	}

	async render() {
		return '';
	}

	toString() {
		return `${this.constructor.name}(${this.value})`;
	}
};

/*
	A run of static text.
 */
export class Text extends Node {
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

/*
	A tag, e.g. {% include 'components/note.son' %}
 */
export class Tag extends Node {
	
	constructor(tagName, type, signature) {
		super();
		this.tagName = tagName;
		this.$typeof = type;
		this.signature = signature;
		this.parseArgs = memo(this.parseArgs);
	}

	/*
		A method meant to be implemented in Tag subclasses
		to parse the signature into actual arguments.
	 */
	parseArgs(signature) {
		return null;
	}

	/*
		The arguments for a Tag node can be read with this.args()
	 */
	args() {
		return this.parseArgs(this.signature);
	}

	/*
		A string representation of the tag, 
		useful for debugging.
	 */
	toString() {
		return `${this.constructor.name}(${this.tagName})`;
	}

	/*
		Some tags such as {% set %} work either 
		as singular tags or paired tags, and we only know 
		at run-time whether a particular tag is self-closing or not. 

		So by default, return the static property defined on the tag, 
		but allow individual tags to override the logic.
	 */
	singular() {
		return this.constructor.singular;
	}
};

/*
	Symbols to distinguish opening from closing tags
	in paired tags, e.g. `block` vs. `endblock`
 */
export const $tag_start = Symbol('tag/start');
export const $tag_inside = Symbol('tag/inside');
export const $tag_end = Symbol('tag/end');