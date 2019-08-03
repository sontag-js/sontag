export class Node {
	toString() {
		return `${this.constructor.name}`;
	}
	eval(ctx) {
		return '';
	}
};

export class Root extends Node {
};

export class Expression extends Node {};

export class Comment extends Node {
	constructor() {
		super();
		this.value = '';
	}

	toString() {
		return `${this.constructor.name}(${this.value})`;
	}
};

export class Text extends Node {
	constructor(value) {
		super();
		this.value = value || '';
	}

	eval() {
		return this.value;
	}

	toString() {
		return `${this.constructor.name}(${this.value})`;
	}
};

export class Tag extends Node {
	
	constructor(tagName, type, signature) {
		super();
		this.tagName = tagName;
		this.type = type;
		this.signature = signature;
	}

	toString() {
		return `${this.constructor.name}(${this.tagName})`;
	}
};

export const $tag_start = Symbol('tag:start');
export const $tag_inside = Symbol('tag:inside');
export const $tag_end = Symbol('tag:end');

/*
	Built-in tags
	-------------
 */

export class ApplyTag extends Tag {
	static tagNames = ['apply'];
}

export class EmbedTag extends Tag {
	static tagNames = ['embed'];
}

export class ExtendsTag extends Tag {
	static tagNames = ['extends'];
	static singular = true;
}

export class IncludeTag extends Tag {
	static tagNames = ['include'];
	static singular = true;
}

export class ImportTag extends Tag {
	static tagNames = ['import'];
	static singular = true;
}

export class MacroTag extends Tag {
	static tagNames = ['macro'];
}

export class UseTag extends Tag {
	static tagNames = ['use'];
}

export class SetTag extends Tag {
	static tagNames = ['set'];
	static singular = true;
}

export class BlockTag extends Tag {
	static tagNames = ['block'];
}

export class ForTag extends Tag {
	static tagNames = ['for'];
}

export class IfTag extends Tag {
	static tagNames = ['if'];
	static insideTagNames = ['elseif', 'else'];
}

export class RawTag extends Tag {
	static tagNames = ['raw', 'verbatim'];
	static scope = 'raw';
}

export class FilterTag extends Tag {
	static tagNames = ['filter'];
}

export class CallTag extends Tag {
	static tagNames = ['call'];
}

export class WithTag extends Tag {
	static tagNames = ['with'];
}