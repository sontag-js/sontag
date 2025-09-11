import { parseExpression } from 'acorn-sontag';

/* 
	Parses a Sontag-flavored expression 
	and returns a function that can evaluate it
	when it has its `this` attached to a context.
*/

// The AsyncFunction constructor is not a global object,
// so we need to pick it off an anonymous async function.
let AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

export function expression(str) {
	return new AsyncFunction(
		`return ${ parseExpression(str, { async: true }) }`
	);
}