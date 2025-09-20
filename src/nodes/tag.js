import Node from './node.js';

import { expression } from '../parse.js';
import memo from 'memoize-one';

/*
	A tag, e.g. {% include 'components/note.son' %}
 */
export default class Tag extends Node {

	static tagNames = [];
	static insideTagNames = [];
	
	constructor(tagName, signature) {
		super();
		this.tagName = tagName;
		if (this.constructor.tagNames.indexOf(tagName) > -1) {
			this.type = 'start';
		} else if (this.constructor.insideTagNames.indexOf(tagName) > -1) {
			this.type = 'inside';
		} else if (this.constructor.tagNames.indexOf(tagName.replace(/^end/, '')) > -1) {
			this.type = 'end';
		} else {
			throw new Error(`Unexpected tag name ${tagName}`);
		}
		
		this.signature = signature;
		this.parseArgs = memo(this.parseArgs);
		this.related = null;
	}

	/*
		Related tag (e.g. the previous `if` for an `else`)
	*/
	setRelated(node) {
		this.related = node;
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