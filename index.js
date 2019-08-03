import { readFile } from 'fs';
import { join } from 'path';
import SymbolTree from 'symbol-tree';
import * as types from './node-types';
import { parse } from 'acorn';

const tokens = {
	TSTART: '{%',
	TEND: '%}',
	ESTART: '{{',
	EEND: '}}',
	CSTART: '{#',
	CEND: '#}'
};

const lookup = Object.keys(tokens).reduce(
	(acc, key) => (acc[tokens[key]] = true, acc), {}
);

class Feuille {

	constructor(cwd, options = {}) {
		this.cwd = cwd;
		this.options = {
			...options
		};

		this.tags = {};

		// add built-in tags
		Object.values(types).forEach(ctor => {
			if (ctor.prototype instanceof types.Tag) {
				this.addTag(ctor);
			}
		});
	}

	parse(contents, f = '(String)') {
		let regex = new RegExp(`(${Object.values(tokens).join('|')})`, 'g');
		let result = contents.split(regex);

		let { TSTART, CSTART, ESTART, TEND, CEND, EEND } = tokens;

		let nodeList = [], node;

		let line = 1;
		let loc = () => `[${f}:${line}]`;

		result.forEach(item => {
			if (
				lookup[item] && 
				(!(node instanceof types.Comment) || item === CEND)
			) {
				if (item === CSTART || item === ESTART || item === TSTART) {
					// block start
					if (node) {
						if (node instanceof types.Text) {
							nodeList.push(node);
							node = null;
						} else {
							throw new Error(`${loc()} Unexpected token ${item}`);
						}
					}
					if (item === CSTART) {
						node = new types.Comment();
					} else if (item === ESTART) {
						node = new types.Expression();
					} else if (item === TSTART) {
						node = new types.Tag();
					}
				} else if (item === CEND || item === EEND || item === TEND) {
					// block end
					if (!node) {
						throw new Error(`${loc()} Unexpected end: ${item}`);
					}
					if (item === CEND) {
						if (node instanceof types.Comment) {
							nodeList.push(node);
							node = null;
						} else {
							throw new Error(`${loc()} Unexpected end of comment: ${item}`);
						}
					} else if (item === EEND) {
						if (node instanceof types.Expression) {
							nodeList.push(node);
							node = null;
						} else {
							throw new Error(`${loc()} Unexpected end of expression: ${item}`);
						}
					} else if (item === TEND) {
						if (node instanceof types.Tag) {
							if (!node.tagName) {
								throw new Error(`${loc()} Missing tag nname: ${item}`);
							}
							nodeList.push(node);
							node = null;
						} else {
							throw new Error(`${loc()} Unexpected end of block: ${item}`);
						}
					}
				}
			} else {
				// text
				if (!node) {
					node = new types.Text();
					node.value += item;
				} else {
					if (node instanceof types.Text) {
						node.value += item;
					} else if (node instanceof types.Tag) {
						let res = item.match(/^\s*([^\s]+)\s*(.*?)\s*$/);
						if (!res) {
							throw new Error(`${loc()} Missing tag`);
						}
						let [ str, tagName, signature ] = res;
						let t = this.tag(tagName);
						if (t) {
							let [ctor, type] = t;
							node = new ctor(tagName, type, signature);
							if (ctor.raw) {
								// todo
							}
						} else {
							throw new Error(`${loc()} Unknown tag ${tagName}`);
						}
					} else if (node instanceof types.Comment) {
						node.value += item;
					} else if (node instanceof types.Expression) {
						node.value = parse(item);
					}
				}
			}
			line += (item.match(/\n/g) || []).length;
		});

		if (node && node instanceof types.Text) {
			nodeList.push(node);
			node = null;
		}

		if (node) {
			throw new Error(`${loc()} ${node.constructor.name} has not been closed`);
		}

		let tree = new SymbolTree();
		let $root = new types.Root();
		let $head = $root;

		nodeList.forEach(node => {
			if (node instanceof types.Text) {
				tree.appendChild($head, node);
			} else if (node instanceof types.Comment) {
				// no-op (we skip Comment nodes)
			} else if (node instanceof types.Tag) {
				if (node.type === types.$tag_start) {
					tree.appendChild($head, node);
					let ctor = node.constructor;
					if (!ctor.singular) {
						$head = node;
					}
				} else if (node.type === types.$tag_end) {
					let parent = tree.parent($head);
					if ($head.constructor !== node.constructor || !parent) {
						throw new Error(`Can't close ${$head} with ${node}`);
					}
					$head = parent;
				} else if (node.type === types.$tag_inside) {
					// todo
				}

			} else if (node instanceof types.Expression) {
				node.value = () => { /* todo */ };
				tree.appendChild($head, node);
			}
		});

		if ($head !== $root) {
			throw new Error(`${$head} left unclosed`);
		}

		return {
			tree,
			$root
		};
	} 

	async apply(tree, $root, ctx) {
		let res = $root.eval();
		let it = tree.childrenIterator($root);
		let is = it.next();
		let node;
		while (!is.done) {
			node = is.value;
			res += await this.apply(tree, node, ctx);
			is = it.next();
		}
		return res;
	}

	async render(template, ctx = {}) {
		let file = await readFile(join(cwd, template), 'utf8');
		let { tree, $root } = this.parse(file, template);
		return this.apply(tree, $root, ctx);
	}

	renderSync(template) {}

	async renderString(str, ctx = {}) {
		let { tree, $root } = this.parse(str);
		return this.apply(tree, $root, ctx);
	}

	renderStringSync(str) {

	}

	tag(tagName) {
		return this.tags[tagName];
	}

	addTag(ctor) {
		ctor.tagNames.forEach(tagName => {
			this.tags[tagName] = [ctor, types.$tag_start];
			if (!ctor.singular) {
				this.tags[`end${tagName}`] = [ctor, types.$tag_end];
			}
		});

		(ctor.insideTagNames || []).forEach(tagName => {
			this.tags[tagName] = [ctor, types.$tag_inside];
		});
	}
}

export default Feuille;