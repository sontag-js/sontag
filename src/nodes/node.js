/*
	The Node base class
	-------------------

	Represents an item in the AST,
	all other types extend this class.
 */
export default class Node {

	toString() {
		return `${this.constructor.name}`;
	}

	/* 
		Render the node to a string by applying the `scope`.
		By default a Node renders its children. 

		Since the tree structure is not available in the class,
		the function to render children comes from the outside.
	*/
	async render(scope, children, env) {
		return children(scope);
	}
};