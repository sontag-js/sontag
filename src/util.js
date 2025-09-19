export function flattenPrototypes(obj, stopAt = null) {
	const chain = [ obj ];
	let proto;
	while ((proto = Object.getPrototypeOf(obj)) && proto !== stopAt) {
		chain.push(proto);
		obj = proto;
	}
	return Object.assign({}, ...chain.reverse());
}