export function block() {

}

export function cycle() {

}

export function dump(...args) {
	return args.map(item => JSON.stringify(item, null, 2)).join('\n');
}

export function include() {
	// todo
}

/*
	Renders the contents of the parent block
 */
export function parent() {

}

/*
	Retrieves the raw source of a template
 */
export function source(template) {
	return this.options.loader(template, this.cwd);
}