export function block() {
	// todo
}

export function dump(...args) {
	return args.map(item => JSON.stringify(item, null, 2)).join('\n');
}

/*
	The function version of the {% include %} tag
 */
export function include(candidates, ctx = {}, only = false, ignore_missing = false) {
	// todo
}

/*
	Renders the contents of the parent block
 */
export function parent() {
	// todo
}

/*
	Retrieves the raw source of a template,
	or an array of templates.
 */
export function source(candidates) {
	return this.options.loader(candidates, this.cwd);
}