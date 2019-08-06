/*
	Retrieves the raw source of a template,
	or an array of templates.
 */
export default function source(candidates) {
	return this.options.loader(candidates, this.cwd);
}